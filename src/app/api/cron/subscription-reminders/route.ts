import { NextRequest, NextResponse } from 'next/server';
import { verifyCronRequest, unauthorizedResponse } from '@/lib/cron-auth';
import { db } from '@/db';
import { subscriptions, customers } from '@/db/schema';
import { eq, and, lte, gte } from 'drizzle-orm';
import { sendSubscriptionReminderEmail } from '@/lib/email';

export async function GET(request: NextRequest) {
  if (!verifyCronRequest(request)) {
    return unauthorizedResponse();
  }

  try {
    // Find subscriptions due in 3 days
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    threeDaysFromNow.setHours(23, 59, 59, 999);
    
    const twoDaysFromNow = new Date();
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
    twoDaysFromNow.setHours(0, 0, 0, 0);
    
    // Get active subscriptions due in ~3 days (between 2-3 days from now)
    const upcomingSubscriptions = await db.query.subscriptions.findMany({
      where: and(
        eq(subscriptions.status, 'active'),
        gte(subscriptions.nextDeliveryAt, twoDaysFromNow),
        lte(subscriptions.nextDeliveryAt, threeDaysFromNow)
      ),
    });
    
    let sent = 0;
    let failed = 0;
    
    for (const subscription of upcomingSubscriptions) {
      try {
        // Get customer info
        const customer = await db.query.customers.findFirst({
          where: eq(customers.id, subscription.customerId),
        });
        
        if (!customer || !customer.email) {
          console.log(`No customer email for subscription ${subscription.id}`);
          continue;
        }
        
        // Build items array from single product subscription
        const items = [{
          productName: subscription.productName,
          variantName: subscription.variantName,
          quantity: subscription.quantity,
          unitPrice: subscription.unitPrice,
        }];
        
        // Calculate total
        const total = subscription.unitPrice * subscription.quantity;
        
        // Send reminder email
        await sendSubscriptionReminderEmail({
          email: customer.email,
          firstName: customer.firstName || 'Kunde',
          subscriptionId: subscription.id,
          nextDeliveryDate: subscription.nextDeliveryAt!,
          items: items,
          total: total,
          brand: 'coffee', // Default brand - subscriptions don't have brand field
          locale: 'de', // Default to German
        });
        
        sent++;
      } catch (error) {
        console.error(`Failed to send reminder for subscription ${subscription.id}:`, error);
        failed++;
      }
    }
    
    return NextResponse.json({
      success: true,
      sent,
      failed,
      total: upcomingSubscriptions.length,
    });
  } catch (error) {
    console.error('Cron subscription-reminders error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
