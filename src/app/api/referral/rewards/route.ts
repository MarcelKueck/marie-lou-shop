import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { referralRewards, REWARD_STATUS } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getCurrentCustomer } from '@/lib/auth';

/**
 * GET /api/referral/rewards
 * Get current user's pending rewards (free coffee bags)
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

    // Get all rewards for this customer
    const rewards = await db.select().from(referralRewards)
      .where(eq(referralRewards.customerId, customer.id))
      .orderBy(referralRewards.createdAt);

    // Separate by status
    const pendingRewards = rewards.filter(r => r.status === REWARD_STATUS.PENDING);
    const claimedRewards = rewards.filter(r => r.status === REWARD_STATUS.CLAIMED || r.status === REWARD_STATUS.SHIPPED);

    return NextResponse.json({
      pendingRewards: pendingRewards.map(r => ({
        id: r.id,
        productId: r.productId,
        productName: r.productName,
        productSlug: r.productSlug,
        variantId: r.variantId,
        variantName: r.variantName,
        createdAt: r.createdAt,
        expiresAt: r.expiresAt,
      })),
      claimedRewards: claimedRewards.map(r => ({
        id: r.id,
        productName: r.productName,
        variantName: r.variantName,
        status: r.status,
        claimedAt: r.claimedAt,
        shippedSeparately: r.shippedSeparately,
      })),
      stats: {
        pending: pendingRewards.length,
        claimed: claimedRewards.length,
        total: rewards.length,
      },
    });
  } catch (error) {
    console.error('Error fetching rewards:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/referral/rewards
 * Mark a reward as ready to be claimed (added to cart)
 * The actual claiming happens at checkout
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

    const { rewardId, action } = await request.json();

    if (!rewardId || !action) {
      return NextResponse.json(
        { error: 'rewardId and action are required' },
        { status: 400 }
      );
    }

    // Validate action
    if (!['add_to_cart', 'ship_separately'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "add_to_cart" or "ship_separately"' },
        { status: 400 }
      );
    }

    // Find the reward
    const reward = await db.query.referralRewards.findFirst({
      where: and(
        eq(referralRewards.id, rewardId),
        eq(referralRewards.customerId, customer.id),
        eq(referralRewards.status, REWARD_STATUS.PENDING)
      ),
    });

    if (!reward) {
      return NextResponse.json(
        { error: 'Reward not found or already claimed' },
        { status: 404 }
      );
    }

    // Return the reward details for the cart
    // The actual claiming (status update) happens at checkout completion
    return NextResponse.json({
      success: true,
      action,
      reward: {
        id: reward.id,
        productId: reward.productId,
        productName: reward.productName,
        productSlug: reward.productSlug,
        variantId: reward.variantId,
        variantName: reward.variantName,
      },
      // If shipping separately, include the shipping cost
      shippingCost: action === 'ship_separately' ? 495 : 0, // €4.95 in cents
    });
  } catch (error) {
    console.error('Error claiming reward:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
