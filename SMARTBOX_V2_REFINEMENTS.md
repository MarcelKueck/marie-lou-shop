# SmartBox V2 — Refined Concept & Implementation Updates

## Overview

This document refines the SmartBox concept based on practical insights and outlines necessary updates to the implemented B2B system.

**Key Insight:** The SmartBox is not a loose-bean container — it's a **bag storage monitor** that holds sealed coffee bags and triggers reorders based on weight.

---

## The Refined Concept

### How It Actually Works

```
SMARTBOX = BAG STORAGE + WEIGHT MONITORING

┌─────────────────────────────────────┐
│         SmartBox (Storage)          │
│  ┌─────────────────────────────┐    │
│  │  📦 Sealed 500g bag         │    │
│  │  📦 Sealed 500g bag         │    │
│  │  📦 Sealed 500g bag         │    │  ← Bags stay sealed until use
│  │  📦 Sealed 500g bag         │    │
│  │  📦 Sealed 250g bag (opened)│    │  ← Only one bag open at a time
│  └─────────────────────────────┘    │
│                                     │
│  ═══════ Load Cell ═══════════      │  ← Measures total weight
│                                     │
│  Total: 2.25 kg    [████████░░]     │
│  Status: 75%       Healthy          │
└─────────────────────────────────────┘
```

### Why This Is Better

| Old Concept                       | New Concept                        |
| --------------------------------- | ---------------------------------- |
| Pour beans into container         | Keep bags sealed in box            |
| Freshness concern (exposed beans) | Freshness guaranteed (sealed bags) |
| User must refill container        | User just drops bags in            |
| Complex vacuum system needed      | No freshness tech needed           |
| Single bag size                   | Multiple bag sizes for flexibility |
| Guessing consumption              | Data-driven bag sizing             |

### The User Experience

```
WEEKLY CYCLE:

Monday Morning:
├── SmartBox shows 5 bags (2.5 kg)
├── Employee opens one 500g bag
├── Pours into coffee machine hopper
└── Throws empty bag in recycling

Throughout Week:
├── Team consumes coffee
├── When bag empty → open next bag
└── SmartBox weight decreases

Friday Evening:
├── SmartBox shows 1 bag left (500g)
├── Weight at 20% → triggers reorder
└── System sends "Order placed" notification

Next Monday:
├── Delivery arrives (4 new bags)
├── Employee puts bags in SmartBox
├── Weight back to 100%
└── Cycle repeats
```

---

## Bag Sizing Strategy

### Standard Bag Sizes

| Bag Size | Target Daily Use | Office Size     | Bags/Week |
| -------- | ---------------- | --------------- | --------- |
| 250g     | ~20 cups/day     | 5-8 employees   | 5 bags    |
| 500g     | ~40 cups/day     | 10-16 employees | 5 bags    |
| 750g     | ~60 cups/day     | 18-24 employees | 5 bags    |
| 1000g    | ~80 cups/day     | 25-32 employees | 5 bags    |

### Calculation Logic

```
INPUTS:
- Employee count
- Estimated cups per employee per day (default: 2.5)
- Working days per week (default: 5)
- Grams per cup (default: 10g for espresso, 12g for filter)

CALCULATION:
daily_grams = employees × cups_per_day × grams_per_cup
weekly_grams = daily_grams × working_days

EXAMPLE (15 employees):
daily = 15 × 2.5 × 10g = 375g/day
weekly = 375g × 5 = 1,875g/week

RECOMMENDATION:
→ 500g bags (closest to 375g daily)
→ 4 bags per week (2,000g, slight buffer)
```

### Bag Size Selection Algorithm

```typescript
function recommendBagSize(employees: number): BagSize {
  const cupsPerDay = employees * 2.5;
  const gramsPerDay = cupsPerDay * 10; // espresso default
  
  if (gramsPerDay <= 300) return '250g';
  if (gramsPerDay <= 600) return '500g';
  if (gramsPerDay <= 900) return '750g';
  return '1000g';
}

function recommendBagsPerWeek(employees: number, bagSize: number): number {
  const weeklyGrams = employees * 2.5 * 10 * 5;
  const bags = Math.ceil(weeklyGrams / bagSize);
  return Math.max(bags, 3); // Minimum 3 bags for buffer
}
```

