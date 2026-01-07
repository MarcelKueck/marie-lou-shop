import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { db } from '@/db';
import { 
  customers, 
  orders, 
  orderItems, 
  referralCodes, 
  referrals, 
  referralRewards,
  REFERRAL_STATUS,
  REWARD_STATUS,
} from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { allProducts } from '@/config/products';
import { generateReferralCode } from '@/lib/referral-server';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  if (!webhookSecret) {
    console.error('Missing STRIPE_WEBHOOK_SECRET');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log('Processing checkout.session.completed:', session.id);

  // Check if order already exists (idempotency check)
  const existingOrder = await db.query.orders.findFirst({
    where: eq(orders.stripeSessionId, session.id),
  });

  if (existingOrder) {
    console.log(`Order already exists for session ${session.id}, skipping`);
    return;
  }

  // Retrieve the full session to get customer and shipping details
  const fullSession = await stripe.checkout.sessions.retrieve(session.id);

  // Expand line items
  const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
    expand: ['data.price.product'],
  });

  // Get customer info
  const email = session.customer_details?.email?.toLowerCase() || '';
  const firstName = session.customer_details?.name?.split(' ')[0] || '';
  const lastName = session.customer_details?.name?.split(' ').slice(1).join(' ') || '';
  const phone = session.customer_details?.phone || null;

  // Get or create customer
  let customer = await db.query.customers.findFirst({
    where: eq(customers.email, email),
  });

  const now = new Date();

  if (!customer) {
    const customerId = crypto.randomUUID();
    await db.insert(customers).values({
      id: customerId,
      email,
      firstName,
      lastName,
      phone,
      stripeCustomerId: session.customer as string || null,
      createdAt: now,
      updatedAt: now,
    });
    customer = await db.query.customers.findFirst({
      where: eq(customers.id, customerId),
    });
  } else {
    // Update existing customer
    await db.update(customers)
      .set({
        firstName: firstName || customer.firstName,
        lastName: lastName || customer.lastName,
        phone: phone || customer.phone,
        stripeCustomerId: session.customer as string || customer.stripeCustomerId,
        updatedAt: now,
      })
      .where(eq(customers.id, customer.id));
  }

  if (!customer) {
    throw new Error('Failed to create or find customer');
  }

  // Ensure customer has a referral code
  const customerReferralCode = await db.query.referralCodes.findFirst({
    where: eq(referralCodes.customerId, customer.id),
  });

  if (!customerReferralCode) {
    const code = await generateReferralCode();
    await db.insert(referralCodes).values({
      id: crypto.randomUUID(),
      customerId: customer.id,
      code,
      createdAt: now,
    });
  }

  // Generate order number
  const orderNumber = generateOrderNumber();

  // Get shipping info - shipping_details has the shipping address, fallback to customer_details
  const shipping = fullSession.shipping_details;
  const customerAddress = fullSession.customer_details?.address;
  const shippingCost = fullSession.shipping_cost?.amount_total ?? 0;
  
  // Debug log to see what we're getting
  console.log('Shipping details:', JSON.stringify(shipping, null, 2));
  console.log('Customer address:', JSON.stringify(customerAddress, null, 2));

  // Calculate order totals
  const subtotal = session.amount_subtotal || 0;
  const total = session.amount_total || 0;
  const discount = session.total_details?.amount_discount || 0;
  const referralCodeUsed = session.metadata?.referralCode || null;

  // Double-check idempotency right before insert (handles race conditions)
  const existingOrderCheck = await db.query.orders.findFirst({
    where: eq(orders.stripeSessionId, session.id),
  });
  if (existingOrderCheck) {
    console.log(`Order already exists for session ${session.id} (race condition prevented)`);
    return;
  }

  // Create order
  const orderId = crypto.randomUUID();
  try {
    await db.insert(orders).values({
      id: orderId,
      orderNumber,
      customerId: customer.id,
      brand: 'marie-lou-coffee', // TODO: Detect from products
      email,
      firstName,
      lastName,
      phone,
      status: 'paid',
      // Shipping address - use shipping_details, fallback to customer_details address
      shippingFirstName: shipping?.name?.split(' ')[0] || firstName,
      shippingLastName: shipping?.name?.split(' ').slice(1).join(' ') || lastName,
      shippingLine1: shipping?.address?.line1 || customerAddress?.line1 || '',
      shippingLine2: shipping?.address?.line2 || customerAddress?.line2 || null,
      shippingCity: shipping?.address?.city || customerAddress?.city || '',
      shippingState: shipping?.address?.state || customerAddress?.state || null,
      shippingPostalCode: shipping?.address?.postal_code || customerAddress?.postal_code || '',
    shippingCountry: shipping?.address?.country || customerAddress?.country || '',
    // Pricing
    shippingMethod: 'standard',
    shippingCost,
    subtotal,
    discount,
    total,
    currency: session.currency?.toUpperCase() || 'EUR',
    // Payment
    stripeSessionId: session.id,
    stripePaymentIntentId: session.payment_intent as string || null,
    paymentStatus: 'paid',
    paidAt: now,
    // Referral
    referralCodeUsed,
    referralDiscount: discount,
    // Timestamps
    createdAt: now,
    updatedAt: now,
  });
  } catch (insertError: unknown) {
    // Handle unique constraint violation (race condition)
    const errorMessage = insertError instanceof Error ? insertError.message : String(insertError);
    if (errorMessage.includes('UNIQUE constraint failed') || errorMessage.includes('unique')) {
      console.log(`Order already exists for session ${session.id} (caught duplicate insert)`);
      return;
    }
    throw insertError;
  }

  // Create order items
  for (const item of lineItems.data) {
    const product = item.price?.product as Stripe.Product;
    const metadata = product?.metadata || {};
    
    await db.insert(orderItems).values({
      id: crypto.randomUUID(),
      orderId,
      productId: metadata.productId || 'unknown',
      variantId: metadata.variantId || 'unknown',
      productName: item.description || 'Unknown Product',
      variantName: metadata.variantId || '',
      productSlug: metadata.productId || '',
      quantity: item.quantity || 1,
      unitPrice: item.price?.unit_amount || 0,
      totalPrice: item.amount_total || 0,
      weight: '250g', // Default weight
      createdAt: now,
    });
  }

  // Process referral if code was used
  if (referralCodeUsed) {
    await processReferralReward(referralCodeUsed, customer.id, orderId, email, subtotal, now);
  }

  // Generate invoice automatically
  try {
    const { generateInvoiceForOrder } = await import('@/lib/invoice');
    const { invoiceId, invoiceNumber } = await generateInvoiceForOrder(orderId);
    console.log(`Invoice ${invoiceNumber} (${invoiceId}) generated for order ${orderNumber}`);
  } catch (error) {
    // Log but don't fail the webhook - invoice can be generated on-demand later
    console.error(`Failed to generate invoice for order ${orderNumber}:`, error);
  }

  console.log(`Order ${orderNumber} created successfully for ${email}`);
}

