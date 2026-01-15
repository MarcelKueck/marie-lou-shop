import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { b2bCompanies, b2bOrders, orders } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { verifyCronRequest } from '@/lib/cron-auth';
import { sendB2BShipmentReminderEmail } from '@/lib/b2b-email';

/**
 * B2B Shipment Reminders Cron Job
 * Runs weekly on Mondays at 8 AM
 * Reminds Flex customers about upcoming scheduled shipments
 */
export async function GET(request: NextRequest) {
  // Verify cron authentication
  if (!verifyCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    // Check for Flex companies that haven't ordered in 21+ days
    const reminderThreshold = new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000);

    // Get all active Flex tier companies
    const companies = await db
      .select()
      .from(b2bCompanies)
      .where(
        and(
          eq(b2bCompanies.tier, 'flex'),
          eq(b2bCompanies.status, 'active')
        )
      );

    const results = {
      processed: 0,
      remindersSent: 0,
      errors: [] as string[],
    };

    for (const company of companies) {
      try {
        // Get last order for this company
        const lastOrder = await db
          .select()
          .from(b2bOrders)
          .innerJoin(orders, eq(b2bOrders.orderId, orders.id))
          .where(eq(b2bOrders.companyId, company.id))
          .orderBy(b2bOrders.createdAt)
          .limit(1);

        const lastOrderDate = lastOrder[0]?.b2b_orders?.createdAt;
        
        // Skip if no previous orders or recent order
        if (!lastOrderDate || lastOrderDate > reminderThreshold) {
          results.processed++;
          continue;
        }

        const daysSinceLastOrder = Math.ceil(
          (now.getTime() - lastOrderDate.getTime()) / (24 * 60 * 60 * 1000)
        );

        // Send reminder if 21-30 days since last order
        if (daysSinceLastOrder >= 21 && daysSinceLastOrder <= 30) {
          // Estimate next order date as 7 days from now
          const estimatedNextOrder = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          
          await sendB2BShipmentReminderEmail({
            companyName: company.companyName,
            contactName: `${company.contactFirstName} ${company.contactLastName}`,
            email: company.contactEmail,
            scheduledDate: estimatedNextOrder,
            daysUntil: 7,
            estimatedQuantity: company.employeeCount 
              ? `${company.employeeCount * 2} units` 
              : 'Based on your consumption',
            lastOrderDate: lastOrderDate,
          });

          results.remindersSent++;
        }
        results.processed++;
      } catch (error) {
        results.errors.push(`Error processing company ${company.companyName}: ${error}`);
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      ...results,
    });
  } catch (error) {
    console.error('B2B shipment reminders error:', error);
    return NextResponse.json(
      { error: 'Failed to send shipment reminders' },
      { status: 500 }
    );
  }
}