---

## SmartBox Reorder Algorithm

### Core Logic

```typescript
interface BoxReading {
  boxId: string;
  weightGrams: number;
  timestamp: Date;
  batteryPercent: number;
}

interface BoxConfig {
  capacityGrams: number;      // e.g., 3000g for SmartBox M
  reorderThreshold: number;   // e.g., 0.20 (20%)
  standardBagSize: number;    // e.g., 500g
  bagsPerOrder: number;       // e.g., 5
  leadTimeDays: number;       // e.g., 3
}

async function processBoxReading(reading: BoxReading, config: BoxConfig) {
  const fillPercent = reading.weightGrams / config.capacityGrams;
  
  // Check if below threshold
  if (fillPercent <= config.reorderThreshold) {
    await triggerReorderCheck(reading.boxId, reading.weightGrams, config);
  }
}
```

### Edge Case Handling

This is where the algorithm gets smart:

---

## Edge Cases & Solutions

### Edge Case 1: Order Delivered But Not Restocked

**Scenario:** SmartBox triggers order → delivery arrives → employee forgets to put bags in box → weight still low → system triggers ANOTHER order.

**Solution: Delivery Grace Period**

```typescript
async function triggerReorderCheck(boxId: string, currentWeight: number, config: BoxConfig) {
  // Check for recent pending/delivered orders
  const recentOrder = await getRecentOrder(boxId, { 
    withinDays: 5,
    status: ['pending', 'shipped', 'delivered'] 
  });
  
  if (recentOrder) {
    // Don't reorder, but send reminder
    if (recentOrder.status === 'delivered') {
      await sendNotification(boxId, {
        type: 'restock_reminder',
        message: 'Your coffee delivery arrived but hasn\'t been added to SmartBox yet. Please restock!'
      });
    }
    return; // Don't create duplicate order
  }
  
  // No recent order, safe to reorder
  await createOrder(boxId, config);
}
```

**Notification Flow:**
```
Day 0: Weight hits 20% → Order placed
Day 2: Order delivered
Day 3: Weight still low → "Please restock your SmartBox" email
Day 5: Weight still low → "Urgent: Coffee not restocked" email + admin alert
Day 7: Weight still low → Admin manually investigates
```

---

### Edge Case 2: Sudden Weight Drop (Theft/Accident)

**Scenario:** SmartBox shows 2kg → suddenly shows 200g (someone took all bags, box fell, etc.)

**Solution: Anomaly Detection**

```typescript
async function detectAnomaly(boxId: string, newReading: BoxReading) {
  const lastReading = await getLastReading(boxId);
  
  if (!lastReading) return false;
  
  const weightDrop = lastReading.weightGrams - newReading.weightGrams;
  const dropPercent = weightDrop / lastReading.weightGrams;
  const timeDiffHours = (newReading.timestamp - lastReading.timestamp) / (1000 * 60 * 60);
  
  // Flag if >50% drop in <24 hours (not normal consumption)
  if (dropPercent > 0.5 && timeDiffHours < 24) {
    await createAlert(boxId, {
      type: 'anomaly_detected',
      message: `Unusual weight drop: ${lastReading.weightGrams}g → ${newReading.weightGrams}g`,
      severity: 'warning'
    });
    return true;
  }
  
  return false;
}
```

**Response:**
- Don't auto-reorder on anomalies
- Alert admin for investigation
- Send customer notification: "We noticed unusual activity with your SmartBox"

---

### Edge Case 3: Holiday/Office Closure

**Scenario:** Office closes for 2 weeks (Christmas, summer). No consumption, but system might think box is "stuck."

**Solution: Holiday Mode + Consumption Pattern Learning**

