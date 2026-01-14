import { NextResponse } from 'next/server';
import { getCurrentB2BCompany } from '@/lib/b2b-auth';
import { db } from '@/db';
import { b2bShipments, smartBoxes } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET() {
  const company = await getCurrentB2BCompany();

  if (!company) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get all shipments for this company
    const shipments = await db
      .select({
        id: b2bShipments.id,
        boxId: b2bShipments.boxId,
        triggerType: b2bShipments.triggerType,
        triggeredAt: b2bShipments.triggeredAt,
        triggerFillPercent: b2bShipments.triggerFillPercent,
        items: b2bShipments.items,
        totalWeightGrams: b2bShipments.totalWeightGrams,
        trackingNumber: b2bShipments.trackingNumber,
        trackingUrl: b2bShipments.trackingUrl,
        carrier: b2bShipments.carrier,
        status: b2bShipments.status,
        createdAt: b2bShipments.createdAt,
        shippedAt: b2bShipments.shippedAt,
        deliveredAt: b2bShipments.deliveredAt,
      })
      .from(b2bShipments)
      .where(eq(b2bShipments.companyId, company.id))
      .orderBy(desc(b2bShipments.createdAt))
      .limit(50);

    // Get box info for each shipment
    const shipmentsWithBoxInfo = await Promise.all(
      shipments.map(async (shipment) => {
        let boxInfo = null;
        if (shipment.boxId) {
          const box = await db
            .select({
              deviceId: smartBoxes.deviceId,
              locationDescription: smartBoxes.locationDescription,
              currentProductName: smartBoxes.currentProductName,
            })
            .from(smartBoxes)
            .where(eq(smartBoxes.id, shipment.boxId))
            .limit(1);
          
          if (box.length > 0) {
            boxInfo = box[0];
          }
        }

        return {
          ...shipment,
          items: JSON.parse(shipment.items || '[]'),
          box: boxInfo,
        };
      })
    );

    return NextResponse.json({ shipments: shipmentsWithBoxInfo });
  } catch (error) {
    console.error('Failed to fetch shipments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shipments' },
      { status: 500 }
    );
  }
}
