# Marie Lou B2B Program

## Overview

A complete business-to-business coffee and tea service for office environments, available in two tiers:

**B2B Smart (Main Offer / USP):**
Hassle-free office coffee with smart inventory management, automatic reordering, and per-employee flatrate pricing. SmartBox monitors consumption and triggers shipments before you run out — delivered via standard shipping, customer refills the box.

**B2B Flex (Entry Tier):**
Simple business ordering with professional invoicing, volume discounts, and net payment terms — for companies not ready for the full program.

Both tiers include employee promo codes for D2C cross-sell.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         B2B TIER COMPARISON                             │
├──────────────────────────┬──────────────────┬───────────────────────────┤
│ Feature                  │ B2B Flex         │ B2B Smart                 │
├──────────────────────────┼──────────────────┼───────────────────────────┤
│ Business invoicing       │ ✓                │ ✓                         │
│ VAT ID handling          │ ✓                │ ✓                         │
│ Volume discounts         │ ✓                │ ✓                         │
│ Net payment terms        │ ✓ (optional)     │ ✓                         │
│ Employee promo code      │ ✓                │ ✓                         │
│ SmartBox system          │ ✗                │ ✓                         │
│ Per-employee flatrate    │ ✗                │ ✓                         │
│ Auto-reorder (sensor)    │ ✗                │ ✓                         │
│ Never run out guarantee  │ ✗                │ ✓                         │
│ Golden sustainability sign│ ✗               │ ✓                         │
├──────────────────────────┼──────────────────┼───────────────────────────┤
│ How they order           │ Self-service     │ Automatic (sensor-triggered) │
│ Shipping                 │ Standard         │ Standard (included)       │
│ Billing                  │ Per order        │ Monthly flatrate          │
│ Minimum commitment       │ None             │ 6 months                  │
└──────────────────────────┴──────────────────┴───────────────────────────┘
```

**Positioning:**
- Landing page hero: B2B Smart (the differentiator)
- Secondary CTA: "Or start with Flex — upgrade anytime"
- Natural sales funnel: Inquiry → Flex trial → Smart conversion

---

## Program Components

### 1. SmartBox System (Smart Tier Only)

A branded, sensor-equipped storage container that customers refill themselves when shipments arrive.

#### 1.1 Smart Storage Box

**Purpose:** Airtight storage with automatic inventory monitoring

**How it works:**
1. Customer receives coffee/tea via standard shipping
2. Customer fills the SmartBox themselves
3. Sensor tracks consumption and reports to Marie Lou
4. System triggers automatic reorder when below threshold
5. New shipment sent via standard delivery

**Hardware Specifications:**
- Load cell (weight sensor) on base - measures actual grams remaining
- ESP32 microcontroller with WiFi capability
- Battery-powered with deep sleep cycle (pings 1-2x daily)
- Expected battery life: 6-12 months on single charge
- Food-grade interior (stainless steel or HDPE)
- One-way CO2 valve for freshly roasted beans still off-gassing
- Hinged top with silicone gasket for automatic resealing
- Capacity options: 1kg, 2kg, 5kg based on company size

**Smart Features:**
- Daily weight readings transmitted to Marie Lou backend
- Automatic reorder trigger when below threshold (configurable, default 20%)
- Dashboard visibility for both client (portal) and admin
- Historical consumption data for pattern analysis
- Low battery alerts

#### 1.2 Puck Collection System (Planned - Phase 2)

*Future enhancement:* A second matching box for collecting used coffee pucks, enabling:
- Dried puck collection during delivery visits
- Conversion to fertilizer
- Closed-loop sustainability story

**Not in MVP** — requires personal delivery infrastructure. Will revisit once Smart tier has proven demand and delivery routes are established.

### 2. Pricing Models

#### 2.1 B2B Smart: Per-Employee Flatrate

| Tier             | Employees | Monthly Rate/Employee | Includes                                |
| ---------------- | --------- | --------------------- | --------------------------------------- |
| Smart Starter    | 5-15      | €15                   | Coffee/tea, SmartBox loan, auto-reorder |
| Smart Growth     | 16-50     | €12                   | All above + priority support            |
| Smart Scale      | 51-200    | €10                   | All above + dedicated account manager   |
| Smart Enterprise | 200+      | Custom                | Full service package                    |

**Minimum commitment:** 6 months
**SmartBox:** Free with subscription (remains Marie Lou property)
**Golden sign:** Awarded after first month
**Shipping:** Included in flatrate (standard carrier)

#### 2.2 B2B Flex: Volume-Based Ordering

| Order Size | Discount | Payment Terms |
| ---------- | -------- | ------------- |
| < 5kg      | 0%       | Due on order  |
| 5-10kg     | 5%       | Net 14        |
| 10-25kg    | 10%      | Net 14        |
| 25-50kg    | 15%      | Net 30        |
| 50kg+      | 20%      | Net 30        |

**Minimum commitment:** None
**How it works:** Company orders through B2B portal when needed, receives business invoice
**Upgrade incentive:** "Switch to Smart and save X% based on your average consumption"

#### 2.3 Multi-Brand Support

Both tiers support **Marie Lou Coffee** and **Marie Lou Tea**:
- Companies can order coffee only, tea only, or mixed
- Smart tier: Separate SmartBoxes for coffee and tea if needed
- Flex tier: Mix products freely in each order
- Same pricing structure applies to both brands

#### 2.4 Consumption Estimator

Interactive tool on B2B page to help prospects choose the right tier:

```
Inputs:
- Number of employees
- Average cups per employee per day (default: 2.5)
- Office days per week (default: 5)
- Preferred products (coffee/tea/both)