```typescript
// Company can set holiday periods
interface HolidayPeriod {
  companyId: string;
  startDate: Date;
  endDate: Date;
  reason: string; // 'christmas', 'summer', 'custom'
}

// Or system detects automatically
async function detectLowActivity(boxId: string) {
  const readings = await getReadings(boxId, { days: 7 });
  
  // Calculate consumption rate
  const totalDrop = readings[0].weightGrams - readings[readings.length - 1].weightGrams;
  const avgDailyConsumption = totalDrop / 7;
  const expectedDaily = getExpectedDailyConsumption(boxId);
  
  // If consumption is <20% of expected, likely holiday
  if (avgDailyConsumption < expectedDaily * 0.2) {
    await setBoxStatus(boxId, 'low_activity');
    await sendNotification(boxId, {
      type: 'low_activity_detected',
      message: 'Low coffee consumption detected. Is your office on holiday? You can pause deliveries in your portal.'
    });
  }
}
```

**Portal Feature:**
- "Pause deliveries" button
- "Schedule holiday" calendar
- Auto-resume after holiday end date

---

### Edge Case 4: Weight Increases Without Delivery

**Scenario:** Weight goes up but no order was delivered (customer bought coffee elsewhere, or got samples, etc.)

**Solution: Track Weight Increases**

```typescript
async function processWeightIncrease(boxId: string, newWeight: number, oldWeight: number) {
  const increase = newWeight - oldWeight;
  
  // Check if we have a delivered order
  const recentDelivery = await getRecentOrder(boxId, {
    status: 'delivered',
    withinDays: 3
  });
  
  if (recentDelivery) {
    // Expected restock, mark order as "restocked"
    await updateOrder(recentDelivery.id, { 
      status: 'restocked',
      restockedAt: new Date(),
      actualRestockWeight: increase
    });
  } else {
    // Unexpected increase - log but don't alert
    await logEvent(boxId, {
      type: 'unexpected_weight_increase',
      amount: increase,
      note: 'Customer may have added external coffee'
    });
  }
}
```

---

### Edge Case 5: Box Offline / No Signal

**Scenario:** SmartBox loses cellular connectivity for days.

**Solution: Offline Detection & Fallback**

```typescript
// Cron job runs daily
async function checkOfflineBoxes() {
  const boxes = await getActiveSmartBoxes();
  
  for (const box of boxes) {
    const lastReading = await getLastReading(box.id);
    const hoursSinceReading = (Date.now() - lastReading.timestamp) / (1000 * 60 * 60);
    
    if (hoursSinceReading > 48) {
      // Box is offline
      await setBoxStatus(box.id, 'offline');
      await createAlert(box.id, {
        type: 'box_offline',
        message: `SmartBox hasn't reported in ${Math.floor(hoursSinceReading)} hours`,
        severity: 'warning'
      });
      
      // Fallback: Schedule order based on historical consumption
      if (hoursSinceReading > 96) { // 4 days offline
        await createFallbackOrder(box.id);
      }
    }
  }
}

