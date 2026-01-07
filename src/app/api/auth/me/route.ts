import { NextRequest, NextResponse } from 'next/server';
import { getCurrentCustomer } from '@/lib/auth';
import { db } from '@/db';
import { referralCodes, referrals, referralRewards, orders } from '@/db/schema';
import { eq, sql, desc } from 'drizzle-orm';
import { REFERRAL_DISCOUNT_PERCENT } from '@/lib/referral';

const SESSION_COOKIE_NAME = 'marie_lou_session';

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const customer = await getCurrentCustomer(sessionToken);

    if (!customer) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get customer's referral code
    const referralCode = await db.query.referralCodes.findFirst({
      where: eq(referralCodes.customerId, customer.id),
    });

    // Get referral stats
    let totalReferrals = 0;
    let completedReferrals = 0;
    let totalRewardsEarned = 0;
    let pendingRewards = 0;

    if (referralCode) {
      // Count referrals and rewarded referrals
      const referralStats = await db.select({
        total: sql<number>`count(*)`,
        rewarded: sql<number>`sum(case when ${referrals.status} = 'rewarded' then 1 else 0 end)`,
      }).from(referrals).where(eq(referrals.referrerCodeId, referralCode.id));

      totalReferrals = referralStats[0]?.total || 0;
      completedReferrals = referralStats[0]?.rewarded || 0;

      // Reward stats for the referrer (counts)
      const rewardStats = await db.select({
        totalRewards: sql<number>`count(*)`,
        pending: sql<number>`sum(case when ${referralRewards.status} = 'pending' then 1 else 0 end)`,
      }).from(referralRewards).where(eq(referralRewards.customerId, referralCode.customerId));

      totalRewardsEarned = rewardStats[0]?.totalRewards || 0;
      pendingRewards = rewardStats[0]?.pending || 0;
    }

    // Get customer's orders
    const customerOrders = await db.query.orders.findMany({
      where: eq(orders.customerId, customer.id),
      orderBy: [desc(orders.createdAt)],
    });

    return NextResponse.json({
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.firstName 
          ? `${customer.firstName}${customer.lastName ? ' ' + customer.lastName : ''}`
          : null,
        firstName: customer.firstName,
        lastName: customer.lastName,
        phone: customer.phone,
        createdAt: customer.createdAt,
      },
      referral: referralCode ? {
        code: referralCode.code,
        discountPercent: REFERRAL_DISCOUNT_PERCENT,
        isActive: referralCode.active,
      } : null,
      stats: {
        totalReferrals,
        completedReferrals,
        totalRewardsEarned,
        pendingRewards,
      },
      orders: customerOrders.map(order => ({
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        total: order.total,
        currency: order.currency,
        createdAt: order.createdAt,
        shippedAt: order.shippedAt,
        deliveredAt: order.deliveredAt,
        trackingNumber: order.trackingNumber,
        trackingUrl: order.trackingUrl,
      })),
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Failed to get user info' },
      { status: 500 }
    );
  }
}
