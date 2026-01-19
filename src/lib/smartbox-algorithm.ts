/**
 * SmartBox V2 Algorithm
 * 
 * CORE CONCEPT: SmartBox monitors SEALED BAGS, not loose beans!
 * - Standard bag sizes: 250g, 500g, 750g, 1000g
 * - One bag ≈ one day's consumption for a typical office
 * - Reorder when stock drops to 20% fill level (configurable)
 * 
 * The algorithm handles:
 * 1. Learning mode (first 2 weeks) to establish consumption patterns
 * 2. Bag size recommendations based on company size
 * 3. Bags per order recommendations
 * 4. Consumption tracking and anomaly detection
 * 5. Holiday period handling
 * 6. Predictive reordering
 */

import { db } from '@/db';
import { smartBoxes, boxReadings, b2bShipments, b2bHolidayPeriods, b2bAlerts } from '@/db/schema';
import { eq, and, desc, gte, lte, isNull, or } from 'drizzle-orm';
import { nanoid } from 'nanoid';

// ============================================================================
// Types
// ============================================================================

export type BagSize = 250 | 500 | 750 | 1000;

export interface SmartBoxReading {
  boxId: string;
  weightGrams: number;
  batteryPercent: number;
  signalStrength?: number;
  temperature?: number;
  firmwareVersion?: string;
}

export interface ReorderDecision {
  shouldReorder: boolean;
  reason: string;
  urgency: 'normal' | 'urgent' | 'critical';
  estimatedDaysRemaining: number;
  suggestedBags: number;
}

export interface ConsumptionAnalysis {
  avgDailyConsumption: number; // grams per day
  avgWeeklyConsumption: number; // grams per week
  estimatedBagsPerDay: number;
  consumptionTrend: 'increasing' | 'stable' | 'decreasing';
  anomalyDetected: boolean;
  anomalyType?: 'sudden_drop' | 'sudden_spike' | 'unusual_pattern';
}

