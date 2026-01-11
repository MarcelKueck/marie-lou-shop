import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createGiftCard, GIFT_CARD_AMOUNTS } from '@/lib/gift-cards';

// POST /api/gift-cards/purchase
// Create a Stripe checkout session for gift card purchase
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      amount, 
      purchaserEmail, 
      recipientEmail, 
      recipientName,
      personalMessage,
      deliveryMethod,
      locale = 'de',
    } = body;
    
    // Validate amount
    const validAmount = GIFT_CARD_AMOUNTS.find(a => a.value === amount);
    if (!validAmount) {
      return NextResponse.json(
        { error: 'Invalid gift card amount' },
        { status: 400 }
      );
    }
    
    // Validate required fields
    if (!purchaserEmail) {
      return NextResponse.json(
        { error: 'Purchaser email is required' },
        { status: 400 }
      );
    }
    
    // Create the gift card (pending status until payment confirmed)
    const giftCard = await createGiftCard({
      amount,
      purchasedByEmail: purchaserEmail,
      recipientEmail: recipientEmail || undefined,
      recipientName: recipientName || undefined,
      personalMessage: personalMessage || undefined,
      deliveryMethod: deliveryMethod || 'email',
    });
    
    // Get base URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: locale === 'de' ? 'Marie Lou Geschenkgutschein' : 'Marie Lou Gift Card',
              description: locale === 'de' 
                ? `Gutschein im Wert von ${validAmount.label}${recipientName ? ` für ${recipientName}` : ''}`
                : `Gift card worth ${validAmount.label}${recipientName ? ` for ${recipientName}` : ''}`,
              images: [`${baseUrl}/images/logos/marieloucoffee.png`],
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      customer_email: purchaserEmail,
      success_url: `${baseUrl}/${locale}/shop/gift-card/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/${locale}/shop/gift-card`,
      metadata: {
        type: 'gift_card',
        giftCardId: giftCard.id,
        recipientEmail: recipientEmail || '',
        recipientName: recipientName || '',
        personalMessage: personalMessage || '',
        deliveryMethod: deliveryMethod || 'email',
        locale,
      },
    });
    
    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('Gift card purchase error:', error);
    return NextResponse.json(
      { error: 'Failed to create gift card checkout session' },
      { status: 500 }
    );
  }
}