Outputs:
- Estimated monthly consumption (kg)
- Recommended tier (Flex vs Smart + which Smart level)
- Cost comparison: Flex vs Smart
- Potential savings with Smart
- Break-even point for Smart upgrade
```

### 3. Service Components

#### 3.1 B2B Flex: Self-Service Ordering

**B2B Portal (`/b2b/shop`):**
- Logged-in B2B customers see business pricing
- Full product catalog (coffee + tea)
- Quantity discounts applied automatically
- Business checkout with:
  - VAT ID field
  - Purchase order number (optional)
  - Delivery address selection (from saved addresses)
  - Payment: Invoice (net terms) or card
- Order confirmation with business invoice

**Flex Customer Dashboard (`/b2b/account`):**
- Order history with invoice downloads
- Saved delivery addresses
- Company details & VAT settings
- Reorder from previous orders
- "Upgrade to Smart" promotion

#### 3.2 B2B Smart: Auto-Replenishment

**How Smart Delivery Works:**
1. SmartBox monitors coffee/tea levels daily
2. When level drops below threshold (default 20%), system triggers reorder
3. Order created automatically with customer's preferred products
4. Shipped via standard carrier (DHL/DPD)
5. Customer receives package and refills SmartBox themselves
6. Cycle repeats

**Delivery Triggers:**
- Automatic: SmartBox sensor below threshold
- Scheduled: Fixed interval regardless of consumption (optional)
- Manual: Customer requests via portal or admin triggers

**On-Demand Orders:**
Smart customers can also place additional orders through the B2B portal if needed (e.g., event coming up, expecting visitors).

#### 3.3 Puck Collection (Planned - Phase 2)

*Future enhancement once delivery infrastructure exists:*
- Personal delivery visits to refill boxes
- Puck collection during visits
- Conversion to fertilizer
- Full closed-loop sustainability

**Not in MVP** — current model uses standard shipping for scalability.

#### 3.4 Golden Sustainability Sign (Smart Only)

Premium branded plaque for client offices:

**Design:**
- Gold/brass finish with Marie Lou branding
- Text: "We brew with Marie Lou — Direct Trade, Sustainably Sourced"
- QR code linking to `/b2b/welcome/[promo-code]`
- Wall-mountable or counter stand options
- Awarded after first month of Smart subscription

**Purpose:**
- Visible sustainability commitment for employees and visitors
- Cross-sell channel to D2C (employees scan → promo landing → 10% off)
- All conversions tracked per company in B2B admin section
- Brand presence in every client location

### 4. Cross-Sell Flywheel

The B2B program creates a customer acquisition engine using a dedicated promo code system (separate from the D2C referral program "Marie Lou's Table"):

```
Office Client Signs Up
        ↓
Company gets unique promo code (e.g., ACME10 or MLOU-ACME)
        ↓
Employees drink Marie Lou coffee daily
        ↓
Golden sign with QR code visible in kitchen
        ↓
Employee scans code → B2B welcome page
        ↓
Uses company promo code at checkout
        ↓
10% off first order (tracked as B2B conversion)
        ↓
New personal subscriber acquired at near-zero CAC
```

**Separate from Referral System:**
- B2B promo codes are distinct from referral codes (different prefix: `MLOU-` vs `MARIE-`)
- No rewards generated — this is tracking only
- Conversions appear in B2B admin section, not referral analytics
- Clean separation: referrals = D2C word-of-mouth, promo codes = B2B employee conversion

**Employee Welcome Page (`/b2b/welcome/[code]`):**
- Dedicated landing page for B2B employee cross-sell
- "Your office drinks Marie Lou. Get 10% off your first home order."
- Shows the coffee they know from work
- Quick path to shop with promo code auto-applied
- Tracks conversion back to originating B2B company

---

## Onboarding Workflow

### Company Status Flow

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ INQUIRY  │───►│ PENDING  │───►│ ACTIVE   │───►│ PAUSED   │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
     │               │               │               │
     │               │               │               ▼
     │               │               │          ┌──────────┐
     └───────────────┴───────────────┴─────────►│ CANCELLED│
                                                └──────────┘
```

**Status Definitions:**

| Status      | Description                      | Actions Available               |
| ----------- | -------------------------------- | ------------------------------- |
| `inquiry`   | Form submitted, awaiting review  | Convert to Pending, Reject      |
| `pending`   | Approved, awaiting setup/payment | Activate, Cancel                |
| `active`    | Fully operational                | Pause, Cancel, Edit             |
| `paused`    | Temporarily suspended            | Resume, Cancel                  |
| `cancelled` | Terminated                       | Reactivate (creates new record) |

**Flex Onboarding Flow:**
1. Company submits inquiry (or admin creates directly)
2. Admin reviews, approves → Status: `pending`
3. System creates customer account, sends welcome email with login
4. Company logs in, adds payment method → Status: `active`
5. Company can now order through B2B portal

**Smart Onboarding Flow:**
1. Company submits inquiry
2. Admin reviews, schedules intro call
3. Admin converts to `pending`, sets tier and pricing
4. System creates Stripe subscription (not yet active)
5. Admin schedules initial delivery with SmartBox setup
6. After first successful delivery → Status: `active`
7. Stripe subscription activates, first invoice generated

---

## Billing & Payments

### Flex Billing

- **Per-order invoicing** via rechnungs-api.de (same as D2C)
- Payment options:
  - Card (immediate)
  - Invoice with net terms (14 or 30 days based on volume)
- Invoice includes: VAT breakdown, PO number if provided
- Overdue handling: Email reminders at 7, 14, 21 days

### Smart Billing (Stripe Subscriptions)

**Monthly Billing Cycle:**
```
1st of month: Calculate previous month's charges
              - Base: employees × rate
              - Adjustments: employee count changes mid-month
              - Extra shipments (if on-demand)
              
5th of month: Generate invoice via Stripe
              
Due date: Net 14 (20th of month)

Overdue: Stripe handles dunning (retry 3x, then notify admin)
```

**Stripe Integration:**
```typescript
// When Smart company activates:
const subscription = await stripe.subscriptions.create({
  customer: company.stripeCustomerId,
  items: [{ 
    price: tierPriceId,  // Price per employee
    quantity: company.employeeCount 
  }],
  billing_cycle_anchor: firstOfNextMonth,
  proration_behavior: 'none',
  collection_method: 'send_invoice',
  days_until_due: 14,
});
```