export interface BoxAlert {
  type: 'low_stock' | 'offline' | 'low_battery' | 'anomaly' | 'restock_reminder' | 'consumption_change';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

// ============================================================================
// Constants
// ============================================================================

const LEARNING_MODE_DURATION_DAYS = 14;
const DEFAULT_REORDER_THRESHOLD_PERCENT = 20;
const OFFLINE_THRESHOLD_HOURS = 48;
const LOW_BATTERY_THRESHOLD_PERCENT = 20;
const MIN_READINGS_FOR_ANALYSIS = 7; // Need at least a week of data
const ANOMALY_THRESHOLD_PERCENT = 50; // 50% change = anomaly

// Bag size recommendations by employee count
const BAG_SIZE_RECOMMENDATIONS: Record<string, BagSize> = {
  '5-10': 250,
  '10-20': 500,
  '20-35': 500,
  '35-50': 750,
  '50+': 1000,
};

// Bags per order recommendations by employee count
const BAGS_PER_ORDER_RECOMMENDATIONS: Record<string, number> = {
  '5-10': 3,
  '10-20': 5,
  '20-35': 7,
  '35-50': 10,
  '50+': 14,
};

// ============================================================================
// Bag Size & Order Recommendations
// ============================================================================

/**
 * Recommend bag size based on company size
 */
export function recommendBagSize(employeeRange: string): BagSize {
  return BAG_SIZE_RECOMMENDATIONS[employeeRange] || 500;
}

/**
 * Recommend bags per order based on company size
 */
export function recommendBagsPerOrder(employeeRange: string): number {
  return BAGS_PER_ORDER_RECOMMENDATIONS[employeeRange] || 5;
}

/**
 * Calculate recommended configuration for a new SmartBox
 */
export function getSmartBoxRecommendedConfig(employeeRange: string): {
  standardBagSize: BagSize;
  bagsPerOrder: number;
  estimatedDaysPerOrder: number;
} {
  const bagSize = recommendBagSize(employeeRange);
  const bags = recommendBagsPerOrder(employeeRange);
  
  // Estimate: 1 bag ≈ 1 day of consumption
  const estimatedDaysPerOrder = bags;
  
  return {
    standardBagSize: bagSize,
    bagsPerOrder: bags,
    estimatedDaysPerOrder,
  };
}

// ============================================================================
// Learning Mode
// ============================================================================

/**
 * Check if a box is in learning mode
 */
export async function isInLearningMode(boxId: string): Promise<boolean> {
  const box = await db.query.smartBoxes.findFirst({
    where: eq(smartBoxes.id, boxId),
    columns: { learningMode: true, learningModeEndsAt: true },
  });
  
  if (!box) return false;
  
  // If explicitly out of learning mode
  if (!box.learningMode) return false;
  
  // If learning mode has expired
  if (box.learningModeEndsAt && new Date() > box.learningModeEndsAt) {
    return false;
  }
  
  return true;
}

/**
 * Initialize learning mode for a new box
 */
export async function initializeLearningMode(boxId: string): Promise<void> {
  const learningModeEndsAt = new Date();
  learningModeEndsAt.setDate(learningModeEndsAt.getDate() + LEARNING_MODE_DURATION_DAYS);
  
  await db.update(smartBoxes)
    .set({
      learningMode: true,
      learningModeEndsAt,
    })
    .where(eq(smartBoxes.id, boxId));
}

/**
 * End learning mode and finalize consumption statistics
 */
export async function endLearningMode(boxId: string): Promise<ConsumptionAnalysis | null> {
  const analysis = await analyzeConsumption(boxId);
  
  if (!analysis) {
    return null;
  }
  
  await db.update(smartBoxes)
    .set({
      learningMode: false,
      avgDailyConsumption: Math.round(analysis.avgDailyConsumption),
      avgWeeklyConsumption: Math.round(analysis.avgWeeklyConsumption),
    })
    .where(eq(smartBoxes.id, boxId));
  
  return analysis;
}

// ============================================================================
// Consumption Analysis
// ============================================================================

/**
 * Analyze consumption patterns from box readings
 */
export async function analyzeConsumption(boxId: string): Promise<ConsumptionAnalysis | null> {
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  
  // Get readings from the last 2 weeks
  const readings = await db.query.boxReadings.findMany({
    where: and(
      eq(boxReadings.boxId, boxId),
      gte(boxReadings.recordedAt, twoWeeksAgo)
    ),
    orderBy: [desc(boxReadings.recordedAt)],
  });
  
  if (readings.length < MIN_READINGS_FOR_ANALYSIS) {
    return null;
  }
  
  // Get the box's bag size
  const box = await db.query.smartBoxes.findFirst({
    where: eq(smartBoxes.id, boxId),
    columns: { standardBagSize: true },
  });
  
  const bagSize = box?.standardBagSize || 500;
  
  // Calculate daily consumption from weight changes
  const dailyConsumptions: number[] = [];
  
  for (let i = 0; i < readings.length - 1; i++) {
    const current = readings[i];
    const previous = readings[i + 1];
    
    // Calculate time difference in days
    const currentTime = current.recordedAt instanceof Date ? current.recordedAt.getTime() : current.recordedAt;
    const previousTime = previous.recordedAt instanceof Date ? previous.recordedAt.getTime() : previous.recordedAt;
    const daysDiff = (currentTime - previousTime) / (1000 * 60 * 60 * 24);
    
    if (daysDiff > 0 && daysDiff < 2) { // Only use readings within reasonable time windows
      const weightDiff = (previous.weightGrams || 0) - (current.weightGrams || 0);
      
      if (weightDiff > 0) { // Only count consumption (weight going down)
        const dailyRate = weightDiff / daysDiff;
        dailyConsumptions.push(dailyRate);
      }
    }
  }
  
  if (dailyConsumptions.length === 0) {
    return null;
  }
  
  // Calculate averages
  const avgDailyConsumption = dailyConsumptions.reduce((a, b) => a + b, 0) / dailyConsumptions.length;
  const avgWeeklyConsumption = avgDailyConsumption * 7;
  
  // Estimate bags per day
  const estimatedBagsPerDay = avgDailyConsumption / bagSize;
  
  // Detect trend (compare first half vs second half)
  const midpoint = Math.floor(dailyConsumptions.length / 2);
  const firstHalf = dailyConsumptions.slice(0, midpoint);
  const secondHalf = dailyConsumptions.slice(midpoint);
  
  const firstHalfAvg = firstHalf.reduce((a, b) => a + b, 0) / (firstHalf.length || 1);
  const secondHalfAvg = secondHalf.reduce((a, b) => a + b, 0) / (secondHalf.length || 1);
  
  let consumptionTrend: 'increasing' | 'stable' | 'decreasing' = 'stable';
  const trendChangePercent = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;
  
  if (trendChangePercent > 20) {
    consumptionTrend = 'increasing';
  } else if (trendChangePercent < -20) {
    consumptionTrend = 'decreasing';
  }
  
  // Detect anomalies (sudden spikes or drops)
  let anomalyDetected = false;
  let anomalyType: 'sudden_drop' | 'sudden_spike' | 'unusual_pattern' | undefined;
  
  // Check the most recent reading against average
  if (dailyConsumptions.length > 0) {
    const recentConsumption = dailyConsumptions[0];
    const changeFromAvg = ((recentConsumption - avgDailyConsumption) / avgDailyConsumption) * 100;
    
    if (Math.abs(changeFromAvg) > ANOMALY_THRESHOLD_PERCENT) {
      anomalyDetected = true;
      anomalyType = changeFromAvg > 0 ? 'sudden_spike' : 'sudden_drop';
    }
  }
  
  return {
    avgDailyConsumption,
    avgWeeklyConsumption,
    estimatedBagsPerDay,
    consumptionTrend,
    anomalyDetected,
    anomalyType,
  };
}

/**
 * Update consumption statistics for a box
 */
export async function updateConsumptionStats(boxId: string): Promise<void> {
  const analysis = await analyzeConsumption(boxId);
  
  if (!analysis) return;
  
  await db.update(smartBoxes)
    .set({
      avgDailyConsumption: Math.round(analysis.avgDailyConsumption),
      avgWeeklyConsumption: Math.round(analysis.avgWeeklyConsumption),
    })
    .where(eq(smartBoxes.id, boxId));
}

// ============================================================================
// Box Reading Processing
// ============================================================================

/**
 * Process a new reading from a SmartBox
 * Returns any alerts that should be created
 */
export async function processBoxReading(reading: SmartBoxReading): Promise<BoxAlert[]> {
  const alerts: BoxAlert[] = [];
  
  // Get the box
  const box = await db.query.smartBoxes.findFirst({
    where: eq(smartBoxes.id, reading.boxId),
  });
  
  if (!box) {
    console.error(`SmartBox not found: ${reading.boxId}`);
    return alerts;
  }
  
  // Calculate fill percent based on capacity
  const capacityGrams = (box.capacityKg || 2) * 1000;
  const fillPercent = Math.round((reading.weightGrams / capacityGrams) * 100);
  
  // Save the reading
  await db.insert(boxReadings).values({
    id: nanoid(),
    boxId: reading.boxId,
    weightGrams: reading.weightGrams,
    batteryPercent: reading.batteryPercent,
    signalStrength: reading.signalStrength,
    temperature: reading.temperature,
    firmwareVersion: reading.firmwareVersion,
    fillPercent,
    recordedAt: new Date(),
    receivedAt: new Date(),
  });
  
  // Update box state
  await db.update(smartBoxes)
    .set({
      currentWeightGrams: reading.weightGrams,
      currentFillPercent: fillPercent,
      currentBatteryPercent: reading.batteryPercent,
      lastReadingAt: new Date(),
      lastOnlineAt: new Date(),
      status: 'active',
      firmwareVersion: reading.firmwareVersion,
    })
    .where(eq(smartBoxes.id, reading.boxId));
  
  // Check for low stock alert
  const reorderThreshold = box.reorderThresholdPercent || DEFAULT_REORDER_THRESHOLD_PERCENT;
  if (fillPercent <= reorderThreshold) {
    alerts.push({
      type: 'low_stock',
      severity: fillPercent <= 10 ? 'critical' : 'warning',
      title: 'Low Stock Alert',
      message: `SmartBox "${box.locationDescription || box.deviceId}" is at ${fillPercent}% capacity.`,
      data: { fillPercent, weightGrams: reading.weightGrams, threshold: reorderThreshold },
    });
  }
  
  // Check for low battery alert
  const batteryThreshold = box.lowBatteryThresholdPercent || LOW_BATTERY_THRESHOLD_PERCENT;
  if (reading.batteryPercent <= batteryThreshold) {
    alerts.push({
      type: 'low_battery',
      severity: reading.batteryPercent <= 10 ? 'critical' : 'warning',
      title: 'Low Battery Alert',
      message: `SmartBox "${box.locationDescription || box.deviceId}" battery is at ${reading.batteryPercent}%.`,
      data: { batteryPercent: reading.batteryPercent, threshold: batteryThreshold },
    });
  }
  
  // Check for consumption anomaly (only if not in learning mode)
  if (!box.learningMode && box.avgDailyConsumption) {
    const analysis = await analyzeConsumption(reading.boxId);
    if (analysis?.anomalyDetected) {
      alerts.push({
        type: 'anomaly',
        severity: 'warning',
        title: 'Consumption Anomaly Detected',
        message: `SmartBox "${box.locationDescription || box.deviceId}" shows unusual consumption pattern: ${analysis.anomalyType}.`,
        data: { 
          anomalyType: analysis.anomalyType,
          avgDailyConsumption: box.avgDailyConsumption,
          currentTrend: analysis.consumptionTrend,
        },
      });
    }
  }
  
  return alerts;
}

// ============================================================================
// Reorder Decision Logic
// ============================================================================

/**
 * Check if a reorder should be triggered for a box
 */
export async function checkReorderNeeded(boxId: string): Promise<ReorderDecision> {
  const box = await db.query.smartBoxes.findFirst({
    where: eq(smartBoxes.id, boxId),
  });
  
  if (!box) {
    return {
      shouldReorder: false,
      reason: 'Box not found',
      urgency: 'normal',
      estimatedDaysRemaining: 0,
      suggestedBags: 0,
    };
  }
  
  // Check if in holiday mode
  const isHoliday = await isInHolidayPeriod(box.companyId, boxId);
  if (isHoliday) {
    return {
      shouldReorder: false,
      reason: 'Company is in holiday period',
      urgency: 'normal',
      estimatedDaysRemaining: 0,
      suggestedBags: 0,
    };
  }
  
  const fillPercent = box.currentFillPercent || 0;
  const reorderThreshold = box.reorderThresholdPercent || DEFAULT_REORDER_THRESHOLD_PERCENT;
  const bagSize = box.standardBagSize || 500;
  const bagsPerOrder = box.bagsPerOrder || 5;
  const avgDailyConsumption = box.avgDailyConsumption || bagSize; // Default to 1 bag/day
  
  // Calculate estimated days remaining
  const currentWeightGrams = box.currentWeightGrams || 0;
  const estimatedDaysRemaining = avgDailyConsumption > 0 
    ? Math.floor(currentWeightGrams / avgDailyConsumption)
    : 7; // Default to 1 week if no data
  
  // Check if a pending shipment already exists
  const pendingShipment = await db.query.b2bShipments.findFirst({
    where: and(
      eq(b2bShipments.boxId, boxId),
      eq(b2bShipments.status, 'pending')
    ),
  });
  
  if (pendingShipment) {
    return {
      shouldReorder: false,
      reason: 'A shipment is already pending for this box',
      urgency: 'normal',
      estimatedDaysRemaining,
      suggestedBags: 0,
    };
  }
  
  // Determine if we should reorder
  if (fillPercent <= reorderThreshold) {
    // Determine urgency
    let urgency: 'normal' | 'urgent' | 'critical' = 'normal';
    if (estimatedDaysRemaining <= 2) {
      urgency = 'critical';
    } else if (estimatedDaysRemaining <= 4) {
      urgency = 'urgent';
    }
    
    return {
      shouldReorder: true,
      reason: `Stock at ${fillPercent}% (threshold: ${reorderThreshold}%)`,
      urgency,
      estimatedDaysRemaining,
      suggestedBags: bagsPerOrder,
    };
  }
  
  return {
    shouldReorder: false,
    reason: `Stock at ${fillPercent}% (above threshold: ${reorderThreshold}%)`,
    urgency: 'normal',
    estimatedDaysRemaining,
    suggestedBags: 0,
  };
}

/**
 * Detect significant consumption changes
 */
export async function detectConsumptionChange(boxId: string): Promise<{
  changed: boolean;
  percentChange: number;
  oldConsumption: number;
  newConsumption: number;
} | null> {
  const box = await db.query.smartBoxes.findFirst({
    where: eq(smartBoxes.id, boxId),
    columns: { avgDailyConsumption: true },
  });
  
  if (!box?.avgDailyConsumption) return null;
  
  const analysis = await analyzeConsumption(boxId);
  if (!analysis) return null;
  
  const oldConsumption = box.avgDailyConsumption;
  const newConsumption = analysis.avgDailyConsumption;
  const percentChange = ((newConsumption - oldConsumption) / oldConsumption) * 100;
  
  // Significant change is more than 30%
  const changed = Math.abs(percentChange) > 30;
  
  return {
    changed,
    percentChange,
    oldConsumption,
    newConsumption,
  };
}

// ============================================================================
// Holiday Period Handling
// ============================================================================

/**
 * Check if a company/box is in a holiday period
 */
export async function isInHolidayPeriod(
  companyId: string,
  boxId?: string
): Promise<boolean> {
  const now = new Date();
  
  // Check for company-wide or box-specific holiday periods
  const conditions = [
    and(
      eq(b2bHolidayPeriods.companyId, companyId),
      isNull(b2bHolidayPeriods.boxId), // Company-wide
      lte(b2bHolidayPeriods.startDate, now),
      gte(b2bHolidayPeriods.endDate, now)
    ),
  ];
  
  if (boxId) {
    conditions.push(
      and(
        eq(b2bHolidayPeriods.companyId, companyId),
        eq(b2bHolidayPeriods.boxId, boxId), // Box-specific
        lte(b2bHolidayPeriods.startDate, now),
        gte(b2bHolidayPeriods.endDate, now)
      )
    );
  }
  
  const holiday = await db.query.b2bHolidayPeriods.findFirst({
    where: or(...conditions),
  });
  
  return !!holiday;
}

/**
 * Get upcoming holiday periods for a company
 */
export async function getUpcomingHolidays(companyId: string): Promise<typeof b2bHolidayPeriods.$inferSelect[]> {
  const now = new Date();
  
  return db.query.b2bHolidayPeriods.findMany({
    where: and(
      eq(b2bHolidayPeriods.companyId, companyId),
      gte(b2bHolidayPeriods.endDate, now)
    ),
    orderBy: [b2bHolidayPeriods.startDate],
  });
}

/**
 * Create a holiday period
 */
export async function createHolidayPeriod(
  companyId: string,
  startDate: Date,
  endDate: Date,
  reason?: string,
  boxId?: string,
  createdBy?: string
): Promise<string> {
  const id = nanoid();
  
  await db.insert(b2bHolidayPeriods).values({
    id,
    companyId,
    boxId,
    startDate,
    endDate,
    reason,
    createdAt: new Date(),
    createdBy,
  });
  
  return id;
}

// ============================================================================
// Alert Management
// ============================================================================

/**
 * Create an alert in the database
 */
export async function createAlert(
  companyId: string,
  alert: BoxAlert,
  boxId?: string
): Promise<string> {
  const id = nanoid();
  
  await db.insert(b2bAlerts).values({
    id,
    companyId,
    boxId,
    type: alert.type,
    severity: alert.severity,
    title: alert.title,
    message: alert.message,
    data: alert.data ? JSON.stringify(alert.data) : null,
    createdAt: new Date(),
  });
  
  return id;
}

/**
 * Get unresolved alerts for a company
 */
export async function getUnresolvedAlerts(companyId: string): Promise<typeof b2bAlerts.$inferSelect[]> {
  return db.query.b2bAlerts.findMany({
    where: and(
      eq(b2bAlerts.companyId, companyId),
      eq(b2bAlerts.resolved, false)
    ),
    orderBy: [desc(b2bAlerts.createdAt)],
  });
}

/**
 * Resolve an alert
 */
export async function resolveAlert(
  alertId: string,
  resolvedBy?: string,
  notes?: string
): Promise<void> {
  await db.update(b2bAlerts)
    .set({
      resolved: true,
      resolvedAt: new Date(),
      resolvedBy,
      resolutionNotes: notes,
    })
    .where(eq(b2bAlerts.id, alertId));
}

// ============================================================================
// Offline Detection
// ============================================================================

/**
 * Check if a box is offline (no readings for > threshold)
 */
export async function isBoxOffline(boxId: string): Promise<boolean> {
  const box = await db.query.smartBoxes.findFirst({
    where: eq(smartBoxes.id, boxId),
    columns: { lastOnlineAt: true },
  });
  
  if (!box?.lastOnlineAt) return true;
  
  const thresholdMs = OFFLINE_THRESHOLD_HOURS * 60 * 60 * 1000;
  const lastOnline = box.lastOnlineAt instanceof Date ? box.lastOnlineAt.getTime() : box.lastOnlineAt;
  
  return Date.now() - lastOnline > thresholdMs;
}

/**
 * Get all offline boxes
 */
export async function getOfflineBoxes(): Promise<typeof smartBoxes.$inferSelect[]> {
  const thresholdDate = new Date();
  thresholdDate.setHours(thresholdDate.getHours() - OFFLINE_THRESHOLD_HOURS);
  
  return db.query.smartBoxes.findMany({
    where: and(
      eq(smartBoxes.status, 'active'),
      lte(smartBoxes.lastOnlineAt, thresholdDate)
    ),
  });
}

/**
 * Mark a box as offline
 */
export async function markBoxOffline(boxId: string): Promise<void> {
  await db.update(smartBoxes)
    .set({ status: 'offline' })
    .where(eq(smartBoxes.id, boxId));
}

// ============================================================================
// Restock Tracking
// ============================================================================

/**
 * Mark a shipment as restocked (bags placed in SmartBox)
 */
export async function markShipmentRestocked(shipmentId: string): Promise<void> {
  await db.update(b2bShipments)
    .set({ restockedAt: new Date() })
    .where(eq(b2bShipments.id, shipmentId));
}

/**
 * Get delivered shipments awaiting restock confirmation
 */
export async function getShipmentsAwaitingRestock(companyId: string): Promise<typeof b2bShipments.$inferSelect[]> {
  return db.query.b2bShipments.findMany({
    where: and(
      eq(b2bShipments.companyId, companyId),
      eq(b2bShipments.status, 'delivered'),
      isNull(b2bShipments.restockedAt)
    ),
    orderBy: [desc(b2bShipments.deliveredAt)],
  });
}

/**
 * Increment restock reminder count
 */
export async function incrementRestockReminder(shipmentId: string): Promise<number> {
  const shipment = await db.query.b2bShipments.findFirst({
    where: eq(b2bShipments.id, shipmentId),
    columns: { restockRemindersSent: true },
  });
  
  const newCount = (shipment?.restockRemindersSent || 0) + 1;
  
  await db.update(b2bShipments)
    .set({ restockRemindersSent: newCount })
    .where(eq(b2bShipments.id, shipmentId));
  
  return newCount;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Calculate how many bags are needed to fill a box
 */
export function calculateBagsToFill(
  currentWeightGrams: number,
  capacityGrams: number,
  bagSizeGrams: number
): number {
  const spaceAvailable = capacityGrams - currentWeightGrams;
  return Math.floor(spaceAvailable / bagSizeGrams);
}

/**
 * Estimate days until reorder threshold is reached
 */
export function estimateDaysToReorder(
  currentWeightGrams: number,
  avgDailyConsumption: number,
  capacityGrams: number,
  reorderThresholdPercent: number
): number {
  const reorderWeightGrams = (reorderThresholdPercent / 100) * capacityGrams;
  const gramsUntilReorder = currentWeightGrams - reorderWeightGrams;
  
  if (avgDailyConsumption <= 0) return Infinity;
  
  return Math.max(0, Math.floor(gramsUntilReorder / avgDailyConsumption));
}

/**
 * Format weight in human-readable form
 */
export function formatWeight(grams: number): string {
  if (grams >= 1000) {
    return `${(grams / 1000).toFixed(1)}kg`;
  }
  return `${grams}g`;
}

/**
 * Convert employee range string to approximate employee count
 */
export function employeeRangeToCount(range: string): number {
  switch (range) {
    case '5-10': return 8;
    case '10-20': return 15;
    case '20-35': return 28;
    case '35-50': return 42;
    case '50+': return 60;
    default: return 15;
  }
}
