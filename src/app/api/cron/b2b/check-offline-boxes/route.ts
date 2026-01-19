import { NextResponse, NextRequest } from 'next/server';
import { verifyCronRequest } from '@/lib/cron-auth';
import { getOfflineBoxes, markBoxOffline, createAlert } from '@/lib/smartbox-algorithm';
import { db } from '@/db';
import { b2bCompanies } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { sendSmartBoxOfflineEmail } from '@/lib/b2b-email';

/**
 * Check Offline Boxes Cron Job
 * Runs daily at 8am to detect and alert on offline SmartBoxes
 * 
 * A box is considered offline if no reading received in 48+ hours
 */
export async function GET(request: NextRequest) {
  const isAuthorized = verifyCronRequest(request);
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const offlineBoxes = await getOfflineBoxes();
    
    if (offlineBoxes.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No offline boxes detected',
        checked: new Date().toISOString(),
      });
    }

    const results: { boxId: string; company: string; status: string }[] = [];

    for (const box of offlineBoxes) {
      // Mark box as offline in database
      await markBoxOffline(box.id);

      // Get company info
      const company = await db.query.b2bCompanies.findFirst({
        where: eq(b2bCompanies.id, box.companyId),
      });

      // Create alert
      await createAlert(
        box.companyId,
        {
          type: 'offline',
          severity: 'warning',
          title: 'SmartBox Offline',
          message: `SmartBox "${box.locationDescription || box.deviceId}" has been offline for over 48 hours.`,
          data: {
            deviceId: box.deviceId,
            lastOnlineAt: box.lastOnlineAt?.toISOString(),
          },
        },
        box.id
      );

      // Send email notification
      if (company?.contactEmail) {
        try {
          await sendSmartBoxOfflineEmail({
            to: company.contactEmail,
            companyName: company.companyName,
            boxName: box.locationDescription || box.deviceId,
            lastOnline: box.lastOnlineAt,
            portalUrl: `${process.env.NEXT_PUBLIC_APP_URL}/b2b/portal/smartboxes`,
          });
        } catch (emailError) {
          console.error(`Failed to send offline email for box ${box.id}:`, emailError);
        }
      }

      results.push({
        boxId: box.id,
        company: company?.companyName || 'Unknown',
        status: 'marked_offline_and_alerted',
      });
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${offlineBoxes.length} offline boxes`,
      results,
      checked: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Check offline boxes error:', error);
    return NextResponse.json(
      { error: 'Failed to check offline boxes' },
      { status: 500 }
    );
  }
}
