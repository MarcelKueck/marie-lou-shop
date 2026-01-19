import { NextResponse, NextRequest } from 'next/server';
import { verifyCronRequest } from '@/lib/cron-auth';
import { db } from '@/db';
import { smartBoxes, b2bCompanies } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { 
  updateConsumptionStats, 
  detectConsumptionChange, 
  createAlert 
} from '@/lib/smartbox-algorithm';
import { sendConsumptionChangeEmail } from '@/lib/b2b-email';

/**
 * Update Consumption Stats Cron Job
 * Runs weekly on Sundays at 2am to update consumption statistics
 * 
 * Analyzes the past 2 weeks of readings and updates:
 * - avgDailyConsumption
 * - avgWeeklyConsumption
 * 
 * Also detects significant consumption changes and notifies customers
 */
export async function GET(request: NextRequest) {
  const isAuthorized = verifyCronRequest(request);
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get all active SmartBoxes not in learning mode
    const activeBoxes = await db
      .select({
        box: smartBoxes,
        company: b2bCompanies,
      })
      .from(smartBoxes)
      .innerJoin(b2bCompanies, eq(smartBoxes.companyId, b2bCompanies.id))
      .where(
        and(
          eq(smartBoxes.status, 'active'),
          eq(smartBoxes.learningMode, false)
        )
      );

    const results: { 
      boxId: string; 
      company: string; 
      status: string;
      consumptionChanged?: boolean;
      percentChange?: number;
    }[] = [];

    for (const { box, company } of activeBoxes) {
      try {
        // Check for significant consumption change before updating
        const changeResult = await detectConsumptionChange(box.id);
        
        // Update consumption stats
        await updateConsumptionStats(box.id);
        
        // If consumption changed significantly, notify the customer
        if (changeResult?.changed) {
          // Create alert
          await createAlert(
            box.companyId,
            {
              type: 'consumption_change',
              severity: 'info',
              title: 'Consumption Pattern Changed',
              message: `Consumption at "${box.locationDescription || box.deviceId}" has ${
                changeResult.percentChange > 0 ? 'increased' : 'decreased'
              } by ${Math.abs(Math.round(changeResult.percentChange))}%.`,
              data: {
                oldConsumption: changeResult.oldConsumption,
                newConsumption: changeResult.newConsumption,
                percentChange: changeResult.percentChange,
              },
            },
            box.id
          );
          
          // Generate recommendation based on change
          let recommendation: string | undefined;
          if (changeResult.percentChange > 30) {
            recommendation = 'Consider increasing your order size to avoid running low.';
          } else if (changeResult.percentChange < -30) {
            recommendation = 'Consider decreasing your order size to keep coffee fresh.';
          }
          
          // Send email notification
          try {
            await sendConsumptionChangeEmail({
              to: company.contactEmail,
              companyName: company.companyName,
              boxName: box.locationDescription || box.deviceId,
              oldConsumption: changeResult.oldConsumption,
              newConsumption: changeResult.newConsumption,
              percentChange: changeResult.percentChange,
              recommendation,
              portalUrl: `${process.env.NEXT_PUBLIC_APP_URL}/b2b/portal/consumption`,
            });
          } catch (emailError) {
            console.error(`Failed to send consumption change email for box ${box.id}:`, emailError);
          }
          
          results.push({
            boxId: box.id,
            company: company.companyName,
            status: 'updated_with_notification',
            consumptionChanged: true,
            percentChange: changeResult.percentChange,
          });
        } else {
          results.push({
            boxId: box.id,
            company: company.companyName,
            status: 'updated',
            consumptionChanged: false,
          });
        }
      } catch (boxError) {
        console.error(`Failed to update consumption for box ${box.id}:`, boxError);
        results.push({
          boxId: box.id,
          company: company.companyName,
          status: 'error',
        });
      }
    }

    const changedCount = results.filter(r => r.consumptionChanged).length;

    return NextResponse.json({
      success: true,
      message: `Updated ${results.length} boxes, ${changedCount} with consumption changes`,
      results,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Update consumption stats error:', error);
    return NextResponse.json(
      { error: 'Failed to update consumption stats' },
      { status: 500 }
    );
  }
}