async function createFallbackOrder(boxId: string) {
  const avgWeeklyConsumption = await getAverageWeeklyConsumption(boxId);
  const lastKnownWeight = await getLastReading(boxId).weightGrams;
  const estimatedCurrentWeight = lastKnownWeight - (avgWeeklyConsumption * daysOffline / 7);
  
  if (estimatedCurrentWeight < reorderThreshold) {
    await createOrder(boxId, { 
      reason: 'fallback_offline',
      note: 'Created due to box being offline'
    });
  }
}
```

---

### Edge Case 6: New Employee Surge

**Scenario:** Company hires 10 new people. Consumption doubles overnight.

**Solution: Consumption Spike Detection & Adjustment**

```typescript
async function detectConsumptionChange(boxId: string) {
  const recentConsumption = await getDailyConsumption(boxId, { days: 7 });
  const historicalAvg = await getAverageConsumption(boxId, { days: 30 });
  
  const recentAvg = average(recentConsumption);
  const changePercent = (recentAvg - historicalAvg) / historicalAvg;
  
  if (changePercent > 0.3) { // 30% increase
    await sendNotification(boxId, {
      type: 'consumption_increase',
      message: `Coffee consumption has increased ${Math.round(changePercent * 100)}%. Would you like to adjust your delivery quantity?`
    });
    
    // Suggest new bag count
    const suggestedBags = Math.ceil(recentAvg * 7 / standardBagSize);
    await updateRecommendation(boxId, { bagsPerOrder: suggestedBags });
  }
  
  if (changePercent < -0.3) { // 30% decrease
    await sendNotification(boxId, {
      type: 'consumption_decrease',
      message: `Coffee consumption has decreased. Would you like to reduce your delivery quantity to avoid waste?`
    });
  }
}
```

---

### Edge Case 7: Multiple SmartBoxes Per Company

**Scenario:** Large office has 2-3 SmartBoxes (different floors, kitchens, or blends).

**Solution: Company-Level Aggregation**

```typescript
async function processCompanyOrders(companyId: string) {
  const boxes = await getSmartBoxes(companyId);
  const ordersNeeded: OrderItem[] = [];
  
  for (const box of boxes) {
    const fillPercent = box.currentWeight / box.capacity;
    
    if (fillPercent <= box.reorderThreshold) {
      ordersNeeded.push({
        boxId: box.id,
        product: box.preferredProduct,
        quantity: box.bagsPerOrder,
        bagSize: box.standardBagSize
      });
    }
  }
  
  if (ordersNeeded.length > 0) {
    // Create single consolidated order
    await createConsolidatedOrder(companyId, ordersNeeded);
  }
}
```

**Benefits:**
- Single shipment, lower shipping cost
- Single invoice
- Easier for customer to receive

---

### Edge Case 8: Product/Blend Change Request

**Scenario:** Company wants to switch from Ethiopia to Colombia blend.

**Solution: Preference Update Without Waste**

```typescript
// In B2B Portal
async function updateProductPreference(boxId: string, newProductId: string) {
  const box = await getSmartBox(boxId);
  
  // Don't change immediately - wait for next reorder
  await updateBox(boxId, {
    nextProductId: newProductId, // Queued change
    preferredProductId: box.preferredProductId // Current stays same
  });
  
  // On next reorder, apply the change
  // This prevents ordering new product while old is still in box
}

async function createOrder(boxId: string, config: BoxConfig) {
  const box = await getSmartBox(boxId);
  
  // Check for queued product change
  const productId = box.nextProductId || box.preferredProductId;
  
  // If product changed, update preference
  if (box.nextProductId) {
    await updateBox(boxId, {
      preferredProductId: box.nextProductId,
      nextProductId: null
    });
  }
  
  // Create order with (potentially new) product
  await createOrderRecord({
    boxId,
    productId,
    quantity: config.bagsPerOrder,
    // ...
  });
}
```

---

### Edge Case 9: Battery Dying

**Scenario:** SmartBox battery hits 10%, might go offline soon.

**Solution: Low Battery Protocol**

```typescript
async function processLowBattery(boxId: string, batteryPercent: number) {
  if (batteryPercent <= 20 && batteryPercent > 10) {
    // Warning level
    await sendNotification(boxId, {
      type: 'low_battery_warning',
      message: 'SmartBox battery at 20%. Please charge soon.'
    });
  }
  
  if (batteryPercent <= 10) {
    // Critical level
    await sendNotification(boxId, {
      type: 'low_battery_critical',
      message: 'SmartBox battery critical! Please charge immediately to avoid service interruption.'
    });
    await createAlert(boxId, {
      type: 'battery_critical',
      severity: 'high'
    });
    
    // Preemptively schedule order if box might die
    const fillPercent = await getCurrentFillPercent(boxId);
    if (fillPercent < 0.4) {
      await createOrder(boxId, { reason: 'preemptive_low_battery' });
    }
  }
}
```

---

### Edge Case 10: First-Time Setup

**Scenario:** New SmartBox installed, no historical data yet.

**Solution: Onboarding Mode**

```typescript
async function handleNewBox(boxId: string, companyId: string) {
  const company = await getCompany(companyId);
  
  // Calculate initial recommendation
  const employees = company.employeeCount;
  const bagSize = recommendBagSize(employees);
  const bagsPerWeek = recommendBagsPerWeek(employees, bagSize);
  
  // Set conservative initial config
  await updateBoxConfig(boxId, {
    standardBagSize: bagSize,
    bagsPerOrder: bagsPerWeek,
    reorderThreshold: 0.25, // Higher threshold initially (25% vs 20%)
    learningMode: true,
    learningModeEndsAt: addDays(new Date(), 30)
  });
  
  // Send first shipment immediately
  await createOrder(boxId, {
    reason: 'initial_setup',
    quantity: bagsPerWeek + 1 // Extra bag for buffer
  });
}

