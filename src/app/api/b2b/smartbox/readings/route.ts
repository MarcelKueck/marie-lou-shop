import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { smartBoxes, boxReadings, b2bShipments, b2bCompanies } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';

// API Key authentication for IoT devices
const IOT_API_KEY = process.env.B2B_IOT_API_KEY;

interface ReadingPayload {
  deviceId: string;
  weightGrams: number;
  batteryPercent?: number;
  signalStrength?: number;
  firmwareVersion?: string;
  temperature?: number;
  timestamp?: string;
}

export async function POST(request: NextRequest) {
  // Verify API key
  const apiKey = request.headers.get('X-API-Key');
  if (!apiKey || apiKey !== IOT_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body: ReadingPayload = await request.json();
    const { deviceId, weightGrams, batteryPercent, signalStrength, firmwareVersion, temperature, timestamp } = body;

    if (!deviceId || weightGrams === undefined) {
      return NextResponse.json(
        { error: 'deviceId and weightGrams are required' },
        { status: 400 }
      );
    }

    // Find the SmartBox by device ID
    const box = await db
      .select()
      .from(smartBoxes)
      .where(eq(smartBoxes.deviceId, deviceId))
      .limit(1);

    if (box.length === 0) {
      return NextResponse.json({ error: 'SmartBox not found' }, { status: 404 });
    }

    const smartBox = box[0];
    const now = new Date();
    const recordedAt = timestamp ? new Date(timestamp) : now;

    // Calculate fill percentage based on capacity
    const capacityGrams = smartBox.capacityKg * 1000;
    const fillPercent = Math.round((weightGrams / capacityGrams) * 100);

    // Calculate consumption since last reading
    let estimatedConsumptionGrams: number | null = null;
    if (smartBox.currentWeightGrams !== null) {
      estimatedConsumptionGrams = Math.max(0, smartBox.currentWeightGrams - weightGrams);
    }

    // Create the reading record
    const readingId = randomUUID();
    await db.insert(boxReadings).values({
      id: readingId,
      boxId: smartBox.id,
      weightGrams,
      batteryPercent: batteryPercent ?? null,
      signalStrength: signalStrength ?? null,
      fillPercent,
      estimatedConsumptionGrams,
      firmwareVersion: firmwareVersion ?? null,
      temperature: temperature ?? null,
      recordedAt,
      receivedAt: now,
    });

    // Update the SmartBox with current state
    await db
      .update(smartBoxes)
      .set({
        currentWeightGrams: weightGrams,
        currentFillPercent: fillPercent,
        currentBatteryPercent: batteryPercent ?? smartBox.currentBatteryPercent,
        lastReadingAt: recordedAt,
        lastOnlineAt: now,
        firmwareVersion: firmwareVersion ?? smartBox.firmwareVersion,
        status: 'active',
      })
      .where(eq(smartBoxes.id, smartBox.id));

    // Check if reorder should be triggered
    let reorderTriggered = false;
    const threshold = smartBox.reorderThresholdPercent ?? 20;

    if (fillPercent <= threshold && smartBox.status === 'active') {
      // Check if there's already a pending shipment for this box
      const pendingShipments = await db
        .select()
        .from(b2bShipments)
        .where(
          and(
            eq(b2bShipments.boxId, smartBox.id),
            eq(b2bShipments.status, 'pending')
          )
        )
        .limit(1);

      if (pendingShipments.length === 0) {
        // Get company info for the shipment
        const company = await db
          .select()
          .from(b2bCompanies)
          .where(eq(b2bCompanies.id, smartBox.companyId))
          .limit(1);

        if (company.length > 0 && company[0].status === 'active') {
          // Create auto-triggered shipment
          const shipmentId = randomUUID();
          const refillAmount = Math.round(capacityGrams * 0.8); // Refill to 80% capacity

          await db.insert(b2bShipments).values({
            id: shipmentId,
            companyId: smartBox.companyId,
            boxId: smartBox.id,
            triggerType: 'auto_low_stock',
            triggeredAt: now,
            triggerFillPercent: fillPercent,
            items: JSON.stringify([
              {
                productId: smartBox.currentProductId,
                productName: smartBox.currentProductName || 'Coffee',
                quantity: 1,
                weightGrams: refillAmount,
              },
            ]),
            totalWeightGrams: refillAmount,
            status: 'pending',
            createdAt: now,
          });

          reorderTriggered = true;
        }
      }
    }

    // Check for low battery alert
    const lowBatteryAlert = batteryPercent !== undefined && 
      batteryPercent <= (smartBox.lowBatteryThresholdPercent ?? 20);

    return NextResponse.json({
      success: true,
      readingId,
      fillPercent,
      reorderTriggered,
      lowBatteryAlert,
      nextExpectedReadingMinutes: 60, // Tell device when to report next
    });
  } catch (error) {
    console.error('Failed to process SmartBox reading:', error);
    return NextResponse.json(
      { error: 'Failed to process reading' },
      { status: 500 }
    );
  }
}