**Employee Count Changes:**
- Admin updates employee count in dashboard
- Stripe subscription quantity updated
- Prorated on next invoice (or full month, configurable)

---

## Email Notifications

### Customer-Facing Emails

| Trigger                 | Email                                      | Recipient                 |
| ----------------------- | ------------------------------------------ | ------------------------- |
| Inquiry submitted       | "Thanks for your interest"                 | Contact person            |
| Account approved        | "Welcome to Marie Lou B2B" + login details | Contact person            |
| Smart: SmartBox shipped | "Your SmartBox is on its way"              | Contact person            |
| Flex: Order confirmed   | Order confirmation + invoice               | Contact person            |
| Shipment dispatched     | Tracking info                              | Contact person            |
| Smart: Low stock alert  | "We're sending your next shipment"         | Contact person (optional) |
| Invoice generated       | Invoice PDF                                | Billing email             |
| Payment received        | Receipt                                    | Billing email             |
| Payment overdue         | Reminder (7, 14, 21 days)                  | Billing email             |
| Employee conversion     | "An employee just ordered!" (optional)     | Contact person            |

### Admin Emails

| Trigger                   | Email                                   | Recipient |
| ------------------------- | --------------------------------------- | --------- |
| New inquiry               | "New B2B inquiry from [Company]"        | Admin     |
| Smart: SmartBox low stock | "Auto-shipment triggered for [Company]" | Admin     |
| Smart: SmartBox offline   | "[Company] box offline for 48h"         | Admin     |
| Payment failed            | "[Company] payment failed"              | Admin     |
| High-value Flex order     | "Large order from [Company]"            | Admin     |

### Email Templates Location

```
src/emails/b2b/
├── inquiry-received.tsx
├── welcome-flex.tsx
├── welcome-smart.tsx
├── shipment-dispatched.tsx
├── order-confirmation.tsx
├── invoice.tsx
├── payment-reminder.tsx
├── employee-conversion.tsx
├── admin-new-inquiry.tsx
├── admin-low-stock.tsx
└── admin-payment-failed.tsx
```

---

## Scheduled Tasks (Cron Jobs)

**Note:** These B2B cron jobs are ADDED to the existing `vercel.json` which already contains D2C crons (daily-summary, review-requests, etc.). All cron endpoints use the shared `src/lib/cron-auth.ts` middleware for authentication.

Add these to the existing `crons` array in `vercel.json`:

```json
// B2B crons to ADD to existing vercel.json
{
  "path": "/api/cron/b2b/process-smart-billing",
  "schedule": "0 6 1 * *"
},
{
  "path": "/api/cron/b2b/check-smartbox-alerts",
  "schedule": "0 8 * * *"
},
{
  "path": "/api/cron/b2b/send-payment-reminders",
  "schedule": "0 9 * * *"
},
{
  "path": "/api/cron/b2b/shipment-reminders",
  "schedule": "0 7 * * 1"
}
```

| Job                      | Schedule           | Description                                     |
| ------------------------ | ------------------ | ----------------------------------------------- |
| `process-smart-billing`  | 1st of month, 6 AM | Generate Stripe invoices for Smart customers    |
| `check-smartbox-alerts`  | Daily, 8 AM        | Check for low stock, offline boxes, low battery |
| `send-payment-reminders` | Daily, 9 AM        | Send overdue reminders for Flex invoices        |
| `shipment-reminders`     | Monday, 7 AM       | Remind admin of pending shipments this week     |

---

## Sustainability Tracking

### MVP Metrics (What We Track Now)

**Per Shipment:**
- Coffee/tea shipped (kg)
- Packaging type (recyclable/compostable)

**Cumulative (Company Level):**
- Total coffee/tea consumed
- Estimated cups served (kg × cups_per_kg factor)
- Direct trade premium paid to farmers (calculated from order value)

**Global (All B2B):**
- Total kg shipped to B2B clients
- Total farmer premium generated
- Monthly/yearly trends

### Phase 2 Metrics (With Puck Collection)

*Future enhancement when personal delivery infrastructure exists:*
- Pucks collected (kg)
- Collection rate: pucks_collected / coffee_delivered
- CO2 equivalent saved
- Fertilizer produced

### Database Addition

```typescript
// Add to b2bCompanies
sustainabilityOptIn: integer('sustainability_opt_in', { mode: 'boolean' }).default(true),

// Cumulative tracking (updated after each shipment)
export const b2bSustainabilityStats = sqliteTable('b2b_sustainability_stats', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull().references(() => b2bCompanies.id),
  
  // Cumulative totals
  totalCoffeeDelivered: integer('total_coffee_delivered').default(0), // grams
  totalTeaDelivered: integer('total_tea_delivered').default(0), // grams
  totalShipments: integer('total_shipments').default(0),
  
  // Calculated impact (based on our sourcing model)
  farmerPremiumCents: integer('farmer_premium_cents').default(0), // Premium paid above market rate
  estimatedCupsServed: integer('estimated_cups_served').default(0),
  
  // Future: puck collection (Phase 2)
  // totalPucksCollected: integer('total_pucks_collected').default(0),
  // co2SavedGrams: integer('co2_saved_grams').default(0),
  
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});
```

### Sustainability Display

**Company Dashboard Widget:**
- "Your Impact" card showing:
  - Total coffee/tea consumed
  - Estimated cups served to your team
  - Farmer premium contribution ("You've contributed €X to fair farmer wages")
- Certificate download option

**Golden Sign:**
- Static QR code linking to employee promo page
- Sustainability story on landing page

---

## Multi-Location Support (Phase 2)

For larger companies with multiple offices:

```typescript
// Future: b2bLocations table
export const b2bLocations = sqliteTable('b2b_locations', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull().references(() => b2bCompanies.id),
  name: text('name').notNull(), // "Munich HQ", "Berlin Office"
  deliveryAddress: text('delivery_address').notNull(), // JSON
  deliveryInstructions: text('delivery_instructions'),
  employeeCount: integer('employee_count').notNull(),
  // Each location can have its own SmartBoxes
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// SmartBoxes would reference locationId instead of companyId
```

