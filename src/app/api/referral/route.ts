import { NextResponse } from 'next/server';
import {
  generateReferralCode,
  getReferralLink,
  generateShareLinks,
  REFERRAL_DISCOUNT_PERCENT,
  REFERRAL_MINIMUM_ORDER,
  REFERRAL_LINK_EXPIRY_DAYS,
} from '@/lib/referral';

/**
 * GET /api/referral
 * Get current user's referral code and stats
 * In a real implementation, this would require authentication
 */
export async function GET() {
  try {
    // TODO: Get authenticated user
    // const session = await getSession(request);
    // if (!session?.user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    // TODO: Query database for user's referral code
    // const referralCode = await db.query.referralCodes.findFirst({
    //   where: eq(referralCodes.customerId, session.user.id),
    // });

    // For demo purposes, generate a sample response
    const demoCode = 'MARIE-DEMO1';
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://marieloucoffee.com';
    const referralLink = getReferralLink(demoCode, baseUrl);

    return NextResponse.json({
      hasCode: true,
      code: demoCode,
      link: referralLink,
      shareLinks: generateShareLinks(referralLink, 'en'),
      stats: {
        timesUsed: 0,
        pendingReferrals: 0,
        rewardsEarned: 0,
        rewardsPending: 0,
      },
      programDetails: {
        discountPercent: REFERRAL_DISCOUNT_PERCENT,
        minimumOrder: REFERRAL_MINIMUM_ORDER / 100, // Convert to euros
        linkExpiryDays: REFERRAL_LINK_EXPIRY_DAYS,
      },
    });
  } catch (error) {
    console.error('Error fetching referral info:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/referral
 * Generate a new referral code for the authenticated user
 */
export async function POST() {
  try {
    // TODO: Get authenticated user
    // const session = await getSession(request);
    // if (!session?.user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    // TODO: Check if user already has a referral code
    // const existingCode = await db.query.referralCodes.findFirst({
    //   where: eq(referralCodes.customerId, session.user.id),
    // });
    // if (existingCode) {
    //   return NextResponse.json({ error: 'User already has a referral code' }, { status: 400 });
    // }

    // TODO: Check if user has completed at least one order
    // const completedOrders = await db.query.orders.findMany({
    //   where: and(
    //     eq(orders.customerId, session.user.id),
    //     eq(orders.paymentStatus, 'paid')
    //   ),
    // });
    // if (completedOrders.length === 0) {
    //   return NextResponse.json({ error: 'Must complete at least one order to get a referral code' }, { status: 400 });
    // }

    // Generate a unique code
    const code = generateReferralCode();
    // TODO: In production, check for uniqueness and regenerate if needed
    // while (await codeExists(code)) {
    //   code = generateReferralCode();
    // }

    // TODO: Save to database
    // const newReferralCode = await db.insert(referralCodes).values({
    //   id: crypto.randomUUID(),
    //   customerId: session.user.id,
    //   code,
    //   createdAt: new Date(),
    // });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://marieloucoffee.com';
    const referralLink = getReferralLink(code, baseUrl);

    return NextResponse.json({
      success: true,
      code,
      link: referralLink,
      shareLinks: generateShareLinks(referralLink, 'en'),
    });
  } catch (error) {
    console.error('Error generating referral code:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
