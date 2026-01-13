import { NextRequest, NextResponse } from 'next/server';
import { getCurrentCustomer } from '@/lib/auth';
import { SUBSCRIPTION_INTERVALS, calculateSubscriptionPrice } from '@/lib/subscriptions';
import { getProductById } from '@/lib/products';
import { stripe } from '@/lib/stripe';

// POST /api/subscriptions/create - Create a new subscription
export async function POST(request: NextRequest) {
  try {
    const customer = await getCurrentCustomer();
    if (!customer) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      productId, 
      variantId, 
      quantity = 1, 
      intervalCount, 
      intervalUnit,
      shippingAddress,
      locale = 'de',
    } = body;

    // Validate product
    const product = await getProductById(productId);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 400 });
    }

    const variant = product.variants.find(v => v.id === variantId);
    if (!variant) {
      return NextResponse.json({ error: 'Variant not found' }, { status: 400 });
    }

    // Validate interval
    const validInterval = SUBSCRIPTION_INTERVALS.find(
      i => i.value === intervalCount && i.unit === intervalUnit
    );
    if (!validInterval) {
      return NextResponse.json({ error: 'Invalid subscription interval' }, { status: 400 });
    }

    // Validate shipping address
    if (!shippingAddress || !shippingAddress.firstName || !shippingAddress.line1) {
      return NextResponse.json({ error: 'Valid shipping address required' }, { status: 400 });
    }

    // Calculate subscription price (with discount)
    const unitPrice = calculateSubscriptionPrice(product.basePrice + variant.priceModifier);
    
    // Get or create Stripe customer
    let stripeCustomerId = customer.stripeCustomerId;
    if (!stripeCustomerId) {
      const stripeCustomer = await stripe.customers.create({
        email: customer.email,
        name: `${customer.firstName || ''} ${customer.lastName || ''}`.trim(),
        metadata: {
          customerId: customer.id,
        },
      });
      stripeCustomerId = stripeCustomer.id;
    }

    // Create subscription checkout session
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    const localeKey = locale as 'de' | 'en';
    
    // Helper to get full image URL
    const getImageUrl = (image: string | null | undefined): string[] | undefined => {
      if (!image) return undefined;
      // If already absolute URL (Vercel Blob), use as is
      if (image.startsWith('http://') || image.startsWith('https://')) {
        return [image];
      }
      // Otherwise, prepend base URL for local images
      return [`${baseUrl}${image}`];
    };
    
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: stripeCustomerId,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `${product.name[localeKey]} - ${variant.name[localeKey]} (Abo)`,
              description: localeKey === 'de' 
                ? `Automatische Lieferung ${validInterval.label.de.toLowerCase()}`
                : `Automatic delivery ${validInterval.label.en.toLowerCase()}`,
              images: getImageUrl(product.image),
              metadata: {
                productId: product.id,
                variantId: variant.id,
                type: 'subscription',
              },
            },
            unit_amount: unitPrice,
            recurring: {
              interval: intervalUnit === 'week' ? 'week' : 'month',
              interval_count: intervalCount,
            },
          },
          quantity,
        },
      ],
      success_url: `${baseUrl}/${locale}/account?tab=subscriptions&success=true`,
      cancel_url: `${baseUrl}/${locale}/shop/${product.id}`,
      metadata: {
        type: 'subscription',
        customerId: customer.id,
        productId,
        variantId,
        quantity: quantity.toString(),
        intervalCount: intervalCount.toString(),
        intervalUnit,
        shippingAddress: JSON.stringify(shippingAddress),
      },
    });

    return NextResponse.json({ 
      sessionId: session.id, 
      url: session.url,
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 });
  }
}
