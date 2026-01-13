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
  subscriptions,
  REFERRAL_STATUS,
  REWARD_STATUS,
} from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getAllProducts, getProductsByBrand } from '@/lib/products';
import { generateReferralCode } from '@/lib/referral-server';
import { processOrderStock, restoreStock } from '@/lib/inventory';

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
      case 'charge.refunded':
        await handleChargeRefunded(event.data.object as Stripe.Charge);
        break;
      // These events are related to refunds but we handle everything in charge.refunded
      case 'refund.created':
      case 'refund.updated':
      case 'charge.refund.updated':
        // Silently acknowledge - we handle refund logic in charge.refunded
        break;
      // Subscription events - we handle subscription creation in checkout.session.completed
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
      case 'invoice.paid':
      case 'invoice.payment_failed':
        // Silently acknowledge - subscription creation is handled via checkout.session.completed
        console.log(`Subscription event received: ${event.type}`);
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

  // Check if this is a gift card purchase
  if (session.metadata?.type === 'gift_card') {
    await handleGiftCardPurchase(session);
    return;
  }

  // Check if this is a subscription purchase
  if (session.metadata?.type === 'subscription') {
    await handleSubscriptionCheckout(session);
    return;
  }

  // Check if order already exists (idempotency check)
  const existingOrder = await db.query.orders.findFirst({
    where: eq(orders.stripeSessionId, session.id),
  });

  if (existingOrder) {
    console.log(`Order already exists for session ${session.id}, skipping`);
    return;
  }

  // Retrieve the full session to get customer and shipping details
  const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
    expand: ['customer_details', 'line_items', 'shipping_cost'],
  }) as Stripe.Checkout.Session;

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

  // Get shipping info - collected_information.shipping_details has the shipping address in newer Stripe API
  // Also check for shipping_details at root level for backwards compatibility
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sessionAny = fullSession as any;
  const shipping = sessionAny.collected_information?.shipping_details || sessionAny.shipping_details;
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

  // Create order items and collect for stock processing
  const orderItemsForStock: Array<{ productId: string; variantId: string; quantity: number }> = [];
  
  for (const item of lineItems.data) {
    const product = item.price?.product as Stripe.Product;
    const metadata = product?.metadata || {};
    
    const productId = metadata.productId || 'unknown';
    const variantId = metadata.variantId || 'unknown';
    const quantity = item.quantity || 1;
    
    await db.insert(orderItems).values({
      id: crypto.randomUUID(),
      orderId,
      productId,
      variantId,
      productName: item.description || 'Unknown Product',
      variantName: metadata.variantId || '',
      productSlug: metadata.productId || '',
      quantity,
      unitPrice: item.price?.unit_amount || 0,
      totalPrice: item.amount_total || 0,
      weight: '250g', // Default weight
      createdAt: now,
    });
    
    // Collect for stock deduction
    if (productId !== 'unknown') {
      orderItemsForStock.push({ productId, variantId, quantity });
    }
  }

  // Deduct stock for order items
  if (orderItemsForStock.length > 0) {
    const stockResult = await processOrderStock(orderItemsForStock);
    if (!stockResult.success) {
      console.warn(`Stock deduction had issues for order ${orderNumber}:`, stockResult.failedItems);
      // Don't fail the order - just log the issue
    }
  }

  // Mark any claimed rewards as used
  const rewardIds = session.metadata?.rewardIds;
  if (rewardIds) {
    const ids = rewardIds.split(',').filter(Boolean);
    for (const rewardId of ids) {
      try {
        await db.update(referralRewards)
          .set({
            status: REWARD_STATUS.CLAIMED,
            claimedOrderId: orderId,
            claimedAt: now,
          })
          .where(and(
            eq(referralRewards.id, rewardId),
            eq(referralRewards.status, REWARD_STATUS.PENDING)
          ));
        console.log(`Reward ${rewardId} marked as claimed with order ${orderId}`);
      } catch (error) {
        console.error(`Failed to mark reward ${rewardId} as claimed:`, error);
      }
    }
  }

  // Process referral if code was used
  if (referralCodeUsed) {
    await processReferralReward(referralCodeUsed, customer.id, orderId, email, subtotal, now);
  }

  // Redeem gift card if used
  const giftCardId = session.metadata?.giftCardId;
  const giftCardAmount = session.metadata?.giftCardAmount ? parseInt(session.metadata.giftCardAmount, 10) : 0;
  
  if (giftCardId && giftCardAmount > 0) {
    try {
      const { redeemGiftCard } = await import('@/lib/gift-cards');
      const result = await redeemGiftCard(giftCardId, giftCardAmount, orderId);
      console.log(`Gift card ${giftCardId} redeemed: ${giftCardAmount} cents used, ${result.newBalance} cents remaining`);
    } catch (error) {
      console.error(`Failed to redeem gift card ${giftCardId}:`, error);
      // Don't fail the order - the discount was already applied in Stripe
    }
  }

  // Generate invoice automatically
  let invoiceId: string | null = null;
  let invoiceNumber: string | null = null;
  try {
    const { generateInvoiceForOrder } = await import('@/lib/invoice');
    const result = await generateInvoiceForOrder(orderId);
    invoiceId = result.invoiceId;
    invoiceNumber = result.invoiceNumber;
    console.log(`Invoice ${invoiceNumber} (${invoiceId}) generated for order ${orderNumber}`);
  } catch (error) {
    // Log but don't fail the webhook - invoice can be generated on-demand later
    console.error(`Failed to generate invoice for order ${orderNumber}:`, error);
  }

  console.log(`Order ${orderNumber} created successfully for ${email}`);

  // Fetch the created order and items for email
  const createdOrder = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
  });
  const createdItems = await db.query.orderItems.findMany({
    where: eq(orderItems.orderId, orderId),
  });

  // Send emails (don't fail webhook if email fails)
  if (createdOrder && createdItems.length > 0) {
    try {
      const { sendOrderConfirmationEmail, sendAdminNewOrderEmail } = await import('@/lib/email');
      
      // Fetch invoice PDF if available
      let invoicePdf: ArrayBuffer | undefined;
      if (invoiceId) {
        try {
          const { getInvoicePdf } = await import('@/lib/invoice');
          invoicePdf = await getInvoicePdf(invoiceId);
          console.log(`Invoice PDF fetched for order ${orderNumber}`);
        } catch (pdfError) {
          console.error(`Failed to fetch invoice PDF for order ${orderNumber}:`, pdfError);
        }
      }
      
      // Send order confirmation to customer (with invoice attached if available)
      await sendOrderConfirmationEmail({
        order: createdOrder,
        items: createdItems,
        locale: 'de', // Default to German, could detect from session
        invoicePdf,
        invoiceNumber: invoiceNumber || undefined,
      });
      
      // Send new order notification to admin
      await sendAdminNewOrderEmail({
        order: createdOrder,
        items: createdItems,
      });
    } catch (emailError) {
      console.error(`Failed to send emails for order ${orderNumber}:`, emailError);
    }
  }
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

  // === ABUSE PREVENTION ===
  // Check referrer's refund rate before granting reward
  // If too many of their referrals resulted in refunds, suspend rewards
  const abuseCheck = await checkReferrerAbusePattern(referralCode.customerId);
  
  if (abuseCheck.isSuspicious) {
    console.log(`Referrer ${referralCode.customerId} flagged for abuse: ${abuseCheck.reason}`);
    console.log(`Referral recorded but reward withheld pending review`);
    
    // Still create the referral record (for tracking) but don't give reward
    const referralId = crypto.randomUUID();
    await db.insert(referrals).values({
      id: referralId,
      referrerCodeId: referralCode.id,
      referrerId: referralCode.customerId,
      referredId: referredCustomerId,
      referredEmail: referredEmail.toLowerCase(),
      status: REFERRAL_STATUS.QUALIFIED, // Qualified but no reward
      qualifyingOrderId: orderId,
      createdAt: now,
      qualifiedAt: now,
    });
    
    // Update usage count
    await db.update(referralCodes)
      .set({ timesUsed: referralCode.timesUsed + 1 })
      .where(eq(referralCodes.id, referralCode.id));
    
    return; // Exit without creating reward
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
  const rewardProduct = await selectRandomProduct();
  
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

/**
 * Check if a referrer shows abuse patterns (high refund rate among their referrals)
 * 
 * Rules:
 * - Admin can mark customer as "trusted" to bypass all checks
 * - Admin can mark customer as "suspended" to permanently block rewards
 * - If referrer has 3+ referrals AND 50%+ resulted in refunds → suspicious
 * - If referrer has 2+ refunded referrals in the last 30 days → suspicious
 * - First-time referrers always get benefit of the doubt
 */
async function checkReferrerAbusePattern(referrerId: string): Promise<{ isSuspicious: boolean; reason: string }> {
  // First check admin overrides on the customer record
  const customer = await db.query.customers.findFirst({
    where: eq(customers.id, referrerId),
  });

  if (!customer) {
    return { isSuspicious: true, reason: 'Referrer customer not found' };
  }

  // Admin override: trusted customers bypass all abuse checks
  if (customer.referralTrusted) {
    console.log(`Referrer ${referrerId} is marked as trusted by admin - bypassing abuse checks`);
    return { isSuspicious: false, reason: '' };
  }

  // Admin override: suspended customers never get rewards
  if (customer.referralSuspended) {
    return { 
      isSuspicious: true, 
      reason: `Referrer suspended by admin${customer.referralNotes ? `: ${customer.referralNotes}` : ''}` 
    };
  }

  // Get all referrals made by this referrer
  const referrerReferrals = await db.query.referrals.findMany({
    where: eq(referrals.referrerId, referrerId),
  });

  if (referrerReferrals.length < 3) {
    // Not enough data to determine abuse - give benefit of the doubt
    return { isSuspicious: false, reason: '' };
  }

  // Check how many of their referred orders got refunded
  let refundedCount = 0;
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  let recentRefundCount = 0;

  for (const referral of referrerReferrals) {
    if (referral.qualifyingOrderId) {
      const order = await db.query.orders.findFirst({
        where: eq(orders.id, referral.qualifyingOrderId),
      });
      
      if (order?.status === 'refunded') {
        refundedCount++;
        
        // Check if refund was recent
        if (order.updatedAt && order.updatedAt > thirtyDaysAgo) {
          recentRefundCount++;
        }
      }
    }
  }

  const refundRate = refundedCount / referrerReferrals.length;

  // Rule 1: High overall refund rate (50%+ with at least 3 referrals)
  if (refundRate >= 0.5) {
    return {
      isSuspicious: true,
      reason: `High refund rate: ${refundedCount}/${referrerReferrals.length} (${Math.round(refundRate * 100)}%) referrals refunded`,
    };
  }

  // Rule 2: Multiple recent refunds (2+ in last 30 days)
  if (recentRefundCount >= 2) {
    return {
      isSuspicious: true,
      reason: `Multiple recent refunds: ${recentRefundCount} referrals refunded in last 30 days`,
    };
  }

  return { isSuspicious: false, reason: '' };
}

async function selectRandomProduct() {
  // Fetch coffee products from database
  const coffeeProducts = await getProductsByBrand('coffee');
  
  if (coffeeProducts.length === 0) {
    // Fallback to any product
    const allProducts = await getAllProducts();
    return allProducts[0] || null;
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

async function handleChargeRefunded(charge: Stripe.Charge) {
  console.log('Processing charge.refunded:', charge.id);
  
  const paymentIntentId = charge.payment_intent as string;
  if (!paymentIntentId) {
    console.log('No payment intent on charge, skipping');
    return;
  }

  // Find the order associated with this payment
  const order = await db.query.orders.findFirst({
    where: eq(orders.stripePaymentIntentId, paymentIntentId),
    with: {
      items: true,
    },
  });

  if (!order) {
    console.log(`No order found for payment intent ${paymentIntentId}`);
    return;
  }

  // Restore stock for refunded items
  if (order.items && order.items.length > 0) {
    for (const item of order.items) {
      if (item.productId !== 'unknown') {
        restoreStock(item.productId, item.variantId, item.quantity);
        console.log(`Stock restored for ${item.productId}:${item.variantId} x${item.quantity}`);
      }
    }
  }

  // Update order status
  const now = new Date();
  await db.update(orders)
    .set({
      paymentStatus: 'refunded',
      status: 'refunded',
      updatedAt: now,
    })
    .where(eq(orders.id, order.id));

  console.log(`Order ${order.orderNumber} marked as refunded`);

  // Generate refund invoice (Gutschrift/Credit Note)
  try {
    const { generateRefundInvoiceForOrder } = await import('@/lib/invoice');
    const { invoiceId, invoiceNumber } = await generateRefundInvoiceForOrder(order.id);
    console.log(`Refund invoice ${invoiceNumber} (${invoiceId}) generated for order ${order.orderNumber}`);
  } catch (error) {
    console.error(`Failed to generate refund invoice for order ${order.orderNumber}:`, error);
  }

  // NOTE: We intentionally do NOT revoke the referrer's reward when a refund happens.
  // The referrer still gets their free bag because we acquired a new registered user,
  // which has value even if that user later refunds their first order.
  // The referred customer's discount has already been used and is not recoverable.
  console.log(`Referrer reward (if any) preserved despite refund - new user registration has value`);
}

async function handleGiftCardPurchase(session: Stripe.Checkout.Session) {
  console.log('Processing gift card purchase:', session.id);
  
  const giftCardId = session.metadata?.giftCardId;
  if (!giftCardId) {
    console.error('No gift card ID in session metadata');
    return;
  }
  
  try {
    // Dynamically import to avoid circular dependencies
    const { activateGiftCard, sendGiftCardEmail } = await import('@/lib/gift-cards');
    
    // Activate the gift card
    await activateGiftCard(giftCardId);
    console.log(`Gift card ${giftCardId} activated`);
    
    // Send email to recipient if email delivery was selected
    const deliveryMethod = session.metadata?.deliveryMethod;
    const recipientEmail = session.metadata?.recipientEmail;
    
    if (deliveryMethod === 'email' && recipientEmail) {
      const emailSent = await sendGiftCardEmail(giftCardId);
      if (emailSent) {
        console.log(`Gift card email sent for ${giftCardId}`);
      } else {
        console.log(`Gift card email could not be sent for ${giftCardId} (domain may not be verified)`);
      }
    }
  } catch (error) {
    console.error('Error processing gift card purchase:', error);
    throw error;
  }
}

async function handleSubscriptionCheckout(session: Stripe.Checkout.Session) {
  console.log('Processing subscription checkout:', session.id);
  
  const metadata = session.metadata;
  if (!metadata) {
    console.error('No metadata in subscription session');
    return;
  }
  
  const {
    customerId,
    productId,
    variantId,
    quantity,
    intervalCount,
    intervalUnit,
    shippingAddress: shippingAddressJson,
  } = metadata;
  
  if (!customerId || !productId || !variantId) {
    console.error('Missing required metadata for subscription:', metadata);
    return;
  }
  
  // Check if subscription already exists for this session (idempotency)
  const existingSubscription = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.stripeSubscriptionId, session.subscription as string),
  });
  
  if (existingSubscription) {
    console.log(`Subscription already exists for session ${session.id}, skipping`);
    return;
  }
  
  // Parse shipping address
  let shippingAddress;
  try {
    shippingAddress = JSON.parse(shippingAddressJson || '{}');
  } catch {
    console.error('Failed to parse shipping address');
    shippingAddress = {};
  }
  
  // Get product details
  const { getProductById } = await import('@/lib/products');
  const product = await getProductById(productId);
  
  if (!product) {
    console.error(`Product not found: ${productId}`);
    return;
  }
  
  const variant = product.variants.find(v => v.id === variantId);
  if (!variant) {
    console.error(`Variant not found: ${variantId}`);
    return;
  }
  
  // Calculate price (subscription price with discount)
  const { calculateSubscriptionPrice } = await import('@/lib/subscriptions');
  const unitPrice = calculateSubscriptionPrice(product.basePrice + variant.priceModifier);
  
  // Calculate next delivery date
  const now = new Date();
  const nextDeliveryAt = new Date(now);
  const intervalCountNum = parseInt(intervalCount || '4', 10);
  if (intervalUnit === 'month') {
    nextDeliveryAt.setMonth(nextDeliveryAt.getMonth() + intervalCountNum);
  } else {
    nextDeliveryAt.setDate(nextDeliveryAt.getDate() + (intervalCountNum * 7));
  }
  
  // Create subscription record
  const subscriptionId = crypto.randomUUID();
  
  try {
    await db.insert(subscriptions).values({
      id: subscriptionId,
      customerId,
      stripeSubscriptionId: session.subscription as string || null,
      stripePriceId: null, // Dynamic price, not a stored price
      stripeCustomerId: session.customer as string || null,
      productId,
      variantId,
      productName: product.name.en || product.name.de,
      variantName: variant.name.en || variant.name.de,
      intervalCount: intervalCountNum,
      intervalUnit: intervalUnit || 'week',
      unitPrice,
      quantity: parseInt(quantity || '1', 10),
      shippingFirstName: shippingAddress.firstName || '',
      shippingLastName: shippingAddress.lastName || '',
      shippingLine1: shippingAddress.line1 || '',
      shippingLine2: shippingAddress.line2 || null,
      shippingCity: shippingAddress.city || '',
      shippingPostalCode: shippingAddress.postalCode || '',
      shippingCountry: shippingAddress.country || 'DE',
      status: 'active',
      nextDeliveryAt,
      createdAt: now,
      updatedAt: now,
    });
    
    console.log(`Subscription ${subscriptionId} created for customer ${customerId}`);
  } catch (insertError: unknown) {
    const errorMessage = insertError instanceof Error ? insertError.message : String(insertError);
    if (errorMessage.includes('UNIQUE constraint failed') || errorMessage.includes('unique')) {
      console.log(`Subscription already exists for Stripe ID ${session.subscription} (caught duplicate)`);
      return;
    }
    throw insertError;
  }
}