**Not in MVP — add when a customer requests it.**

---

## Technical Implementation

### Database Schema Additions

The B2B feature is a self-contained system with its own tables. It does NOT integrate with the referral program — these are separate concepts:

- **Referral Program ("Marie Lou's Table")**: D2C word-of-mouth, person-to-person, rewards both parties
- **B2B Promo Codes**: Company-to-employee conversion tracking, no rewards, B2B context

**New Tables:**

```typescript
// src/db/schema.ts additions

// B2B Companies
export const b2bCompanies = sqliteTable('b2b_companies', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(), // URL-friendly identifier
  
  // Contact person (a customer, but NOT linked to referral system)
  contactCustomerId: text('contact_customer_id').references(() => customers.id), // null for inquiries
  contactName: text('contact_name').notNull(),
  contactEmail: text('contact_email').notNull(),
  contactPhone: text('contact_phone'),
  
  // B2B Promo Code for employee cross-sell (separate from referral codes)
  promoCode: text('promo_code').unique(), // e.g., "ACME10" or "MLOU-ACME", generated on activation
  promoDiscountPercent: integer('promo_discount_percent').notNull().default(10),
  promoActive: integer('promo_active', { mode: 'boolean' }).notNull().default(true),
  
  // Billing
  billingEmail: text('billing_email'),
  billingAddress: text('billing_address'), // JSON
  vatId: text('vat_id'),
  paymentTermsDays: integer('payment_terms_days').default(0), // 0 = due on order, 14/30 = net terms
  
  // Delivery
  deliveryAddress: text('delivery_address'), // JSON
  deliveryInstructions: text('delivery_instructions'),
  
  // Tier: 'flex' or 'smart_starter' | 'smart_growth' | 'smart_scale' | 'smart_enterprise'
  tier: text('tier').notNull().default('flex'),
  brand: text('brand').notNull().default('coffee'), // 'coffee' | 'tea' | 'both'
  
  // Smart-specific fields (null for Flex)
  employeeCount: integer('employee_count'),
  monthlyRatePerEmployee: integer('monthly_rate_per_employee'), // cents, null for Flex
  
  // Flex-specific fields
  volumeDiscountPercent: integer('volume_discount_percent').default(0), // calculated from order history
  
  // Preferences
  preferredProducts: text('preferred_products'), // JSON array of product IDs
  grindPreference: text('grind_preference'),
  
  // Status: 'inquiry' | 'pending' | 'active' | 'paused' | 'cancelled'
  status: text('status').notNull().default('inquiry'),
  statusChangedAt: integer('status_changed_at', { mode: 'timestamp' }),
  statusNote: text('status_note'), // Admin note for status changes
  
  // Stripe (for Smart tier)
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  
  // Sustainability
  sustainabilityOptIn: integer('sustainability_opt_in', { mode: 'boolean' }).default(true),
  
  // Inquiry source
  inquirySource: text('inquiry_source'), // 'website' | 'referral' | 'cold_outreach' | 'event'
  inquiryNotes: text('inquiry_notes'), // Original inquiry message
  
  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// B2B Orders (for Flex customers - Smart uses b2bShipments)
export const b2bOrders = sqliteTable('b2b_orders', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull().references(() => b2bCompanies.id),
  orderId: text('order_id').notNull().references(() => orders.id), // Links to main orders table
  
  // B2B-specific fields
  purchaseOrderNumber: text('purchase_order_number'),
  volumeDiscountApplied: integer('volume_discount_applied').default(0), // cents
  paymentTermsDays: integer('payment_terms_days').notNull(),
  paymentDueDate: integer('payment_due_date', { mode: 'timestamp' }),
  paymentStatus: text('payment_status').notNull().default('pending'), // 'pending' | 'paid' | 'overdue'
  paidAt: integer('paid_at', { mode: 'timestamp' }),
  
  // Reminders sent
  remindersSent: integer('reminders_sent').default(0),
  lastReminderAt: integer('last_reminder_at', { mode: 'timestamp' }),
  
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// B2B Promo Code Usage (tracks employee conversions)
export const b2bPromoUsage = sqliteTable('b2b_promo_usage', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull().references(() => b2bCompanies.id),
  orderId: text('order_id').notNull().references(() => orders.id),
  customerId: text('customer_id').references(() => customers.id),
  customerEmail: text('customer_email').notNull(),
  discountApplied: integer('discount_applied').notNull(), // cents
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// SmartBoxes (Smart tier only)
export const smartBoxes = sqliteTable('smart_boxes', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull().references(() => b2bCompanies.id),
  productType: text('product_type').notNull().default('coffee'), // 'coffee' | 'tea'
  
  // Hardware
  deviceId: text('device_id').unique(), // ESP32 device ID
  capacity: integer('capacity'), // grams
  
  // Current State
  currentLevel: integer('current_level'), // grams remaining
  lastReading: integer('last_reading', { mode: 'timestamp' }),
  batteryLevel: integer('battery_level'), // percentage
  
  // Thresholds
  reorderThreshold: integer('reorder_threshold').default(20), // percentage
  
  // Status
  status: text('status').notNull().default('active'),
  
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// Box Readings (time series data)
export const boxReadings = sqliteTable('box_readings', {
  id: text('id').primaryKey(),
  boxId: text('box_id').notNull().references(() => smartBoxes.id),
  level: integer('level').notNull(), // grams
  batteryLevel: integer('battery_level'),
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull(),
});

// B2B Shipments (Smart tier auto-reorder shipments)
export const b2bShipments = sqliteTable('b2b_shipments', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull().references(() => b2bCompanies.id),
  orderId: text('order_id').references(() => orders.id), // Links to main orders table
  
  // Trigger
  triggerType: text('trigger_type').notNull(), // 'auto' | 'scheduled' | 'manual' | 'initial'
  triggeredByBoxId: text('triggered_by_box_id').references(() => smartBoxes.id), // Which box triggered
  
  // Contents
  products: text('products').notNull(), // JSON array
  totalWeight: integer('total_weight'), // grams
  
  // Shipping (standard carrier)
  trackingNumber: text('tracking_number'),
  trackingUrl: text('tracking_url'),
  carrier: text('carrier'), // 'dhl' | 'dpd' | 'ups' | etc.
  
  // Status: 'pending' | 'processing' | 'shipped' | 'delivered'
  status: text('status').notNull().default('pending'),
  
  // Timestamps
  shippedAt: integer('shipped_at', { mode: 'timestamp' }),
  deliveredAt: integer('delivered_at', { mode: 'timestamp' }),
  
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// B2B Invoices (monthly billing)
export const b2bInvoices = sqliteTable('b2b_invoices', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull().references(() => b2bCompanies.id),
  
  // Billing Period
  periodStart: integer('period_start', { mode: 'timestamp' }).notNull(),
  periodEnd: integer('period_end', { mode: 'timestamp' }).notNull(),
  
  // Amounts
  employeeCount: integer('employee_count').notNull(),
  ratePerEmployee: integer('rate_per_employee').notNull(),
  subtotal: integer('subtotal').notNull(),
  tax: integer('tax').notNull(),
  total: integer('total').notNull(),
  
  // Invoice
  invoiceNumber: text('invoice_number').notNull(),
  invoiceId: text('invoice_id'), // External from rechnungs-api
  
  // Payment
  status: text('status').notNull().default('pending'),
  paidAt: integer('paid_at', { mode: 'timestamp' }),
  stripeInvoiceId: text('stripe_invoice_id'),
  
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});
```