async function processReferralReward(
  code: string,
  referredCustomerId: string,
  orderId: string,
  referredEmail: string,
  orderSubtotal: number,
  now: Date
) {
  // Find the referral code
  const referralCode = await db.query.referralCodes.findFirst({
    where: and(
      eq(referralCodes.code, code.toUpperCase()),
      eq(referralCodes.active, true)
    ),
  });

  if (!referralCode) {
    console.log(`Referral code ${code} not found or inactive`);
    return;
  }

  // Don't allow self-referrals
  if (referralCode.customerId === referredCustomerId) {
    console.log('Self-referral detected, skipping reward');
    return;
  }

  // Check if this customer was already referred
  const existingReferral = await db.query.referrals.findFirst({
    where: eq(referrals.referredEmail, referredEmail.toLowerCase()),
  });

  if (existingReferral) {
    console.log(`Customer ${referredEmail} was already referred`);
    return;
  }

  // Create referral record
  const referralId = crypto.randomUUID();
  await db.insert(referrals).values({
    id: referralId,
    referrerCodeId: referralCode.id,
    referrerId: referralCode.customerId,
    referredId: referredCustomerId,
    referredEmail: referredEmail.toLowerCase(),
    status: REFERRAL_STATUS.QUALIFIED,
    qualifyingOrderId: orderId,
    createdAt: now,
    qualifiedAt: now,
  });

  // Update referral code usage count
  await db.update(referralCodes)
    .set({
      timesUsed: referralCode.timesUsed + 1,
    })
    .where(eq(referralCodes.id, referralCode.id));

  // Create reward for the referrer (random product)
  const rewardProduct = selectRandomProduct();
  
  if (rewardProduct) {
    const rewardId = crypto.randomUUID();
    const defaultVariant = rewardProduct.variants[0];
    
    await db.insert(referralRewards).values({
      id: rewardId,
      customerId: referralCode.customerId,
      referralId,
      productId: rewardProduct.id,
      productName: rewardProduct.name.en,
      productSlug: rewardProduct.slug,
      variantId: defaultVariant.id,
      variantName: defaultVariant.name.en,
      status: REWARD_STATUS.PENDING,
      createdAt: now,
      expiresAt: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000), // 1 year
    });

    // Update referral with reward ID
    await db.update(referrals)
      .set({
        status: REFERRAL_STATUS.REWARDED,
        rewardId,
        rewardedAt: now,
      })
      .where(eq(referrals.id, referralId));

    console.log(`Reward created for referrer ${referralCode.customerId}: ${rewardProduct.name.en}`);
  }
}

function selectRandomProduct() {
  const coffeeProducts = allProducts.filter(p => p.brand === 'coffee');
  
  if (coffeeProducts.length === 0) {
    return allProducts[0]; // Fallback to any product
  }
  
  const randomIndex = Math.floor(Math.random() * coffeeProducts.length);
  return coffeeProducts[randomIndex];
}

function generateOrderNumber(): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  
  return `ML${year}${month}${day}-${random}`;
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment failed:', paymentIntent.id);
  
  // Update order status if it exists
  const order = await db.query.orders.findFirst({
    where: eq(orders.stripePaymentIntentId, paymentIntent.id),
  });

  if (order) {
    await db.update(orders)
      .set({
        paymentStatus: 'failed',
        status: 'payment_failed',
        updatedAt: new Date(),
      })
      .where(eq(orders.id, order.id));
  }
}
