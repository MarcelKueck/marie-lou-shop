import { NextRequest, NextResponse } from 'next/server';
import { verifyCronRequest, unauthorizedResponse } from '@/lib/cron-auth';
import { db } from '@/db';
import { subscriptions, subscriptionOrders, orders, orderItems, customers } from '@/db/schema';
import { eq, lte, and } from 'drizzle-orm';
import { stripe } from '@/lib/stripe';

export async function GET(request: NextRequest) {
  if (!verifyCronRequest(request)) {
    return unauthorizedResponse();
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Find subscriptions due today
    const dueSubscriptions = await db.query.subscriptions.findMany({
      where: and(
        eq(subscriptions.status, 'active'),
        lte(subscriptions.nextDeliveryAt, today)
      ),
    });
    
    let processed = 0;
    let failed = 0;
    const errors: string[] = [];
    
    for (const subscription of dueSubscriptions) {
      try {
        // Get customer info
        const customer = await db.query.customers.findFirst({
          where: eq(customers.id, subscription.customerId),
        });
        
        if (!customer) {
          console.log(`Customer not found for subscription ${subscription.id}`);
          continue;
        }
        
        // Calculate total
        const total = subscription.unitPrice * subscription.quantity;
        
        // Charge customer via Stripe if they have a payment method
        if (subscription.stripeCustomerId) {
          try {
            const paymentIntent = await stripe.paymentIntents.create({
              amount: total,
              currency: 'eur',
              customer: subscription.stripeCustomerId,
              automatic_payment_methods: {
                enabled: true,
                allow_redirects: 'never',
              },
              metadata: {
                subscriptionId: subscription.id,
                type: 'subscription_renewal',
              },
              confirm: true,
              off_session: true,
            });
            
            if (paymentIntent.status !== 'succeeded') {
              throw new Error(`Payment not succeeded: ${paymentIntent.status}`);
            }
          } catch (stripeError) {
            console.error(`Stripe payment failed for subscription ${subscription.id}:`, stripeError);
            // Update subscription status to past_due
            await db.update(subscriptions)
              .set({ status: 'past_due', updatedAt: new Date() })
              .where(eq(subscriptions.id, subscription.id));
            failed++;
            errors.push(`Subscription ${subscription.id}: Payment failed`);
            continue;
          }
        }
        
        // Create order from subscription
        const orderId = crypto.randomUUID();
        const orderNumber = `ML-${Date.now().toString(36).toUpperCase()}`;
        const now = new Date();
        
        await db.insert(orders).values({
          id: orderId,
          orderNumber,
          customerId: subscription.customerId,
          brand: 'coffee', // Default brand
          status: 'paid',
          email: customer.email,
          firstName: customer.firstName || '',
          lastName: customer.lastName || '',
          phone: customer.phone || null,
          subtotal: total,
          shippingMethod: 'standard', // Default shipping for subscriptions
          shippingCost: 0, // Free shipping for subscriptions
          tax: 0,
          total: total,
          currency: 'EUR',
          shippingFirstName: customer.firstName || '',
          shippingLastName: customer.lastName || '',
          shippingLine1: subscription.shippingLine1,
          shippingLine2: subscription.shippingLine2,
          shippingCity: subscription.shippingCity,
          shippingPostalCode: subscription.shippingPostalCode,
          shippingCountry: subscription.shippingCountry,
          billingFirstName: customer.firstName || '',
          billingLastName: customer.lastName || '',
          billingLine1: subscription.shippingLine1,
          billingCity: subscription.shippingCity,
          billingPostalCode: subscription.shippingPostalCode,
          billingCountry: subscription.shippingCountry,
          createdAt: now,
          updatedAt: now,
          paidAt: now,
          paymentStatus: 'paid',
        });
        
        // Create order item
        await db.insert(orderItems).values({
          id: crypto.randomUUID(),
          orderId,
          productId: subscription.productId,
          productSlug: subscription.productId, // Using productId as slug fallback
          productName: subscription.productName,
          variantId: subscription.variantId,
          variantName: subscription.variantName,
          quantity: subscription.quantity,
          unitPrice: subscription.unitPrice,
          totalPrice: total,
          weight: '250g', // Default weight
          createdAt: now,
        });
        
        // Record subscription order
        await db.insert(subscriptionOrders).values({
          id: crypto.randomUUID(),
          subscriptionId: subscription.id,
          orderId,
          status: 'paid',
          scheduledFor: subscription.nextDeliveryAt || now,
          paidAt: now,
          createdAt: now,
        });
        
        // Calculate next delivery date based on interval
        const nextDate = new Date(subscription.nextDeliveryAt || now);
        if (subscription.intervalUnit === 'week') {
          nextDate.setDate(nextDate.getDate() + (subscription.intervalCount * 7));
        } else {
          nextDate.setMonth(nextDate.getMonth() + subscription.intervalCount);
        }
        
        // Update subscription
        await db.update(subscriptions)
          .set({
            nextDeliveryAt: nextDate,
            updatedAt: now,
          })
          .where(eq(subscriptions.id, subscription.id));
        
        processed++;
      } catch (error) {
        console.error(`Failed to process subscription ${subscription.id}:`, error);
        errors.push(`Subscription ${subscription.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        failed++;
      }
    }
    
    return NextResponse.json({
      success: true,
      processed,
      failed,
      total: dueSubscriptions.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Cron process-subscriptions error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