**Orders Table Addition:**

```typescript
// Add to existing orders table (separate from referral fields)
b2bPromoCode: text('b2b_promo_code'),        // Promo code used (if any)
b2bPromoDiscount: integer('b2b_promo_discount').default(0), // Discount in cents
```

**Promo Code Format:**
- B2B codes: `MLOU-XXXXX` or company-branded like `ACME10`, `TECHCORP`
- Referral codes (separate system): `MARIE-XXXXX`
- Clear visual distinction prevents confusion
```

### API Endpoints

```typescript
// B2B Public API
POST   /api/b2b/inquiry                    // New business inquiry form
GET    /api/b2b/estimate                   // Consumption estimator
GET    /api/b2b/promo/validate?code=XXX    // Validate B2B promo code
POST   /api/b2b/promo/apply                // Apply promo code to cart/checkout

// B2B Portal API (authenticated B2B customers)
GET    /api/b2b/portal/products            // Product catalog with B2B pricing
GET    /api/b2b/portal/account             // Company account details
PATCH  /api/b2b/portal/account             // Update company details
GET    /api/b2b/portal/orders              // Order history
POST   /api/b2b/portal/orders              // Place new order (Flex)
GET    /api/b2b/portal/orders/:id          // Order details + invoice download
GET    /api/b2b/portal/addresses           // Saved delivery addresses
POST   /api/b2b/portal/addresses           // Add new address
GET    /api/b2b/portal/sustainability      // Sustainability stats (Smart)

// B2B Admin API
GET    /api/admin/b2b/companies            // List all B2B clients (filterable by tier, status)
POST   /api/admin/b2b/companies            // Create new client
GET    /api/admin/b2b/companies/:id        // Get client details
PATCH  /api/admin/b2b/companies/:id        // Update client
PATCH  /api/admin/b2b/companies/:id/status // Update status (with workflow validation)
DELETE /api/admin/b2b/companies/:id        // Soft delete (set status to cancelled)

GET    /api/admin/b2b/inquiries            // List inquiries (status=inquiry)
PATCH  /api/admin/b2b/inquiries/:id/approve // Convert inquiry to pending
PATCH  /api/admin/b2b/inquiries/:id/reject  // Reject inquiry

GET    /api/admin/b2b/companies/:id/conversions  // Employee conversions for this company
GET    /api/admin/b2b/conversions          // All employee conversions across companies

GET    /api/admin/b2b/orders               // All B2B Flex orders
PATCH  /api/admin/b2b/orders/:id/payment   // Mark payment received

GET    /api/admin/b2b/shipments           // List shipments (Smart)
POST   /api/admin/b2b/shipments           // Trigger manual shipment
PATCH  /api/admin/b2b/shipments/:id       // Update shipment status

GET    /api/admin/b2b/boxes                // List all SmartBoxes
GET    /api/admin/b2b/boxes/:id            // Box details + readings
POST   /api/admin/b2b/boxes                // Register new SmartBox
GET    /api/admin/b2b/alerts               // Low stock, offline boxes, overdue payments

GET    /api/admin/b2b/reports/revenue      // B2B revenue breakdown
GET    /api/admin/b2b/reports/sustainability // Aggregate sustainability stats

// SmartBox Device API (ESP32 calls this)
POST   /api/devices/reading                // Submit box reading
GET    /api/devices/:id/config             // Get device configuration

// Cron endpoints (protected by CRON_SECRET)
POST   /api/cron/b2b/process-smart-billing
POST   /api/cron/b2b/check-smartbox-alerts
POST   /api/cron/b2b/send-payment-reminders
POST   /api/cron/b2b/delivery-reminders
```

### Frontend Pages

```
src/app/[locale]/
├── b2b/
│   ├── page.tsx                    // B2B landing page (hero: Smart, secondary: Flex)
│   ├── pricing/page.tsx            // Pricing calculator + comparison
│   ├── inquiry/page.tsx            // Contact form
│   ├── welcome/
│   │   └── [code]/page.tsx         // Employee welcome page (promo code landing)
│   │
│   ├── portal/                     // B2B Customer Portal (requires B2B auth)
│   │   ├── layout.tsx              // Portal layout with sidebar
│   │   ├── page.tsx                // Dashboard (order summary, quick actions)
│   │   ├── shop/
│   │   │   ├── page.tsx            // Product catalog with B2B pricing
│   │   │   └── [slug]/page.tsx     // Product detail
│   │   ├── cart/page.tsx           // B2B cart with volume discounts
│   │   ├── checkout/page.tsx       // B2B checkout (invoice, PO number)
│   │   ├── orders/
│   │   │   ├── page.tsx            // Order history
│   │   │   └── [id]/page.tsx       // Order detail + invoice download
│   │   ├── account/page.tsx        // Company settings, addresses, VAT
│   │   ├── sustainability/page.tsx // Impact dashboard (Smart only)
│   │   └── upgrade/page.tsx        // "Upgrade to Smart" page (Flex only)
│   │
│   └── login/page.tsx              // B2B portal login

