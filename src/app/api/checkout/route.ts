import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { getProductById } from '@/config/products';
import { getShippingZoneByCountry, getDefaultShippingZone } from '@/config/shipping';
import { 
  isValidReferralCodeFormat, 
  calculateReferralDiscount, 
  REFERRAL_DISCOUNT_PERCENT,
  REFERRAL_MINIMUM_ORDER 
} from '@/lib/referral';

interface CartItem {
  productId: string;
  variantId: string;
  quantity: number;
}

interface CheckoutRequest {
  items: CartItem[];
  locale: 'en' | 'de';
  countryCode?: string;
  referralCode?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: CheckoutRequest = await request.json();
    const { items, locale, countryCode, referralCode } = body;

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'No items in cart' },
        { status: 400 }
      );
    }

    // Build line items for Stripe
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    let subtotal = 0;

    for (const item of items) {
      const product = getProductById(item.productId);
      if (!product) {
        return NextResponse.json(
          { error: `Product not found: ${item.productId}` },
          { status: 400 }
        );
      }

      const variant = product.variants.find(v => v.id === item.variantId);
      if (!variant) {
        return NextResponse.json(
          { error: `Variant not found: ${item.variantId}` },
          { status: 400 }
        );
      }

      const unitPrice = product.basePrice + variant.priceModifier;
      subtotal += unitPrice * item.quantity;

      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: {
            name: `${product.name[locale]} - ${variant.name[locale]}`,
            description: product.notes[locale],
            images: product.image ? [`${process.env.NEXT_PUBLIC_BASE_URL}${product.image}`] : undefined,
            metadata: {
              productId: product.id,
              variantId: variant.id,
            },
          },
          unit_amount: unitPrice,
        },
        quantity: item.quantity,
      });
    }

    // Check and apply referral discount
    let discountAmount = 0;
    let validReferralCode: string | undefined;
    
    if (referralCode && isValidReferralCodeFormat(referralCode)) {
      // TODO: In production, verify code exists in database
      // const codeRecord = await db.query.referralCodes.findFirst({
      //   where: and(eq(referralCodes.code, referralCode.toUpperCase()), eq(referralCodes.active, true))
      // });
      
      // For now, accept any valid format code
      if (subtotal >= REFERRAL_MINIMUM_ORDER) {
        discountAmount = calculateReferralDiscount(subtotal);
        validReferralCode = referralCode.toUpperCase();
      }
    }

    // Create discount coupon if referral applies
    const discounts: Stripe.Checkout.SessionCreateParams.Discount[] = [];
    
    if (discountAmount > 0 && validReferralCode) {
      // Create a one-time coupon for this referral
      const coupon = await stripe.coupons.create({
        percent_off: REFERRAL_DISCOUNT_PERCENT,
        duration: 'once',
        name: `Referral: ${validReferralCode}`,
        metadata: {
          referralCode: validReferralCode,
        },
      });
      
      discounts.push({ coupon: coupon.id });
    }

    // Get shipping options
    const zone = countryCode
      ? getShippingZoneByCountry(countryCode) || getDefaultShippingZone()
      : getDefaultShippingZone();

    const shippingOptions: Stripe.Checkout.SessionCreateParams.ShippingOption[] = zone.methods.map(method => ({
      shipping_rate_data: {
        type: 'fixed_amount',
        fixed_amount: {
          amount: method.price,
          currency: 'eur',
        },
        display_name: method.name[locale],
        delivery_estimate: {
          minimum: {
            unit: 'business_day',
            value: method.estimatedDays.min,
          },
          maximum: {
            unit: 'business_day',
            value: method.estimatedDays.max,
          },
        },
      },
    }));

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      discounts: discounts.length > 0 ? discounts : undefined,
      shipping_address_collection: {
        allowed_countries: ['DE', 'AT', 'CH', 'NL', 'BE', 'FR', 'IT', 'ES', 'PL', 'CZ', 'DK', 'SE'],
      },
      shipping_options: shippingOptions,
      billing_address_collection: 'required',
      payment_method_types: ['card', 'klarna', 'sepa_debit'],
      locale: locale === 'de' ? 'de' : 'en',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/${locale}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/${locale}/cart`,
      metadata: {
        locale,
        referralCode: validReferralCode || '',
      },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
