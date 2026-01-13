import { NextRequest, NextResponse } from 'next/server';
import { verifyCronRequest, unauthorizedResponse, logCronStart, logCronComplete, logCronError } from '@/lib/cron-auth';
import { db } from '@/db';
import { orders, orderItems, reviewRequests, REVIEW_REWARD_AMOUNT } from '@/db/schema';
import { eq, and, lte, isNull } from 'drizzle-orm';
import { sendReviewRequestEmail } from '@/lib/email';
import crypto from 'crypto';

const JOB_NAME = 'send-review-requests';

// Send review requests 2 days after delivery
const DAYS_AFTER_DELIVERY = 2;
// Review link expires after 30 days
const REVIEW_LINK_EXPIRY_DAYS = 30;

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
        // Skip orders without a customer ID (guest checkouts without account)
        if (!order.customerId) {
          console.log(`Skipping order ${order.orderNumber} - no customer ID`);
          continue;
        }
        
        // Get order items to create individual review requests
        const items = await db.query.orderItems.findMany({
          where: eq(orderItems.orderId, order.id),
        });
        
        // Create review requests for each product
        const reviewTokens: Array<{
          productId: string;
          productName: string;
          token: string;
        }> = [];
        
        for (const item of items) {
          // Check if review request already exists for this order item
          const existingRequest = await db.query.reviewRequests.findFirst({
            where: and(
              eq(reviewRequests.orderId, order.id),
              eq(reviewRequests.orderItemId, item.id)
            ),
          });
          
          if (!existingRequest) {
            const token = crypto.randomBytes(32).toString('hex');
            const expiresAt = new Date(now);
            expiresAt.setDate(expiresAt.getDate() + REVIEW_LINK_EXPIRY_DAYS);
            
            await db.insert(reviewRequests).values({
              id: crypto.randomUUID(),
              orderId: order.id,
              orderItemId: item.id,
              customerId: order.customerId,
              productId: item.productId,
              token,
              createdAt: now,
              expiresAt,
            });
            
            reviewTokens.push({
              productId: item.productId,
              productName: item.productName,
              token,
            });
          }
        }
        
        // Send email with review links
        if (reviewTokens.length > 0) {
          const result = await sendReviewRequestEmail(order, 'de', reviewTokens, REVIEW_REWARD_AMOUNT);
          
          if (result.success) {
            // Mark the order and review requests as having received email
            await db.update(orders)
              .set({ reviewRequestSentAt: now })
              .where(eq(orders.id, order.id));
            
            for (const rt of reviewTokens) {
              await db.update(reviewRequests)
                .set({ emailSentAt: now })
                .where(eq(reviewRequests.token, rt.token));
            }
            
            sentCount++;
            console.log(`Review request sent for order ${order.orderNumber} with ${reviewTokens.length} products`);
          } else {
            errorCount++;
            console.error(`Failed to send review request for order ${order.orderNumber}: ${result.error}`);
          }
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