src/app/admin/
├── b2b/
│   ├── page.tsx                    // B2B dashboard overview
│   ├── inquiries/
│   │   └── page.tsx                // Inquiry queue
│   ├── companies/
│   │   ├── page.tsx                // Company list (filter by tier, status)
│   │   ├── [id]/page.tsx           // Company details + actions
│   │   └── new/page.tsx            // Add company manually
│   ├── orders/
│   │   └── page.tsx                // Flex orders + payment tracking
│   ├── conversions/
│   │   └── page.tsx                // All employee conversions
│   ├── shipments/
│   │   ├── page.tsx                // Shipment list (Smart)
│   │   └── [id]/page.tsx           // Shipment details
│   ├── boxes/
│   │   ├── page.tsx                // All SmartBoxes
│   │   └── [id]/page.tsx           // Box details + chart
│   └── reports/
│       ├── page.tsx                // Overview
│       ├── revenue/page.tsx        // Revenue analytics
│       └── sustainability/page.tsx // Global impact stats
```

### Components

```
src/components/b2b/
├── ConsumptionEstimator.tsx        // Interactive calculator
├── TierComparison.tsx              // Pricing tier cards
├── SmartBoxStatus.tsx              // Box level indicator
├── ShipmentHistory.tsx             // Recent/upcoming shipments
├── ConsumptionChart.tsx            // Historical usage graph
├── B2BInquiryForm.tsx              // Contact form
├── BoxReadingGauge.tsx             // Radial gauge for box level display
├── PromoCodeStats.tsx              // Employee conversion stats for a company
└── EmployeeWelcome.tsx             // Welcome content for promo landing page
```

---

## Admin Dashboard Features

### B2B Overview Dashboard

**Key Metrics:**
- Total active B2B clients (by tier)
- Monthly recurring revenue (Smart MRR + Flex orders)
- Employee conversions this month (promo code usage)
- SmartBoxes needing attention (low battery, low stock)
- Pending shipments this week

### Company Management

**Company Detail View:**
- Contact information
- Subscription details
- **Promo code section:**
  - Company's promo code (e.g., `MLOU-ACME`)
  - QR code for golden sign (downloadable)
  - Toggle to enable/disable promo
  - Discount percentage (editable)
- **Employee conversions:**
  - Total conversions (all time)
  - Conversions this month
  - List of converted employees (email, order date, order value)
  - Conversion value (total revenue from employees)
- Assigned SmartBoxes with current levels
- Delivery history
- Invoice history
- Consumption patterns chart
- Notes and communication log

### Employee Conversions

**Conversions Dashboard (`/admin/b2b/conversions`):**
- Total conversions across all B2B clients
- Conversions by company (ranking)
- Conversion trend chart (monthly)
- Average order value from B2B promo codes
- Top performing promo codes

### SmartBox Monitoring

**Alert System:**
- Stock below threshold → Auto-triggers shipment
- Battery below 20% → Flag for customer notification
- No reading in 48h → Device offline alert

**Box Detail View:**
- Current level (visual gauge)
- 30-day consumption chart
- Average daily consumption
- Predicted days until empty
- Last reading timestamp
- Battery status

### Shipment Management (Smart Tier)

**Shipment Triggers:**
- Auto-triggered by SmartBox sensor (primary)
- Manual trigger by admin
- Scheduled interval (optional customer setting)

**Shipment Workflow:**
1. Triggered → Order created
2. Processing → Roasting/packing
3. Shipped → Tracking sent to customer
4. Delivered → Customer refills SmartBox

**Admin Tools:**
- View pending/recent shipments
- Manual trigger for any Smart customer
- Override auto-shipment timing
- View shipment history per company

---

## i18n Content

All B2B pages require German and English translations:

```typescript
// src/messages/en.json additions
{
  "b2b": {
    "hero": {
      "title": "Coffee for Your Team",
      "subtitle": "Sustainable, hassle-free office coffee with smart inventory management"
    },
    "features": {
      "smartbox": "Smart Storage",
      "smartboxDesc": "Never run out. Our sensor-equipped boxes track inventory and trigger automatic reorders.",
      "flatrate": "Simple Pricing",
      "flatrateDesc": "One predictable per-employee rate. No surprises, no complexity.",
      "sustainability": "Sustainably Sourced",
      "sustainabilityDesc": "Direct trade coffee, fair farmer wages, and eco-friendly packaging. Good for your team, good for the planet.",
      "quality": "Always Fresh",
      "qualityDesc": "Roasted to order, delivered on schedule. Your team always gets peak freshness."
    },
    "cta": {
      "getQuote": "Get a Quote",
      "calculate": "Calculate Your Needs",
      "contact": "Contact Us"
    },
    "estimator": {
      "title": "Estimate Your Coffee Needs",
      "employees": "Number of Employees",
      "cupsPerDay": "Cups per Employee per Day",
      "daysPerWeek": "Office Days per Week",
      "monthlyKg": "Estimated Monthly Consumption",
      "recommendedTier": "Recommended Tier",
      "monthlyCost": "Estimated Monthly Cost"
    },
    "welcome": {
      "title": "Your Office Drinks Marie Lou",
      "subtitle": "Get the same great coffee at home — with {discount}% off your first order",
      "cta": "Shop Now",
      "invalidCode": "This promo code is not valid",
      "expiredCode": "This promo code has expired",
      "alreadyUsed": "You've already used this promo code"
    },
    "promo": {
      "applied": "B2B discount applied: {discount}% off",
      "invalid": "Invalid promo code"
    }
  }
}

