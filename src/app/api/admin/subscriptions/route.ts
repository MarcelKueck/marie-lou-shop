import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { subscriptions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { stripe } from '@/lib/stripe';

// GET /api/admin/subscriptions - List all subscriptions
export async function GET() {
  const isAdmin = await isAdminAuthenticated();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const allSubscriptions = await db.query.subscriptions.findMany({
    orderBy: (subscriptions, { desc }) => [desc(subscriptions.createdAt)],
  });

  return NextResponse.json({ subscriptions: allSubscriptions });
}

// PATCH /api/admin/subscriptions - Update subscription status
export async function PATCH(request: NextRequest) {
  const isAdmin = await isAdminAuthenticated();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { subscriptionId, action } = body;

    if (!subscriptionId || !action) {
      return NextResponse.json({ error: 'Missing subscriptionId or action' }, { status: 400 });
    }

    const subscription = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.id, subscriptionId),
    });

    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    const now = new Date();

    switch (action) {
      case 'pause': {
        if (subscription.status !== 'active') {
          return NextResponse.json({ error: 'Can only pause active subscriptions' }, { status: 400 });
        }

        // Pause in Stripe if exists
        if (subscription.stripeSubscriptionId) {
          try {
            await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
              pause_collection: { behavior: 'void' },
            });
          } catch (stripeError) {
            console.error('Stripe pause error:', stripeError);
            // Continue anyway - local state is more important
          }
        }

        await db.update(subscriptions)
          .set({
            status: 'paused',
            pausedAt: now,
            updatedAt: now,
          })
          .where(eq(subscriptions.id, subscriptionId));

        return NextResponse.json({ success: true, status: 'paused' });
      }

      case 'resume': {
        if (subscription.status !== 'paused') {
          return NextResponse.json({ error: 'Can only resume paused subscriptions' }, { status: 400 });
        }

        // Resume in Stripe if exists
        if (subscription.stripeSubscriptionId) {
          try {
            await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
              pause_collection: null,
            });
          } catch (stripeError) {
            console.error('Stripe resume error:', stripeError);
          }
        }

        // Calculate new next delivery date
        const nextDeliveryAt = new Date(now);
        if (subscription.intervalUnit === 'month') {
          nextDeliveryAt.setMonth(nextDeliveryAt.getMonth() + subscription.intervalCount);
        } else {
          nextDeliveryAt.setDate(nextDeliveryAt.getDate() + (subscription.intervalCount * 7));
        }

        await db.update(subscriptions)
          .set({
            status: 'active',
            pausedAt: null,
            pauseUntil: null,
            nextDeliveryAt,
            updatedAt: now,
          })
          .where(eq(subscriptions.id, subscriptionId));

        return NextResponse.json({ success: true, status: 'active' });
      }

      case 'cancel': {
        if (subscription.status === 'cancelled') {
          return NextResponse.json({ error: 'Subscription is already cancelled' }, { status: 400 });
        }

        // Cancel in Stripe if exists
        if (subscription.stripeSubscriptionId) {
          try {
            await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
          } catch (stripeError) {
            console.error('Stripe cancel error:', stripeError);
          }
        }

        await db.update(subscriptions)
          .set({
            status: 'cancelled',
            cancelledAt: now,
            nextDeliveryAt: null,
            updatedAt: now,
          })
          .where(eq(subscriptions.id, subscriptionId));

        return NextResponse.json({ success: true, status: 'cancelled' });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Admin subscription action error:', error);
    return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
  }
}
