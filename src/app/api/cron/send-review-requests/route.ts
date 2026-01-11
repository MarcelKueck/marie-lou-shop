import { NextRequest, NextResponse } from 'next/server';
import { verifyCronRequest, unauthorizedResponse, logCronStart, logCronComplete, logCronError } from '@/lib/cron-auth';
import { db } from '@/db';
import { orders } from '@/db/schema';
import { eq, and, lte, isNull } from 'drizzle-orm';
import { sendReviewRequestEmail } from '@/lib/email';

const JOB_NAME = 'send-review-requests';

// Send review requests 7 days after delivery
const DAYS_AFTER_DELIVERY = 7;

export async function GET(request: NextRequest) {
  if (!verifyCronRequest(request)) {
    return unauthorizedResponse();
  }

  logCronStart(JOB_NAME);

  try {
    const now = new Date();
    const targetDate = new Date(now);
    targetDate.setDate(targetDate.getDate() - DAYS_AFTER_DELIVERY);

    // Find orders that:
    // 1. Were delivered at least 7 days ago
    // 2. Haven't received a review request yet
    // 3. Are in 'delivered' status
    const eligibleOrders = await db.query.orders.findMany({
      where: and(
        eq(orders.status, 'delivered'),
        lte(orders.deliveredAt, targetDate),
        isNull(orders.reviewRequestSentAt)
      ),
      limit: 50, // Process in batches to avoid timeouts
    });

    console.log(`Found ${eligibleOrders.length} orders eligible for review requests`);

    let sentCount = 0;
    let errorCount = 0;

    for (const order of eligibleOrders) {
      try {
        const result = await sendReviewRequestEmail(order, 'de');
        
        if (result.success) {
          // Mark the order as having received a review request
          await db.update(orders)
            .set({ reviewRequestSentAt: now })
            .where(eq(orders.id, order.id));
          
          sentCount++;
          console.log(`Review request sent for order ${order.orderNumber}`);
        } else {
          errorCount++;
          console.error(`Failed to send review request for order ${order.orderNumber}: ${result.error}`);
        }
      } catch (error) {
        errorCount++;
        console.error(`Error processing order ${order.orderNumber}:`, error);
      }

      // Small delay between emails to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const result = {
      processed: eligibleOrders.length,
      sent: sentCount,
      errors: errorCount,
    };

    logCronComplete(JOB_NAME, result);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    logCronError(JOB_NAME, error);
    return NextResponse.json(
      { error: 'Cron job failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