// src/messages/de.json additions
{
  "b2b": {
    "hero": {
      "title": "Kaffee für Ihr Team",
      "subtitle": "Nachhaltiger, unkomplizierter Bürokaffee mit intelligenter Bestandsverwaltung"
    },
    "features": {
      "smartbox": "Smarte Lagerung",
      "smartboxDesc": "Nie wieder leer. Unsere sensorgesteuerten Boxen überwachen den Bestand und lösen automatische Nachbestellungen aus.",
      "flatrate": "Einfache Preise",
      "flatrateDesc": "Ein vorhersehbarer Preis pro Mitarbeiter. Keine Überraschungen, keine Komplexität.",
      "sustainability": "Nachhaltig bezogen",
      "sustainabilityDesc": "Direkter Handel, faire Löhne für Bauern und umweltfreundliche Verpackung. Gut für Ihr Team, gut für den Planeten.",
      "quality": "Immer Frisch",
      "qualityDesc": "Auf Bestellung geröstet, pünktlich geliefert. Ihr Team bekommt immer beste Frische."
    },
    "cta": {
      "getQuote": "Angebot Anfordern",
      "calculate": "Bedarf Berechnen",
      "contact": "Kontakt"
    },
    "estimator": {
      "title": "Berechnen Sie Ihren Kaffeebedarf",
      "employees": "Anzahl Mitarbeiter",
      "cupsPerDay": "Tassen pro Mitarbeiter pro Tag",
      "daysPerWeek": "Bürotage pro Woche",
      "monthlyKg": "Geschätzter Monatsverbrauch",
      "recommendedTier": "Empfohlenes Paket",
      "monthlyCost": "Geschätzte Monatskosten"
    },
    "welcome": {
      "title": "Ihr Büro trinkt Marie Lou",
      "subtitle": "Holen Sie sich den gleichen großartigen Kaffee nach Hause — mit {discount}% Rabatt auf Ihre erste Bestellung",
      "cta": "Jetzt Einkaufen",
      "invalidCode": "Dieser Promo-Code ist ungültig",
      "expiredCode": "Dieser Promo-Code ist abgelaufen",
      "alreadyUsed": "Sie haben diesen Promo-Code bereits verwendet"
    },
    "promo": {
      "applied": "B2B-Rabatt angewendet: {discount}% Rabatt",
      "invalid": "Ungültiger Promo-Code"
    }
  }
}
```

---

## SmartBox Hardware Specification

### Storage Box Bill of Materials

| Component                | Model              | Est. Cost |
| ------------------------ | ------------------ | --------- |
| Load cell                | 5kg TAL220         | €8        |
| HX711 amplifier          | SparkFun HX711     | €5        |
| Microcontroller          | ESP32-C3           | €4        |
| Battery                  | 18650 3.7V 3000mAh | €5        |
| Charging circuit         | TP4056             | €1        |
| Container                | Custom food-grade  | €15       |
| Gasket/seal              | Silicone           | €3        |
| CO2 valve                | One-way            | €2        |
| Misc (wiring, enclosure) | -                  | €7        |
| **Total**                |                    | **~€50**  |

### Firmware Features

```cpp
// Pseudocode for ESP32 firmware
void setup() {
  initWiFi();
  initLoadCell();
  configureDeepSleep(READING_INTERVAL_HOURS);
}