// After 30 days of data
async function endLearningMode(boxId: string) {
  const actualConsumption = await getAverageWeeklyConsumption(boxId);
  const config = await getBoxConfig(boxId);
  
  // Adjust based on real data
  const optimalBags = Math.ceil(actualConsumption / config.standardBagSize);
  
  await updateBoxConfig(boxId, {
    bagsPerOrder: optimalBags,
    reorderThreshold: 0.20, // Normal threshold now
    learningMode: false
  });
  
  await sendNotification(boxId, {
    type: 'learning_complete',
    message: `Based on your first month, we've optimized your delivery to ${optimalBags} bags of ${config.standardBagSize}g per week.`
  });
}
```

---

## Complete Algorithm Flow

```
DAILY CRON JOB: processAllSmartBoxes()

For each active SmartBox:
│
├── 1. Get latest reading
│   └── If no reading in 48h → Mark offline, create alert
│
├── 2. Detect anomalies
│   └── If >50% drop in <24h → Alert, don't auto-order
│
├── 3. Check holiday mode
│   └── If in holiday period → Skip reorder logic
│
├── 4. Detect consumption changes
│   └── If ±30% change → Notify customer, suggest adjustment
│
├── 5. Check battery
│   └── If <20% → Send warning
│   └── If <10% → Critical alert, preemptive order if needed
│
├── 6. Check fill level
│   └── If >20% → All good, continue
│   └── If ≤20%:
│       │
│       ├── Check for recent orders (last 5 days)
│       │   └── If order exists:
│       │       ├── If delivered → Send "please restock" reminder
│       │       └── If in transit → Wait
│       │
│       └── If no recent order → Create new order
│           ├── Use current product preference (or queued change)
│           ├── Calculate quantity based on config
│           ├── Send confirmation to customer
│           └── Notify admin (roasting queue)
│
└── 7. Update analytics
    └── Log consumption data for reporting
```

---

## Pricing Model: Monthly Flat Fee

### Why Flat Fee Works Better

| Per-Bag Pricing                                       | Monthly Flat Fee           |
| ----------------------------------------------------- | -------------------------- |
| ❌ Customer worries about cost during high consumption | ✅ Predictable budget       |
| ❌ Complex invoicing (varies monthly)                  | ✅ Simple recurring charge  |
| ❌ Customer might ration coffee                        | ✅ Unlimited coffee feeling |
| ❌ Vacation = "wasted money" concern                   | ✅ Averages out over year   |
| ❌ Admin overhead tracking exact usage                 | ✅ Simple subscription      |

### How to Calculate Monthly Fee

```
FORMULA:
base_cost = (employees × cups_per_day × grams_per_cup × work_days × 4.33 weeks) × cost_per_gram
margin_multiplier = 2.0 to 2.5 (covers costs + profit + farmer premium)
monthly_fee = base_cost × margin_multiplier

EXAMPLE (15 employees):
weekly_grams = 15 × 2.5 cups × 10g × 5 days = 1,875g
monthly_grams = 1,875 × 4.33 = 8,119g (~8 kg)
coffee_cost = 8 kg × €15/kg = €120
monthly_fee = €120 × 2.0 = €240/month

