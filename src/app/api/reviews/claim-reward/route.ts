import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { reviewRequests, giftCards, customers, REVIEW_REWARD_AMOUNT } from '@/db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

// Generate a unique reward code
function generateRewardCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing chars
  let code = 'DANKE-'; // "Thank you" in German
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// GET /api/reviews/claim-reward - Claim reward after submitting a review
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 });
    }

    // Find the review request
    const reviewRequest = await db.query.reviewRequests.findFirst({
      where: eq(reviewRequests.token, token),
    });

    if (!reviewRequest) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 404 });
    }

    // Check if review was submitted
    if (!reviewRequest.reviewedAt) {
      return NextResponse.json({ error: 'Review not submitted yet' }, { status: 400 });
    }

    // Check if reward already claimed
    if (reviewRequest.rewardClaimedAt && reviewRequest.rewardCode) {
      return NextResponse.json({ 
        code: reviewRequest.rewardCode,
        amount: REVIEW_REWARD_AMOUNT,
        alreadyClaimed: true,
      });
    }

    // Get customer info for the gift card
    const customer = await db.query.customers.findFirst({
      where: eq(customers.id, reviewRequest.customerId),
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const now = new Date();
    
    // Generate unique reward code
    let rewardCode = generateRewardCode();
    let attempts = 0;
    while (attempts < 10) {
      const existing = await db.query.giftCards.findFirst({
        where: eq(giftCards.code, rewardCode),
      });
      if (!existing) break;
      rewardCode = generateRewardCode();
      attempts++;
    }

    // Create a gift card for the reward
    const giftCardId = crypto.randomUUID();
    const expiresAt = new Date(now);
    expiresAt.setFullYear(expiresAt.getFullYear() + 1); // 1 year validity

    await db.insert(giftCards).values({
      id: giftCardId,
      code: rewardCode,
      initialAmount: REVIEW_REWARD_AMOUNT,
      currentBalance: REVIEW_REWARD_AMOUNT,
      currency: 'EUR',
      purchasedByEmail: customer.email,
      purchasedByCustomerId: customer.id,
      recipientEmail: customer.email,
      recipientName: customer.firstName || 'Valued Customer',
      personalMessage: 'Vielen Dank für deine Bewertung! / Thank you for your review!',
      deliveryMethod: 'email',
      status: 'active',
      expiresAt,
      createdAt: now,
      updatedAt: now,
    });

    // Update review request with reward
    await db.update(reviewRequests)
      .set({
        rewardCode,
        rewardClaimedAt: now,
      })
      .where(eq(reviewRequests.id, reviewRequest.id));

    console.log(`Review reward claimed: ${rewardCode} (€${REVIEW_REWARD_AMOUNT / 100}) for customer ${customer.email}`);

    return NextResponse.json({
      code: rewardCode,
      amount: REVIEW_REWARD_AMOUNT,
      alreadyClaimed: false,
    });
  } catch (error) {
    console.error('Error claiming review reward:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
