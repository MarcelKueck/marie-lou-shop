import { NextResponse } from 'next/server';
import { getCurrentCustomer } from '@/lib/auth';
import { db } from '@/db';
import { giftCards } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

// GET /api/gift-cards/my-purchases - Get gift cards purchased by current user
export async function GET() {
  try {
    const customer = await getCurrentCustomer();
    if (!customer) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const purchasedGiftCards = await db.query.giftCards.findMany({
      where: eq(giftCards.purchasedByEmail, customer.email),
      orderBy: [desc(giftCards.createdAt)],
    });

    return NextResponse.json({
      giftCards: purchasedGiftCards.map(gc => ({
        id: gc.id,
        code: gc.code,
        amount: gc.initialAmount,
        balance: gc.currentBalance,
        currency: gc.currency,
        status: gc.status,
        recipientEmail: gc.recipientEmail,
        recipientName: gc.recipientName,
        personalMessage: gc.personalMessage,
        deliveryMethod: gc.deliveryMethod,
        createdAt: gc.createdAt,
        sentAt: gc.sentAt,
      })),
    });
  } catch (error) {
    console.error('Failed to fetch gift cards:', error);
    return NextResponse.json(
      { error: 'Failed to fetch gift cards' },
      { status: 500 }
    );
  }
}
