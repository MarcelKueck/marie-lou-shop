import { NextResponse } from 'next/server';
import { db } from '@/db';
import { smartBoxes, b2bCompanies } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { 
  processBoxReading, 
  checkReorderNeeded, 
  createAlert,
  isInLearningMode
} from '@/lib/smartbox-algorithm';

/**
 * SmartBox Reading API (V2 - Bag Storage Monitor)
 * Receives weight/fill level readings from SmartBox devices
 * POST /api/devices/reading
 * 
 * V2 Concept: SmartBox monitors sealed bags, not loose beans!
 * - Standard bag sizes: 250g, 500g, 750g, 1000g
 * - One bag ≈ one day's consumption
 * - Reorder at 20% fill level (configurable)
 */

interface SmartBoxReadingRequest {
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
    const body = await request.json() as SmartBoxReadingRequest;
    
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
    if (box.status !== 'active' && box.status !== 'pending') {
      return NextResponse.json(
        { error: 'Device is not active' },
        { status: 403 }
      );
    }
    
    // Get company info for auto-reorder logic
    const company = await db
      .select()
      .from(b2bCompanies)
      .where(eq(b2bCompanies.id, box.companyId))
      .limit(1);
    
    // Process the reading using V2 algorithm (handles saving, alerts, etc.)
    const alerts = await processBoxReading({
      boxId: box.id,
      weightGrams: body.weight,
      batteryPercent: body.batteryLevel ?? 100,
      signalStrength: body.signalStrength,
      temperature: body.temperature,
      firmwareVersion: body.firmwareVersion,
    });
    
    // Create alerts in the database
    for (const alert of alerts) {
      await createAlert(box.companyId, alert, box.id);
    }
    
    // Check if reorder should be triggered
    const reorderDecision = await checkReorderNeeded(box.id);
    
    // Smart tier companies with active status get auto-reorder
    const isSmartTier = company[0]?.tier?.startsWith('smart') ?? false;
    const isActive = company[0]?.status === 'active';
    const shouldTriggerReorder = reorderDecision.shouldReorder && isSmartTier && isActive;
    
    // Check learning mode status
    const inLearningMode = await isInLearningMode(box.id);
    
    // Calculate fill percentage
    const maxWeightGrams = box.capacityKg * 1000;
    const fillPercent = Math.max(0, Math.min(100, (body.weight / maxWeightGrams) * 100));
    
    // Return response with status and any actions
    return NextResponse.json({
      success: true,
      status: {
        fillPercent: Math.round(fillPercent),
        alertLevel: reorderDecision.urgency === 'critical' ? 'critical' 
          : reorderDecision.urgency === 'urgent' ? 'low' 
          : 'normal',
        batteryOk: (body.batteryLevel ?? 100) > (box.lowBatteryThresholdPercent || 20),
        connectionStrength: getConnectionStrength(body.signalStrength),
        inLearningMode,
        estimatedDaysRemaining: reorderDecision.estimatedDaysRemaining,
      },
      alerts: alerts.map(a => ({
        type: a.type,
        severity: a.severity,
        message: a.message,
      })),
      actions: {
        reorderTriggered: shouldTriggerReorder,
        reorderReason: reorderDecision.reason,
        suggestedBags: reorderDecision.suggestedBags,
      },
      timestamp: new Date().toISOString(),
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
