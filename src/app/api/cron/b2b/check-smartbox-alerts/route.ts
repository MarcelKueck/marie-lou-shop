import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { b2bCompanies, smartBoxes } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifyCronRequest } from '@/lib/cron-auth';
import { sendSmartBoxLowStockAlertEmail } from '@/lib/b2b-email';

/**
 * SmartBox Alerts Cron Job
 * Runs daily at 8 AM
 * Checks for low stock, offline boxes, and low battery
 */
export async function GET(request: NextRequest) {
  // Verify cron authentication
  if (!verifyCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    const offlineThreshold = new Date(now.getTime() - 48 * 60 * 60 * 1000); // 48 hours ago

    // Get all active SmartBoxes
    const activeBoxes = await db
      .select({
        box: smartBoxes,
        company: b2bCompanies,
      })
      .from(smartBoxes)
      .innerJoin(b2bCompanies, eq(smartBoxes.companyId, b2bCompanies.id))
      .where(eq(smartBoxes.status, 'active'));

    const alerts = {
      lowStock: [] as { box: typeof smartBoxes.$inferSelect; company: typeof b2bCompanies.$inferSelect }[],
      offline: [] as { box: typeof smartBoxes.$inferSelect; company: typeof b2bCompanies.$inferSelect }[],
      lowBattery: [] as { box: typeof smartBoxes.$inferSelect; company: typeof b2bCompanies.$inferSelect }[],
    };

    for (const { box, company } of activeBoxes) {
      // Check low stock (below threshold)
      const fillPercent = box.currentFillPercent || 0;
      const threshold = box.reorderThresholdPercent || 20;
      if (fillPercent <= threshold) {
        alerts.lowStock.push({ box, company });
      }

      // Check offline (no reading in 48 hours)
      if (box.lastReadingAt && box.lastReadingAt < offlineThreshold) {
        alerts.offline.push({ box, company });
        // Update box status to offline
        await db
          .update(smartBoxes)
          .set({ status: 'offline' })
          .where(eq(smartBoxes.id, box.id));
      }

      // Check low battery
      const batteryPercent = box.currentBatteryPercent || 100;
      const batteryThreshold = box.lowBatteryThresholdPercent || 20;
      if (batteryPercent <= batteryThreshold) {
        alerts.lowBattery.push({ box, company });
      }
    }

    // Send low stock alerts to admin and optionally to customers
    for (const { box, company } of alerts.lowStock) {
      try {
        await sendSmartBoxLowStockAlertEmail({
          box,
          company,
          autoReorderTriggered: false,
          locale: 'en',
        });
      } catch (error) {
        console.error(`Failed to send low stock alert for box ${box.id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      totalBoxesChecked: activeBoxes.length,
      alerts: {
        lowStock: alerts.lowStock.length,
        offline: alerts.offline.length,
        lowBattery: alerts.lowBattery.length,
      },
      details: {
        lowStock: alerts.lowStock.map(a => ({
          boxId: a.box.id,
          company: a.company.companyName,
          fillPercent: a.box.currentFillPercent,
        })),
        offline: alerts.offline.map(a => ({
          boxId: a.box.id,
          company: a.company.companyName,
          lastSeen: a.box.lastReadingAt,
        })),
        lowBattery: alerts.lowBattery.map(a => ({
          boxId: a.box.id,
          company: a.company.companyName,
          batteryPercent: a.box.currentBatteryPercent,
        })),
      },
    });
  } catch (error) {
    console.error('SmartBox alerts check error:', error);
    return NextResponse.json(
      { error: 'Failed to check SmartBox alerts' },
      { status: 500 }
    );
  }
}
