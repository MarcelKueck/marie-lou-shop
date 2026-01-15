import { NextResponse } from 'next/server';
import { db } from '@/db';
import { smartBoxes, boxReadings, b2bCompanies } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

/**
 * SmartBox Reading API
 * Receives weight/fill level readings from SmartBox devices
 * POST /api/devices/reading
 */

interface SmartBoxReading {
  deviceId: string; // Hardware device ID
  apiKey: string; // Device API key for authentication
  weight: number; // Current weight in grams
  fillPercent?: number; // Calculated fill percentage
  batteryLevel?: number; // Battery percentage (0-100)
  temperature?: number; // Temperature in Celsius
  signalStrength?: number; // WiFi signal strength (dBm)
  firmwareVersion?: string;
  timestamp?: string; // ISO timestamp, defaults to now
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as SmartBoxReading;
    
    // Validate required fields
    if (!body.deviceId || !body.apiKey || body.weight === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: deviceId, apiKey, weight' },
        { status: 400 }
      );
    }
    
    // Find the SmartBox by hardware device ID
    const smartBox = await db
      .select()
      .from(smartBoxes)
      .where(eq(smartBoxes.deviceId, body.deviceId))
      .limit(1);
    
    if (!smartBox[0]) {
      return NextResponse.json(
        { error: 'Device not found' },
        { status: 404 }
      );
    }
    
    const box = smartBox[0];
    
    // Check if device is active
    if (box.status !== 'active') {
      return NextResponse.json(
        { error: 'Device is not active' },
        { status: 403 }
      );
    }
    
    // Calculate fill percentage if not provided
    const maxWeightGrams = box.capacityKg * 1000;
    const fillPercent = body.fillPercent ?? Math.max(0, Math.min(100, (body.weight / maxWeightGrams) * 100));
    
    // Get company info for auto-reorder logic
    const company = await db
      .select()
      .from(b2bCompanies)
      .where(eq(b2bCompanies.id, box.companyId))
      .limit(1);
    
    const now = new Date();
    const readingId = uuidv4();
    
    // Insert the reading
    await db.insert(boxReadings).values({
      id: readingId,
      boxId: box.id,
      weightGrams: body.weight,
      fillPercent: Math.round(fillPercent),
      batteryPercent: body.batteryLevel,
      temperature: body.temperature,
      signalStrength: body.signalStrength,
      firmwareVersion: body.firmwareVersion,
      recordedAt: body.timestamp ? new Date(body.timestamp) : now,
      receivedAt: now,
    });
    
    // Update SmartBox current status
    await db
      .update(smartBoxes)
      .set({
        currentWeightGrams: body.weight,
        currentFillPercent: Math.round(fillPercent),
        currentBatteryPercent: body.batteryLevel,
        lastReadingAt: now,
        lastOnlineAt: now,
        firmwareVersion: body.firmwareVersion || box.firmwareVersion,
      })
      .where(eq(smartBoxes.id, box.id));
    
    // Determine alert level
    const reorderThreshold = box.reorderThresholdPercent || 20;
    const criticalThreshold = 10; // Always critical at 10%
    
    let alertLevel: 'normal' | 'low' | 'critical' = 'normal';
    let shouldTriggerReorder = false;
    
    // Smart tier companies with active status get auto-reorder
    const isSmartTier = company[0]?.tier?.startsWith('smart') ?? false;
    const isActive = company[0]?.status === 'active';
    
    if (fillPercent <= criticalThreshold) {
      alertLevel = 'critical';
      shouldTriggerReorder = isSmartTier && isActive;
    } else if (fillPercent <= reorderThreshold) {
      alertLevel = 'low';
      shouldTriggerReorder = isSmartTier && isActive;
    }
    
    // Return response with status and any actions
    return NextResponse.json({
      success: true,
      readingId,
      status: {
        fillPercent: Math.round(fillPercent),
        alertLevel,
        batteryOk: (body.batteryLevel ?? 100) > (box.lowBatteryThresholdPercent || 20),
        connectionStrength: getConnectionStrength(body.signalStrength),
      },
      actions: {
        reorderTriggered: shouldTriggerReorder && alertLevel !== 'normal',
      },
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error('SmartBox reading error:', error);
    return NextResponse.json(
      { error: 'Failed to process reading' },
      { status: 500 }
    );
  }
}

function getConnectionStrength(signalStrength?: number): 'excellent' | 'good' | 'fair' | 'poor' {
  if (signalStrength === undefined) return 'good';
  if (signalStrength >= -50) return 'excellent';
  if (signalStrength >= -60) return 'good';
  if (signalStrength >= -70) return 'fair';
  return 'poor';
}