→ Charge: €16/employee/month (€240 ÷ 15)
```

### Pricing Tiers (Revised)

| Tier                 | Employees | Per Employee | Monthly Total | Includes         |
| -------------------- | --------- | ------------ | ------------- | ---------------- |
| **Smart Starter**    | 5-10      | €18/emp      | €90-180       | ~2-4 kg coffee   |
| **Smart Growth**     | 11-20     | €15/emp      | €165-300      | ~4-8 kg coffee   |
| **Smart Scale**      | 21-35     | €13/emp      | €273-455      | ~8-14 kg coffee  |
| **Smart Enterprise** | 36-50     | €11/emp      | €396-550      | ~14-20 kg coffee |

### What "Unlimited" Means

- Customer gets as much coffee as SmartBox triggers
- If they consume more than average → they get more coffee (our cost goes up, but customer happy)
- If they consume less → they get less coffee (higher margin for us)
- **Over a year, it averages out**

### Safeguards Against Abuse

```typescript
// Monthly consumption check
async function checkConsumptionAbuse(companyId: string) {
  const company = await getCompany(companyId);
  const monthlyConsumption = await getMonthlyConsumption(companyId);
  const expectedConsumption = calculateExpectedConsumption(company.employeeCount);
  
  // Allow 50% buffer before flagging
  if (monthlyConsumption > expectedConsumption * 1.5) {
    await createAlert(companyId, {
      type: 'high_consumption',
      message: `Consumption 50%+ above expected. Employee count may need update.`
    });
    
    // Reach out to customer
    await sendNotification(companyId, {
      type: 'consumption_check',
      message: 'Great to see your team loves the coffee! We noticed higher than expected consumption. Has your team size grown? Let us know so we can ensure uninterrupted supply.'
    });
  }
}
```

### Annual Prepay Discount

| Payment   | Discount | Effective Monthly |
| --------- | -------- | ----------------- |
| Monthly   | 0%       | €15/emp           |
| Quarterly | 5%       | €14.25/emp        |
| Annual    | 15%      | €12.75/emp        |

**Benefit:** Locks in customer, improves cash flow, reduces churn.

---

## Implementation Updates Required

### Database Schema Updates

```typescript
// Update smartBoxes table
export const smartBoxes = sqliteTable('smartBoxes', {
  id: text('id').primaryKey(),
  companyId: text('companyId').references(() => b2bCompanies.id),
  
  // Configuration
  capacityGrams: integer('capacityGrams').default(3000),
  reorderThreshold: real('reorderThreshold').default(0.20),
  standardBagSize: integer('standardBagSize').default(500), // 250, 500, 750, 1000
  bagsPerOrder: integer('bagsPerOrder').default(5),
  
  // Product preferences
  preferredProductId: text('preferredProductId').references(() => products.id),
  nextProductId: text('nextProductId').references(() => products.id), // Queued change
  
  // Current state
  currentWeightGrams: integer('currentWeightGrams'),
  lastReadingAt: text('lastReadingAt'),
  batteryPercent: integer('batteryPercent'),
  status: text('status').default('active'), // active, offline, low_battery, holiday, learning
  
  // Learning mode
  learningMode: integer('learningMode', { mode: 'boolean' }).default(true),
  learningModeEndsAt: text('learningModeEndsAt'),
  
  // Consumption tracking
  avgDailyConsumption: integer('avgDailyConsumption'), // Calculated
  avgWeeklyConsumption: integer('avgWeeklyConsumption'), // Calculated
  
  // Metadata
  installedAt: text('installedAt'),
  lastMaintenanceAt: text('lastMaintenanceAt'),
  serialNumber: text('serialNumber'),
});

// Add holiday periods
export const b2bHolidayPeriods = sqliteTable('b2bHolidayPeriods', {
  id: text('id').primaryKey(),
  companyId: text('companyId').references(() => b2bCompanies.id),
  boxId: text('boxId').references(() => smartBoxes.id), // null = all boxes
  startDate: text('startDate').notNull(),
  endDate: text('endDate').notNull(),
  reason: text('reason'), // christmas, summer, custom
  createdAt: text('createdAt'),
});

// Add alerts table
export const b2bAlerts = sqliteTable('b2bAlerts', {
  id: text('id').primaryKey(),
  companyId: text('companyId').references(() => b2bCompanies.id),
  boxId: text('boxId').references(() => smartBoxes.id),
  type: text('type').notNull(), // anomaly, offline, low_battery, high_consumption, etc.
  severity: text('severity').default('info'), // info, warning, high, critical
  message: text('message').notNull(),
  resolved: integer('resolved', { mode: 'boolean' }).default(false),
  resolvedAt: text('resolvedAt'),
  resolvedBy: text('resolvedBy'),
  createdAt: text('createdAt'),
});