void loop() {
  float weight = readLoadCell();
  float battery = readBatteryVoltage();
  
  if (connectWiFi()) {
    sendReading(weight, battery);
  }
  
  enterDeepSleep();
}
```

### API Payload

```json
{
  "device_id": "box_abc123",
  "reading": {
    "weight_grams": 2340,
    "battery_mv": 3850,
    "timestamp": "2025-01-10T14:30:00Z"
  }
}
```

---

## Launch Phases

### Phase 1: Flex MVP (Week 1-2)
- B2B landing page with tier comparison
- Inquiry form with tier preference
- Manual client management in admin
- B2B portal with basic ordering (Flex)
- Business invoicing integration
- Promo code system for employee cross-sell

### Phase 2: Smart Foundation (Week 3-4)
- Smart tier onboarding flow
- Stripe subscription integration
- Delivery scheduling and management
- Golden sign design and ordering
- Manual box tracking (pre-SmartBox)

### Phase 3: SmartBox Integration (Week 5-8)
- SmartBox hardware development
- Device API and registration
- Box monitoring dashboard
- Automated low-stock alerts and auto-reorder
- Customer self-refill workflow

### Phase 4: Full Automation (Week 9-12)
- Automated monthly invoicing
- Payment reminder automation
- Consumption analytics and forecasting
- Sustainability reporting
- Upgrade flow (Flex → Smart)

### Phase 5: Scale & Future (Ongoing)
- Multi-location support
- Advanced analytics and forecasting
- API for enterprise integrations
- Puck collection program (when volume justifies delivery infrastructure)

---

## Success Metrics

| Metric                     | Target                    | Notes                                |
| -------------------------- | ------------------------- | ------------------------------------ |
| **Acquisition**            |                           |                                      |
| Flex clients               | 20 in first 6 months      | Lower barrier to entry               |
| Smart clients              | 10 in first 6 months      | Main revenue driver                  |
| Flex → Smart conversion    | 30% within 6 months       | Upgrade funnel health                |
| **Retention**              |                           |                                      |
| Flex retention             | >70% after 12 months      | Order at least 4x/year               |
| Smart retention            | >90% after 12 months      | Higher commitment = higher retention |
| **Revenue**                |                           |                                      |
| B2B % of total revenue     | >40% by month 12          | Shift toward B2B                     |
| Smart MRR                  | €3,000 by month 12        | 10 clients × €300 avg                |
| **Employee Cross-sell**    |                           |                                      |
| Promo code usage           | 5% of employees convert   | Per Smart client                     |
| D2C revenue from B2B leads | Track separately          | Attribution matters                  |
| **Operations (Smart)**     |                           |                                      |
| SmartBox uptime            | >99% reading reliability  | After Phase 3                        |
| Auto-reorder accuracy      | >95% trigger before empty | Core value prop                      |
| Shipment on-time rate      | >95%                      | Standard carrier dependent           |
| **Payments**               |                           |                                      |
| Flex payment on time       | >85%                      | Within terms                         |
| Smart payment failures     | <5%                       | Stripe handles retry                 |

---

## Integration with D2C Platform

The B2B feature integrates with the existing D2C shop infrastructure. This section clarifies shared resources and separation points.

### Shared Infrastructure (Use Existing)

| Component             | Location                               | B2B Usage                                     |
| --------------------- | -------------------------------------- | --------------------------------------------- |
| Email client          | `src/lib/email.ts`                     | Import `resend`, `getFromEmail()` utilities   |
| Cron authentication   | `src/lib/cron-auth.ts`                 | Use same `verifyCronRequest()` middleware     |
| Password reset tokens | `passwordResetTokens` table            | B2B portal uses same table for password reset |
| Base components       | `src/components/ui/`                   | Reuse buttons, forms, cards, etc.             |
| Admin layout          | `src/app/admin/(dashboard)/layout.tsx` | B2B section uses same admin shell             |

### Separate Systems (Don't Mix)

| D2C System            | B2B System                           | Why Separate                               |
| --------------------- | ------------------------------------ | ------------------------------------------ |
| `referralCodes` table | `b2bCompanies.promoCode`             | Different reward models                    |
| `subscriptions` table | `b2bInvoices` + Stripe subscriptions | Different billing logic                    |
| `giftCards` table     | N/A                                  | Gift cards not applicable to B2B invoicing |
| `/account/` routes    | `/b2b/portal/` routes                | Different auth, different UX               |
| Customer addresses    | Company addresses                    | Different data model                       |

### Cron Jobs Configuration

B2B cron jobs are **added to** the existing `vercel.json`, not a separate file:

```json
// vercel.json - ADD these to existing crons array
{
  "crons": [
    // ... existing D2C crons ...
    
    // B2B crons to add:
    {
      "path": "/api/cron/b2b/process-smart-billing",
      "schedule": "0 6 1 * *"
    },
    {
      "path": "/api/cron/b2b/check-smartbox-alerts",
      "schedule": "0 8 * * *"
    },
    {
      "path": "/api/cron/b2b/send-payment-reminders",
      "schedule": "0 9 * * *"
    },
    {
      "path": "/api/cron/b2b/shipment-reminders",
      "schedule": "0 7 * * 1"
    }
  ]
}
```

### Email Templates Structure

```
src/emails/
├── OrderConfirmation.tsx      # D2C
├── OrderShipped.tsx           # D2C
├── ReviewRequest.tsx          # D2C
├── Welcome.tsx                # D2C
├── PasswordReset.tsx          # Shared (D2C + B2B)
├── ...
└── b2b/                       # B2B-specific templates
    ├── inquiry-received.tsx
    ├── welcome-flex.tsx
    ├── welcome-smart.tsx
    ├── shipment-dispatched.tsx
    ├── order-confirmation.tsx
    ├── invoice.tsx
    ├── payment-reminder.tsx
    ├── employee-conversion.tsx
    ├── admin-new-inquiry.tsx
    ├── admin-low-stock.tsx
    └── admin-payment-failed.tsx
```

### Admin Navigation Integration

Add B2B section to admin sidebar navigation:

```typescript
// In admin layout navigation
const adminNavItems = [
  // Existing D2C items
  { href: '/admin', label: 'Dashboard', icon: Home },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/admin/customers', label: 'Customers', icon: Users },
  { href: '/admin/reviews', label: 'Reviews', icon: Star },
  { href: '/admin/referrals', label: 'Referrals', icon: Gift },
  
  // B2B section (add divider + new items)
  { type: 'divider', label: 'B2B' },
  { href: '/admin/b2b', label: 'B2B Overview', icon: Building },
  { href: '/admin/b2b/inquiries', label: 'Inquiries', icon: Inbox },
  { href: '/admin/b2b/companies', label: 'Companies', icon: Building2 },
  { href: '/admin/b2b/orders', label: 'Flex Orders', icon: FileText },
  { href: '/admin/b2b/shipments', label: 'Shipments', icon: Truck },
  { href: '/admin/b2b/boxes', label: 'SmartBoxes', icon: Box },
];
```

### Orders Table: Shared with Extensions

The main `orders` table is shared between D2C and B2B promo code tracking:

```typescript
// Orders table has both D2C and B2B fields
export const orders = sqliteTable('orders', {
  // ... existing fields ...
  
  // D2C referral tracking
  referralCodeUsed: text('referral_code_used'),
  referralDiscount: integer('referral_discount').default(0),
  
  // D2C review tracking
  reviewRequestSentAt: integer('review_request_sent_at', { mode: 'timestamp' }),
  
  // B2B promo code tracking (employee cross-sell)
  b2bPromoCode: text('b2b_promo_code'),
  b2bPromoDiscount: integer('b2b_promo_discount').default(0),
});
```

### Gift Cards: Not Applicable to B2B

D2C gift cards are **not redeemable** on B2B orders because:
- Flex orders use business invoicing (net terms), not immediate payment
- Smart orders are subscription-based
- Gift cards are consumer-oriented

However, employees who convert via B2B promo codes can use gift cards on their personal D2C orders.

### Subscriptions: Two Separate Systems

| Aspect     | D2C Subscriptions        | B2B Smart Subscriptions |
| ---------- | ------------------------ | ----------------------- |
| Table      | `subscriptions`          | `b2bInvoices` + Stripe  |
| Model      | Per-product recurring    | Per-employee flatrate   |
| Trigger    | Fixed interval           | SmartBox sensor + fixed |
| Billing    | Card charge              | Invoice (net terms)     |
| Management | `/account/subscriptions` | `/b2b/portal/` + admin  |

These are completely separate codebases — don't try to unify them.

---

*This B2B program transforms every client office into a sustainable coffee and tea showroom while creating a predictable revenue stream and customer acquisition flywheel. The tiered approach (Flex → Smart) lowers the barrier to entry while positioning the full SmartBox program as the premium, differentiated offering.*