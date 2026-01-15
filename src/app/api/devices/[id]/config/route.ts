import { NextResponse } from 'next/server';
import { db } from '@/db';
import { smartBoxes } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * SmartBox Config API
 * GET: Retrieve current configuration for a SmartBox
 * PUT: Update configuration for a SmartBox
 */

interface ConfigUpdate {
  reorderThreshold?: number; // Fill percent to trigger reorder
  lowBatteryThreshold?: number; // Battery percent threshold
  capacityKg?: number; // Maximum capacity in kg
  locationDescription?: string; // Location in office
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Find the SmartBox by ID or device ID
    const smartBox = await db
      .select()
      .from(smartBoxes)
      .where(eq(smartBoxes.id, id))
      .limit(1);
    
    // If not found by ID, try by device ID
    let box = smartBox[0];
    if (!box) {
      const byDeviceId = await db
        .select()
        .from(smartBoxes)
        .where(eq(smartBoxes.deviceId, id))
        .limit(1);
      box = byDeviceId[0];
    }
    
    if (!box) {
      return NextResponse.json(
        { error: 'Device not found' },
        { status: 404 }
      );
    }
    
    // Return current configuration
    return NextResponse.json({
      success: true,
      config: {
        id: box.id,
        deviceId: box.deviceId,
        size: box.size,
        capacityKg: box.capacityKg,
        productType: box.productType,
        currentProduct: {
          id: box.currentProductId,
          name: box.currentProductName,
        },
        status: box.status,
        reorderThreshold: box.reorderThresholdPercent || 20,
        lowBatteryThreshold: box.lowBatteryThresholdPercent || 20,
        locationDescription: box.locationDescription,
        firmwareVersion: box.firmwareVersion,
        currentState: {
          weightGrams: box.currentWeightGrams,
          fillPercent: box.currentFillPercent,
          batteryPercent: box.currentBatteryPercent,
          lastReadingAt: box.lastReadingAt?.toISOString(),
        },
      },
      serverTime: new Date().toISOString(),
    });
  } catch (error) {
    console.error('SmartBox config GET error:', error);
    return NextResponse.json(
      { error: 'Failed to get configuration' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json() as ConfigUpdate;
    
    // Find the SmartBox
    const smartBox = await db
      .select()
      .from(smartBoxes)
      .where(eq(smartBoxes.id, id))
      .limit(1);
    
    // If not found by ID, try by device ID
    let box = smartBox[0];
    if (!box) {
      const byDeviceId = await db
        .select()
        .from(smartBoxes)
        .where(eq(smartBoxes.deviceId, id))
        .limit(1);
      box = byDeviceId[0];
    }
    
    if (!box) {
      return NextResponse.json(
        { error: 'Device not found' },
        { status: 404 }
      );
    }
    
    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {};
    
    if (body.reorderThreshold !== undefined) {
      updateData.reorderThresholdPercent = Math.max(5, Math.min(50, body.reorderThreshold));
    }
    if (body.lowBatteryThreshold !== undefined) {
      updateData.lowBatteryThresholdPercent = Math.max(5, Math.min(30, body.lowBatteryThreshold));
    }
    if (body.capacityKg !== undefined) {
      updateData.capacityKg = Math.max(0.5, Math.min(10, body.capacityKg));
    }
    if (body.locationDescription !== undefined) {
      updateData.locationDescription = body.locationDescription;
    }
    
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }
    
    // Update the SmartBox
    await db
      .update(smartBoxes)
      .set(updateData)
      .where(eq(smartBoxes.id, box.id));
    
    return NextResponse.json({
      success: true,
      message: 'Configuration updated',
      updatedFields: Object.keys(updateData),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('SmartBox config PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update configuration' },
      { status: 500 }
    );
  }
}

// Also support POST for devices that don't support PUT
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return PUT(request, { params });
}
