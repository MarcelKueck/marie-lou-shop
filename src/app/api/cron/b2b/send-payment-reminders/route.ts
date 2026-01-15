import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { b2bCompanies, b2bOrders, orders } from '@/db/schema';
import { eq, and, lt } from 'drizzle-orm';
import { verifyCronRequest } from '@/lib/cron-auth';
import { sendB2BPaymentReminderEmail } from '@/lib/b2b-email';

/**
 * B2B Payment Reminders Cron Job
 * Runs daily at 9 AM
 * Sends payment reminders for overdue Flex orders
 */
export async function GET(request: NextRequest) {
  // Verify cron authentication
  if (!verifyCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const twentyOneDaysAgo = new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000);

    // Get all unpaid B2B orders with payment due dates
    const unpaidOrders = await db
      .select({
        b2bOrder: b2bOrders,
        order: orders,
        company: b2bCompanies,
      })
      .from(b2bOrders)
      .innerJoin(orders, eq(b2bOrders.orderId, orders.id))
      .innerJoin(b2bCompanies, eq(b2bOrders.companyId, b2bCompanies.id))
      .where(
        and(
          eq(b2bOrders.paymentStatus, 'pending'),
          lt(b2bOrders.paymentDueDate, now)
        )
      );

    const results = {
      processed: 0,
      reminder1Sent: 0, // 7 days overdue
      reminder2Sent: 0, // 14 days overdue
      reminder3Sent: 0, // 21 days overdue
      errors: [] as string[],
    };

    for (const { b2bOrder, order, company } of unpaidOrders) {
      try {
        const dueDate = b2bOrder.paymentDueDate;
        if (!dueDate) continue;

        let reminderLevel = 0;
        let shouldSend = false;

        // Determine which reminder to send
        if (dueDate < twentyOneDaysAgo && !b2bOrder.reminder3SentAt) {
          reminderLevel = 3;
          shouldSend = true;
        } else if (dueDate < fourteenDaysAgo && !b2bOrder.reminder2SentAt) {
          reminderLevel = 2;
          shouldSend = true;
        } else if (dueDate < sevenDaysAgo && !b2bOrder.reminderSentAt) {
          reminderLevel = 1;
          shouldSend = true;
        }

        if (shouldSend) {
          // Send reminder email
          await sendB2BPaymentReminderEmail({
            companyName: company.companyName,
            contactName: `${company.contactFirstName} ${company.contactLastName}`,
            email: company.contactEmail,
            orderNumber: order.orderNumber,
            amount: order.total,
            dueDate: dueDate,
            reminderLevel,
          });

          // Update reminder sent timestamp
          const updateData: Record<string, Date> = {};
          if (reminderLevel === 1) updateData.reminderSentAt = now;
          if (reminderLevel === 2) updateData.reminder2SentAt = now;
          if (reminderLevel === 3) updateData.reminder3SentAt = now;

          await db
            .update(b2bOrders)
            .set(updateData)
            .where(eq(b2bOrders.id, b2bOrder.id));

          // Mark as overdue
          await db
            .update(b2bOrders)
            .set({ paymentStatus: 'overdue' })
            .where(eq(b2bOrders.id, b2bOrder.id));

          if (reminderLevel === 1) results.reminder1Sent++;
          if (reminderLevel === 2) results.reminder2Sent++;
          if (reminderLevel === 3) results.reminder3Sent++;
          results.processed++;
        }
      } catch (error) {
        results.errors.push(`Error processing order ${order.orderNumber}: ${error}`);
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      ...results,
    });
  } catch (error) {
    console.error('B2B payment reminders error:', error);
    return NextResponse.json(
      { error: 'Failed to send payment reminders' },
      { status: 500 }
    );
  }
}
