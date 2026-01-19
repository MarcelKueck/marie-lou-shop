import { NextResponse, NextRequest } from 'next/server';
import { verifyCronRequest } from '@/lib/cron-auth';
import { db } from '@/db';
import { smartBoxes, b2bCompanies } from '@/db/schema';
import { eq, and, lte } from 'drizzle-orm';
import { endLearningMode, createAlert, recommendBagsPerOrder } from '@/lib/smartbox-algorithm';
import { sendLearningModeCompleteEmail } from '@/lib/b2b-email';

/**
 * Check Learning Mode Cron Job
 * Runs daily at 3am to check boxes that have completed learning mode
 * 
 * After 2 weeks of learning:
 * - Finalizes consumption statistics
 * - Notifies customer of results
 * - Enables automatic reordering
 */
export async function GET(request: NextRequest) {
  const isAuthorized = verifyCronRequest(request);
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    
    // Get all boxes in learning mode where the period has ended
    const boxesEndingLearning = await db
      .select({
        box: smartBoxes,
        company: b2bCompanies,
      })
      .from(smartBoxes)
      .innerJoin(b2bCompanies, eq(smartBoxes.companyId, b2bCompanies.id))
      .where(
        and(
          eq(smartBoxes.learningMode, true),
          lte(smartBoxes.learningModeEndsAt, now)
        )
      );

    const results: { 
      boxId: string; 
      company: string; 
      status: string;
      avgDailyConsumption?: number;
      avgWeeklyConsumption?: number;
    }[] = [];

    for (const { box, company } of boxesEndingLearning) {
      try {
        // End learning mode and finalize stats
        const analysis = await endLearningMode(box.id);
        
        if (!analysis) {
          // Not enough data - extend learning mode
          const newEndDate = new Date();
          newEndDate.setDate(newEndDate.getDate() + 7); // Extend by 1 week
          
          await db.update(smartBoxes)
            .set({ learningModeEndsAt: newEndDate })
            .where(eq(smartBoxes.id, box.id));
          
          results.push({
            boxId: box.id,
            company: company.companyName,
            status: 'extended_insufficient_data',
          });
          continue;
        }
        
        // Calculate estimated bags per week
        const bagSize = box.standardBagSize || 500;
        const estimatedBagsPerWeek = analysis.avgWeeklyConsumption / bagSize;
        
        // Get recommended bags per order based on company size
        const employeeCount = company.employeeCount || 15;
        const employeeRange = 
          employeeCount <= 10 ? '5-10' :
          employeeCount <= 20 ? '10-20' :
          employeeCount <= 35 ? '20-35' :
          employeeCount <= 50 ? '35-50' : '50+';
        const recommendedBags = recommendBagsPerOrder(employeeRange);
        
        // Create info alert
        await createAlert(
          box.companyId,
          {
            type: 'consumption_change',
            severity: 'info',
            title: 'Learning Mode Complete',
            message: `SmartBox "${box.locationDescription || box.deviceId}" has completed learning. Average consumption: ~${Math.round(analysis.avgDailyConsumption)}g/day.`,
            data: {
              avgDailyConsumption: analysis.avgDailyConsumption,
              avgWeeklyConsumption: analysis.avgWeeklyConsumption,
              estimatedBagsPerWeek,
            },
          },
          box.id
        );
        
        // Send email notification
        try {
          await sendLearningModeCompleteEmail({
            to: company.contactEmail,
            companyName: company.companyName,
            boxName: box.locationDescription || box.deviceId,
            avgDailyConsumption: analysis.avgDailyConsumption,
            avgWeeklyConsumption: analysis.avgWeeklyConsumption,
            estimatedBagsPerWeek,
            recommendedBagsPerOrder: recommendedBags,
            portalUrl: `${process.env.NEXT_PUBLIC_APP_URL}/b2b/portal/smartboxes`,
          });
        } catch (emailError) {
          console.error(`Failed to send learning complete email for box ${box.id}:`, emailError);
        }
        
        results.push({
          boxId: box.id,
          company: company.companyName,
          status: 'completed',
          avgDailyConsumption: Math.round(analysis.avgDailyConsumption),
          avgWeeklyConsumption: Math.round(analysis.avgWeeklyConsumption),
        });
      } catch (boxError) {
        console.error(`Failed to end learning mode for box ${box.id}:`, boxError);
        results.push({
          boxId: box.id,
          company: company.companyName,
          status: 'error',
        });
      }
    }

    const completedCount = results.filter(r => r.status === 'completed').length;
    const extendedCount = results.filter(r => r.status === 'extended_insufficient_data').length;

    return NextResponse.json({
      success: true,
      message: `Processed ${results.length} boxes: ${completedCount} completed, ${extendedCount} extended`,
      results,
      checkedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Check learning mode error:', error);
    return NextResponse.json(
      { error: 'Failed to check learning mode' },
      { status: 500 }
    );
  }
}
