import { NextResponse, NextRequest } from 'next/server';
import { verifyCronRequest } from '@/lib/cron-auth';
import { incrementRestockReminder } from '@/lib/smartbox-algorithm';
import { db } from '@/db';
import { b2bCompanies, b2bShipments, smartBoxes } from '@/db/schema';
import { eq, and, isNull, lte } from 'drizzle-orm';
import { sendRestockReminderEmail } from '@/lib/b2b-email';

/**
 * Check Restock Reminders Cron Job
 * Runs daily at 9am to remind customers to place delivered bags in SmartBox
 * 
 * Sends up to 2 reminders (day 2 and day 4 after delivery)
 */
export async function GET(request: NextRequest) {
  const isAuthorized = verifyCronRequest(request);
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Find delivered shipments that haven't been restocked
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    
    const fourDaysAgo = new Date();
    fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);
    
    const unreatockedShipments = await db
      .select({
        shipment: b2bShipments,
        company: b2bCompanies,
        box: smartBoxes,
      })
      .from(b2bShipments)
      .innerJoin(b2bCompanies, eq(b2bShipments.companyId, b2bCompanies.id))
      .leftJoin(smartBoxes, eq(b2bShipments.boxId, smartBoxes.id))
      .where(
        and(
          eq(b2bShipments.status, 'delivered'),
          isNull(b2bShipments.restockedAt),
          lte(b2bShipments.deliveredAt, twoDaysAgo) // At least 2 days since delivery
        )
      );

    const results: { shipmentId: string; company: string; reminderNumber: number; status: string }[] = [];

    for (const { shipment, company, box } of unreatockedShipments) {
      const remindersSent = shipment.restockRemindersSent || 0;
      
      // Skip if we've already sent 2 reminders
      if (remindersSent >= 2) {
        continue;
      }
      
      // Determine if it's time for a reminder
      const deliveredAt = shipment.deliveredAt;
      if (!deliveredAt) continue;
      
      const daysSinceDelivery = Math.floor(
        (Date.now() - new Date(deliveredAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      
      // First reminder: 2 days after delivery
      // Second reminder: 4 days after delivery
      const shouldSendReminder = 
        (remindersSent === 0 && daysSinceDelivery >= 2) ||
        (remindersSent === 1 && daysSinceDelivery >= 4);
      
      if (!shouldSendReminder) {
        continue;
      }
      
      // Parse shipment items to get product name
      let productName = 'Coffee';
      try {
        const items = JSON.parse(shipment.items || '[]');
        if (items.length > 0) {
          productName = items[0].productName || 'Coffee';
        }
      } catch {
        // Use default product name
      }
      
      // Send reminder email
      try {
        await sendRestockReminderEmail({
          to: company.contactEmail,
          companyName: company.companyName,
          boxName: box?.locationDescription || box?.deviceId || 'SmartBox',
          productName,
          deliveredDate: new Date(deliveredAt),
          reminderNumber: remindersSent + 1,
          portalUrl: `${process.env.NEXT_PUBLIC_APP_URL}/b2b/portal/smartboxes`,
        });
        
        // Increment reminder count
        await incrementRestockReminder(shipment.id);
        
        results.push({
          shipmentId: shipment.id,
          company: company.companyName,
          reminderNumber: remindersSent + 1,
          status: 'sent',
        });
      } catch (emailError) {
        console.error(`Failed to send restock reminder for shipment ${shipment.id}:`, emailError);
        results.push({
          shipmentId: shipment.id,
          company: company.companyName,
          reminderNumber: remindersSent + 1,
          status: 'failed',
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${results.length} restock reminders`,
      results,
      checked: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Check restock reminders error:', error);
    return NextResponse.json(
      { error: 'Failed to check restock reminders' },
      { status: 500 }
    );
  }
}
