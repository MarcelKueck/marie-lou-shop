import { NextRequest, NextResponse } from 'next/server';
import { getCurrentCustomer } from '@/lib/auth';
import { 
  getCustomerSubscriptions, 
  getSubscription,
  pauseSubscription, 
  resumeSubscription, 
  cancelSubscription,
  updateSubscriptionProduct,
  updateSubscriptionInterval,
  updateSubscriptionAddress,
} from '@/lib/subscriptions';

// GET /api/subscriptions - Get current customer's subscriptions
export async function GET() {
  try {
    const customer = await getCurrentCustomer();
    if (!customer) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const subscriptions = await getCustomerSubscriptions(customer.id);
    return NextResponse.json({ subscriptions });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
  }
}

// PATCH /api/subscriptions - Update subscription
export async function PATCH(request: NextRequest) {
  try {
    const customer = await getCurrentCustomer();
    if (!customer) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { subscriptionId, action, ...data } = body;

    if (!subscriptionId) {
      return NextResponse.json({ error: 'Subscription ID required' }, { status: 400 });
    }

    // Verify subscription belongs to customer
    const subscription = await getSubscription(subscriptionId);
    if (!subscription || subscription.customerId !== customer.id) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    switch (action) {
      case 'pause':
        await pauseSubscription(subscriptionId, data.pauseUntil ? new Date(data.pauseUntil) : undefined);
        break;
      
      case 'resume':
        await resumeSubscription(subscriptionId);
        break;
      
      case 'cancel':
        await cancelSubscription(subscriptionId);
        break;
      
      case 'updateProduct':
        if (!data.productId || !data.variantId) {
          return NextResponse.json({ error: 'Product and variant required' }, { status: 400 });
        }
        await updateSubscriptionProduct(subscriptionId, data.productId, data.variantId, data.quantity);
        break;
      
      case 'updateInterval':
        if (!data.intervalCount || !data.intervalUnit) {
          return NextResponse.json({ error: 'Interval details required' }, { status: 400 });
        }
        await updateSubscriptionInterval(subscriptionId, data.intervalCount, data.intervalUnit);
        break;
      
      case 'updateAddress':
        if (!data.shippingAddress) {
          return NextResponse.json({ error: 'Shipping address required' }, { status: 400 });
        }
        await updateSubscriptionAddress(subscriptionId, data.shippingAddress);
        break;
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const updatedSubscription = await getSubscription(subscriptionId);
    return NextResponse.json({ subscription: updatedSubscription });
  } catch (error) {
    console.error('Error updating subscription:', error);
    return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
  }
}
