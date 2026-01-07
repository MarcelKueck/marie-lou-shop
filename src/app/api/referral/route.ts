import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { referralCodes, referrals, referralRewards, orders } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { getCurrentCustomer } from '@/lib/auth';
import { generateReferralCode } from '@/lib/referral-server';
import {
  getReferralLink,
  generateShareLinks,
  REFERRAL_DISCOUNT_PERCENT,
  REFERRAL_MINIMUM_ORDER,
  REFERRAL_LINK_EXPIRY_DAYS,
} from '@/lib/referral';

/**
 * GET /api/referral
 * Get current user's referral code and stats
 */
export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const customer = await getCurrentCustomer(sessionToken);
    if (!customer) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's referral code
    const referralCode = await db.query.referralCodes.findFirst({
      where: eq(referralCodes.customerId, customer.id),
    });

    if (!referralCode) {
      return NextResponse.json({
        hasCode: false,
        message: 'Complete your first order to get a referral code',
        programDetails: {
          discountPercent: REFERRAL_DISCOUNT_PERCENT,
          minimumOrder: REFERRAL_MINIMUM_ORDER / 100,
          linkExpiryDays: REFERRAL_LINK_EXPIRY_DAYS,
        },
      });
    }

    // Get referral stats
    const stats = await db.select({
      totalReferrals: sql<number>`count(*)`,
      pendingReferrals: sql<number>`sum(case when status = 'pending' then 1 else 0 end)`,
      qualifiedReferrals: sql<number>`sum(case when status in ('qualified', 'rewarded') then 1 else 0 end)`,
    }).from(referrals).where(eq(referrals.referrerCodeId, referralCode.id));

    // Get reward stats
    const rewardStats = await db.select({
      totalRewards: sql<number>`count(*)`,
      pendingRewards: sql<number>`sum(case when status = 'pending' then 1 else 0 end)`,
      claimedRewards: sql<number>`sum(case when status in ('claimed', 'shipped') then 1 else 0 end)`,
    }).from(referralRewards).where(eq(referralRewards.customerId, customer.id));

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://marieloucoffee.com';
    const referralLink = getReferralLink(referralCode.code, baseUrl);

    return NextResponse.json({
      hasCode: true,
      code: referralCode.code,
      link: referralLink,
      shareLinks: generateShareLinks(referralLink, 'en'),
      stats: {
        timesUsed: referralCode.timesUsed || 0,
        totalReferrals: stats[0]?.totalReferrals || 0,
        pendingReferrals: stats[0]?.pendingReferrals || 0,
        qualifiedReferrals: stats[0]?.qualifiedReferrals || 0,
        totalRewards: rewardStats[0]?.totalRewards || 0,
        pendingRewards: rewardStats[0]?.pendingRewards || 0,
        claimedRewards: rewardStats[0]?.claimedRewards || 0,
      },
      programDetails: {
        discountPercent: REFERRAL_DISCOUNT_PERCENT,
        minimumOrder: REFERRAL_MINIMUM_ORDER / 100,
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
export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const customer = await getCurrentCustomer(sessionToken);
    if (!customer) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user already has a referral code
    const existingCode = await db.query.referralCodes.findFirst({
      where: eq(referralCodes.customerId, customer.id),
    });

    if (existingCode) {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://marieloucoffee.com';
      const referralLink = getReferralLink(existingCode.code, baseUrl);

      return NextResponse.json({
        success: true,
        code: existingCode.code,
        link: referralLink,
        shareLinks: generateShareLinks(referralLink, 'en'),
        message: 'You already have a referral code',
      });
    }

    // Check if user has completed at least one order (optional)
    const completedOrder = await db.query.orders.findFirst({
      where: and(
        eq(orders.customerId, customer.id),
        eq(orders.paymentStatus, 'paid')
      ),
    });

    // Generate a unique code
    const code = await generateReferralCode();

    // Save to database
    const now = new Date();
    await db.insert(referralCodes).values({
      id: crypto.randomUUID(),
      customerId: customer.id,
      code,
      createdAt: now,
    });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://marieloucoffee.com';
    const referralLink = getReferralLink(code, baseUrl);

    return NextResponse.json({
      success: true,
      code,
      link: referralLink,
      shareLinks: generateShareLinks(referralLink, 'en'),
      message: completedOrder 
        ? 'Referral code created!' 
        : 'Referral code created! Share it with friends and both of you will benefit.',
    });
  } catch (error) {
    console.error('Error generating referral code:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