// Update b2bShipments to track restock confirmation
export const b2bShipments = sqliteTable('b2bShipments', {
  // ... existing fields ...
  
  // Add these fields:
  triggerReason: text('triggerReason'), // threshold, manual, fallback_offline, preemptive_low_battery, initial_setup
  restockedAt: text('restockedAt'), // When weight increased after delivery
  restockRemindersSent: integer('restockRemindersSent').default(0),
});
```

### API Updates

```typescript
// New endpoints needed:

// Holiday management
POST /api/b2b/portal/holidays
GET /api/b2b/portal/holidays
DELETE /api/b2b/portal/holidays/:id

// Box configuration
PATCH /api/b2b/portal/boxes/:id/preferences
POST /api/b2b/portal/boxes/:id/pause
POST /api/b2b/portal/boxes/:id/resume

// Admin alerts
GET /api/admin/b2b/alerts
PATCH /api/admin/b2b/alerts/:id/resolve

// Updated device endpoint
POST /api/devices/reading
// Should now handle:
// - Anomaly detection
// - Battery alerts
// - Restock detection (weight increase)
// - Consumption pattern updates
```

### Cron Job Updates

```typescript
// vercel.json additions:
{
  "crons": [
    // ... existing crons ...
    
    {
      "path": "/api/cron/b2b/check-offline-boxes",
      "schedule": "0 8 * * *" // Daily at 8 AM
    },
    {
      "path": "/api/cron/b2b/check-restock-reminders",
      "schedule": "0 9 * * *" // Daily at 9 AM
    },
    {
      "path": "/api/cron/b2b/update-consumption-stats",
      "schedule": "0 2 * * 0" // Weekly Sunday 2 AM
    },
    {
      "path": "/api/cron/b2b/check-learning-mode",
      "schedule": "0 3 * * *" // Daily at 3 AM
    }
  ]
}
```

### B2B Portal Updates

**New features for customer portal:**

1. **Holiday Calendar** (`/b2b/portal/holidays`)
   - Add/remove holiday periods
   - See upcoming pauses
   - Quick "pause for X days" button

2. **SmartBox Settings** (`/b2b/portal/boxes/:id/settings`)
   - Change preferred product/blend
   - View consumption stats
   - See next scheduled delivery
   - Manual "order now" button

3. **Consumption Dashboard** (`/b2b/portal/consumption`)
   - Weekly/monthly consumption graphs
   - Comparison to company average
   - Cost breakdown

### Admin Dashboard Updates

**New features for admin:**

1. **Alerts Queue** (`/admin/b2b/alerts`)
   - Filter by type, severity
   - Resolve with notes
   - Escalation indicators

2. **Box Health Overview** (`/admin/b2b/boxes`)
   - Battery levels across all boxes
   - Offline boxes highlighted
   - Learning mode boxes flagged

3. **Consumption Analytics** (`/admin/b2b/analytics`)
   - Company-by-company consumption
   - Abuse detection flags
   - Recommendation accuracy

---

## SmartBox Hardware Updates

### Simplified Requirements (No Freshness Features)

| Component           | Still Needed? | Notes                              |
| ------------------- | ------------- | ---------------------------------- |
| Load cell           | ✅ Yes         | Core function                      |
| ESP32               | ✅ Yes         | Processing                         |
| LTE-M module        | ✅ Yes         | Connectivity                       |
| Battery             | ✅ Yes         | Power                              |
| LEDs (fill level)   | ✅ Yes         | Visual feedback                    |
| LEDs (battery)      | ✅ Yes         | Charging status                    |
| ~~Vacuum pump~~     | ❌ No          | Not needed — bags stay sealed      |
| ~~Pressure sensor~~ | ❌ No          | Not needed                         |
| ~~Lid sensor~~      | ❌ No          | Not needed — bags, not loose beans |
| USB-C charging      | ✅ Yes         | Power                              |
| QR code plate       | ✅ Yes         | Employee cross-sell                |

### Updated BOM (Simplified)

| Component               | Cost     | Notes                      |
| ----------------------- | -------- | -------------------------- |
| OXO Steel POP container | €45      | Storage                    |
| ESP32-S3                | €4       | MCU                        |
| SIM7080G (LTE-M)        | €12      | Cellular                   |
| TAL221 load cell        | €8       | Weight sensor              |
| HX711 ADC               | €2       | Load cell interface        |
| 6000mAh LiPo            | €12      | Battery                    |
| BMS + charging          | €2       | Power management           |
| MAX17048 fuel gauge     | €3       | Battery monitoring         |
| LEDs + driver           | €5       | Indicators                 |
| Oak tech base           | €25      | Housing                    |
| Assembly                | €10      | Labor                      |
| **Total**               | **€128** | Down from €142 (no vacuum) |

---

## Email Templates to Add/Update

### New Templates

1. **restock-reminder.tsx**
   ```
   Subject: Please restock your SmartBox ☕
   
   Hi [Name],
   
   Your coffee delivery arrived [X days ago], but it looks like 
   the bags haven't been added to your SmartBox yet.
   
   Please place the coffee bags in your SmartBox so we can 
   continue monitoring your supply.
   
   [Button: I've restocked]
   ```

2. **low-activity-detected.tsx**
   ```
   Subject: Is your office on holiday? 🏖️
   
   Hi [Name],
   
   We noticed your coffee consumption has dropped significantly 
   this week. If your team is on holiday, you can pause 
   deliveries to avoid unnecessary shipments.
   
   [Button: Pause deliveries]
   [Button: We're still here!]
   ```

3. **consumption-change.tsx**
   ```
   Subject: Your coffee needs have changed 📊
   
   Hi [Name],
   
   Based on your SmartBox data, your team's coffee consumption 
   has [increased/decreased] by [X]%.
   
   Current: [X] bags per week
   Recommended: [Y] bags per week
   
   Would you like us to adjust your delivery quantity?
   
   [Button: Yes, adjust] [Button: Keep current]
   ```

4. **learning-complete.tsx**
   ```
   Subject: Your SmartBox is now optimized! 🎉
   
   Hi [Name],
   
   After 30 days of learning your team's coffee habits, 
   we've optimized your SmartBox settings:
   
   - Bag size: [500g]
   - Bags per delivery: [5]
   - Estimated weekly consumption: [2.5 kg]
   
   We'll automatically adjust if your needs change.
   ```

---

## Summary of Changes

### Concept Changes

| Aspect       | Old                      | New                                |
| ------------ | ------------------------ | ---------------------------------- |
| Storage      | Loose beans in container | Sealed bags in box                 |
| Freshness    | Vacuum system            | Bags stay sealed                   |
| User action  | Pour beans               | Drop bags in                       |
| Reorder unit | Grams/kg                 | Number of bags                     |
| Bag sizes    | One size                 | 250g/500g/750g/1kg based on office |

### Pricing Changes

| Aspect      | Old                          | New                          |
| ----------- | ---------------------------- | ---------------------------- |
| Model       | Per-employee flat fee        | Same, but truly "unlimited"  |
| Variability | Customer worries about usage | Averages out, worry-free     |
| Holidays    | Still charged                | Still charged (averages out) |

### Technical Changes

| Component            | Add/Update/Remove            |
| -------------------- | ---------------------------- |
| Vacuum pump          | ❌ Remove from spec           |
| Bag size config      | ✅ Add to schema              |
| Holiday periods      | ✅ Add table + API            |
| Alerts system        | ✅ Add table + API + admin UI |
| Restock detection    | ✅ Add logic                  |
| Anomaly detection    | ✅ Add logic                  |
| Learning mode        | ✅ Add logic                  |
| Consumption tracking | ✅ Enhance                    |

---

## Next Steps

1. **Update database schema** with new fields/tables
2. **Update device API** with edge case handling
3. **Add cron jobs** for daily checks
4. **Add admin alerts page**
5. **Add portal holiday management**
6. **Update SmartBox hardware spec** (remove vacuum)
7. **Create new email templates**
8. **Test edge cases thoroughly**

---

*Document Version: 1.0*
*Last Updated: January 2026*