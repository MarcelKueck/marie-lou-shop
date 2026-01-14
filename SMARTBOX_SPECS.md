# Marie Lou SmartBox — Product Specification

## Overview

The SmartBox is a premium, sensor-equipped coffee/tea storage container that automatically monitors inventory levels and triggers replenishment orders. It's the core hardware differentiator for the Marie Lou B2B Smart tier.

**Mission:** Never let an office run out of great coffee — while looking beautiful doing it.

**Approach:** Premium off-the-shelf container (OXO Steel POP) + custom-designed tech base. This allows rapid prototyping with premium aesthetics while keeping manufacturing simple.

---

## Capacity Planning

### Coffee Consumption Reference

```
Per employee per week:
  ~2.5 cups/day × 10g/cup × 5 days = 125g/week

Office sizing:
  5 employees  → 625g/week
  10 employees → 1.25kg/week
  15 employees → 1.9kg/week
  20 employees → 2.5kg/week
  30 employees → 3.75kg/week
```

### Container Volume to Capacity

Coffee beans are bulky — approximately 300-350g per liter.

| Container Volume | Bean Capacity | Suitable For (Weekly) |
| ---------------- | ------------- | --------------------- |
| 3L               | ~1.0 kg       | 8 employees           |
| 4L               | ~1.3 kg       | 10 employees          |
| 5L               | ~1.7 kg       | 13 employees          |
| 6L               | ~2.0 kg       | 16 employees          |
| 8L               | ~2.7 kg       | 21 employees          |
| 10L              | ~3.3 kg       | 26 employees          |

---

## Design Philosophy

### The SmartBox Should Feel Like:
- A premium kitchen appliance (think Fellow, Balmuda, Apple)
- Sustainable and intentional (not cheap IoT plastic)
- Beautiful enough to display proudly, not hide
- Tech that disappears — you notice the coffee, not the gadget

### The SmartBox Should NOT Feel Like:
- A science project with exposed wires
- Generic office equipment
- Flashy RGB gamer aesthetics
- Disposable electronics

---

## Design: OXO Container + Custom Tech Base

A hybrid approach: premium off-the-shelf container sitting on a custom-designed oak tech base.

```
┌─────────────────────────┐
│                         │
│    OXO Steel POP        │  ← Off-the-shelf premium container
│    Container            │     (steel body, airtight seal)
│                         │
│                         │
│    ┌───────────────┐    │
│    │  Push button  │    │  ← OXO's signature airtight button
│    └───────────────┘    │
├─────────────────────────┤
│   ═══ Load cell ═══     │  ← Hidden inside base
├─────────────────────────┤
│    Custom Oak Base      │  ← Your design: houses all electronics
│                         │
│   MARIE LOU    ▓▓▓▓▓    │  ← Laser-etched logo + LED fill indicator
│                         │
│   [●]  [QR]    [USB-C]  │  ← Power LED, brass QR plate, charging
└─────────────────────────┘
```

### Container: OXO Steel POP

**Why this container:**
- Premium brushed steel exterior
- Square shape (ideal for load cell)
- Airtight push-button seal
- Proven durability
- Available in multiple sizes
- €35-45 per unit

**Sourcing:**
- Amazon.de: "OXO Steel POP"
- WMF stores
- Galaxus.de
- KochForm.de

### Custom Tech Base

**Purpose:** Houses all SmartBox electronics while providing premium aesthetic.

```
TOP VIEW:
┌─────────────────────────────────────┐
│  ┌───────────────────────────────┐  │
│  │                               │  │
│  │     Load cell platform        │  │  ← Container sits here
│  │     (aluminum plate)          │  │
│  │                               │  │
│  └───────────────────────────────┘  │
│                                     │
│  [ESP32]  [SIM7080G]   [Battery]    │  ← Electronics underneath
│                                     │
│  MARIE LOU        ▓▓▓▓▓    [USB-C]  │  ← Logo, LEDs, charging
│                   Fill     Charge   │
│        [QR]       LEDs              │  ← Brass plate
└─────────────────────────────────────┘
        Oak or walnut wood

SIDE VIEW:
              Container
         ┌─────────────────┐
         │                 │
         │  OXO Steel POP  │  ← Off-the-shelf
         │                 │
         │                 │
         ├─────────────────┤
         │ ══ Load cell ══ │  ← Hidden
    ┌────┴─────────────────┴────┐
    │     Custom Tech Base      │  ← 4 cm tall
    │  MARIE LOU  ▓▓▓▓▓  [USB]  │
    └───────────────────────────┘
           Oak wood
```

### Materials

| Component          | Material                    | Notes                          |
| ------------------ | --------------------------- | ------------------------------ |
| Container          | OXO Steel POP               | Off-the-shelf, steel + plastic |
| Tech base body     | FSC-certified oak or walnut | CNC machined or handcrafted    |
| Load cell platform | Aluminum plate              | Hidden inside base             |
| QR plate           | Brass                       | Laser-etched, inset into wood  |
| LED window         | Frosted acrylic strip       | For fill indicator visibility  |
| Base bottom        | Cork or rubber              | Non-slip, protects surfaces    |

### Color/Finish Options

| Option       | Container          | Base              | Target Aesthetic    |
| ------------ | ------------------ | ----------------- | ------------------- |
| **Classic**  | OXO Steel (silver) | Natural oak       | Clean, Scandinavian |
| **Dark**     | OXO Steel (silver) | Dark walnut       | Modern, executive   |
| **Contrast** | OXO Steel (silver) | Black-stained oak | Bold, contemporary  |

---

## SmartBox Sizes

### Product Lineup

| Model          | Container          | Volume | Capacity | Target Office   | Refill Cycle    |
| -------------- | ------------------ | ------ | -------- | --------------- | --------------- |
| **SmartBox S** | OXO Steel POP 4.2L | 4.2L   | ~1.4 kg  | 5-12 employees  | Weekly          |
| **SmartBox M** | OXO Steel POP 5.7L | 5.7L   | ~1.9 kg  | 10-18 employees | Weekly          |
| **SmartBox L** | Custom 10L         | 10L    | ~3.3 kg  | 18-30 employees | Weekly-Biweekly |

For offices >30 employees: Deploy 2× SmartBox M (can offer different blends/origins).

### Dimensions

| Model      | Container (W×D×H) | With Tech Base | Total Height |
| ---------- | ----------------- | -------------- | ------------ |
| SmartBox S | 11 × 11 × 24 cm   | +4 cm base     | 28 cm        |
| SmartBox M | 11 × 11 × 32 cm   | +4 cm base     | 36 cm        |
| SmartBox L | 16 × 16 × 30 cm   | +5 cm base     | 35 cm        |

### Why OXO Steel POP?

| Feature              | Benefit                           |
| -------------------- | --------------------------------- |
| Square shape         | Perfect for load cell integration |
| Steel exterior       | Premium look, durable             |
| Airtight button seal | Keeps beans fresh                 |
| Stackable            | Multiple units look intentional   |
| Widely available     | Easy to source replacements       |
| Proven quality       | Thousands of positive reviews     |

### Form Factor Priorities

- ✅ Fits next to standard coffee machine
- ✅ Fits inside standard cabinet (< 40cm height)
- ✅ Stable (low center of gravity in wood base)
- ✅ Square footprint (space efficient)
- ✅ Easy to open one-handed
- ❌ Not wider than 20cm
- ❌ Not taller than 40cm

---

## Technical Architecture

### Hardware Block Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        SMARTBOX v1.0                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐     │
│  │  Load Cell  │──────│   HX711     │──────│             │     │
│  │  (TAL221)   │      │   ADC       │      │             │     │
│  └─────────────┘      └─────────────┘      │             │     │
│                                            │   ESP32-S3  │     │
│  ┌─────────────┐      ┌─────────────┐      │             │     │
│  │  LTE-M      │──────│  SIM7080G   │──────│   (Main     │     │
│  │  Antenna    │      │  Module     │      │    MCU)     │     │
│  └─────────────┘      └─────────────┘      │             │     │
│                                            │             │     │
│  ┌─────────────┐                           │             │     │
│  │  Battery    │───────────────────────────│             │     │
│  │  6000mAh    │      ┌─────────────┐      │             │     │
│  │  LiPo       │──────│  BMS +      │──────│             │     │
│  └─────────────┘      │  Charging   │      └─────────────┘     │
│        │              └─────────────┘            │              │
│        │                    │                    │              │
│  ┌─────┴─────┐        ┌─────┴─────┐        ┌────┴────┐        │
│  │  USB-C    │        │  Fuel     │        │  LED    │        │
│  │  Port     │        │  Gauge    │        │  Driver │        │
│  └───────────┘        └───────────┘        └────┬────┘        │
│                                                  │              │
│                    ┌────────────────────────────┴───┐          │
│                    │  LEDs:                         │          │
│                    │  • Logo backlight (warm white) │          │
│                    │  • Fill indicator (5 segments) │          │
│                    │  • Battery indicator (4 dots)  │          │
│                    └────────────────────────────────┘          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Key Components

| Component             | Model                   | Purpose                       | Est. Cost |
| --------------------- | ----------------------- | ----------------------------- | --------- |
| MCU                   | ESP32-S3                | Main processor, BLE for setup | €4        |
| Cellular              | SIM7080G (LTE-M/NB-IoT) | Connectivity, no WiFi needed  | €12       |
| Load Cell             | TAL221 5kg              | Weight measurement            | €8        |
| ADC                   | HX711                   | Load cell signal processing   | €2        |
| Battery               | 6000mAh LiPo pouch      | 6+ months runtime             | €12       |
| BMS                   | TP4056 + DW01           | Safe charging circuit         | €2        |
| Fuel Gauge            | MAX17048                | Accurate battery % reporting  | €3        |
| LED Driver            | TLC5940 or GPIO PWM     | LED control with dimming      | €2        |
| LEDs                  | Warm white 2700K        | Premium ambient light         | €3        |
| Antenna               | LTE-M PCB antenna       | Internal mount                | €3        |
| SIM                   | 1NCE IoT eSIM           | €10 for 10 years / 500MB      | €1        |
| **Electronics Total** |                         |                               | **~€52**  |

### Enclosure Costs

| Component           | Material                               | Est. Cost  |
| ------------------- | -------------------------------------- | ---------- |
| Body (S/M/L)        | Recycled aluminum, powder coat         | €25-35     |
| Interior liner      | Food-grade stainless steel             | €10        |
| Lid                 | Aluminum + silicone gasket + CO2 valve | €10        |
| Base                | FSC oak, CNC machined                  | €15        |
| QR plate            | Brass, laser etched                    | €5         |
| Assembly hardware   | Screws, gaskets, misc                  | €3         |
| **Enclosure Total** |                                        | **€68-78** |

### Total Bill of Materials

| Component                | SmartBox S | SmartBox M | SmartBox L |
| ------------------------ | ---------- | ---------- | ---------- |
| Container (OXO/Custom)   | €40        | €45        | €65        |
| Electronics              | €52        | €52        | €52        |
| Custom oak tech base     | €28        | €30        | €38        |
| LEDs, QR plate, assembly | €15        | €15        | €18        |
| **Total BOM**            | **€135**   | **€142**   | **€173**   |

*At 100+ units, costs reduce 20-30% through bulk purchasing.*

### Container Sourcing

| Model              | Source      | Price  | Notes               |
| ------------------ | ----------- | ------ | ------------------- |
| OXO Steel POP 4.2L | Amazon.de   | €38-42 | SmartBox S          |
| OXO Steel POP 5.7L | Amazon.de   | €42-48 | SmartBox M          |
| Custom 10L         | OEM/Alibaba | €55-70 | SmartBox L (future) |

### Tech Base Manufacturing

| Method                       | Cost/Unit | MOQ  | Best For           |
| ---------------------------- | --------- | ---- | ------------------ |
| Local carpenter              | €40-60    | 1    | Prototypes (1-5)   |
| CNC machined oak             | €30-40    | 10   | Pilot batch (5-20) |
| Small batch production       | €25-30    | 50   | Scale (20-100)     |
| Injection mold + wood veneer | €15-20    | 500+ | Mass production    |

---

## Connectivity

### Why Cellular (Not WiFi)

| Option                | Verdict | Reason                                |
| --------------------- | ------- | ------------------------------------- |
| Corporate WiFi        | ❌       | Security nightmare, IT never approves |
| Dedicated WiFi router | ❌       | Client setup burden, unreliable       |
| LoRaWAN               | ❌       | Requires gateway installation         |
| **LTE-M/NB-IoT**      | ✅       | Works anywhere, zero setup, low power |

### Data Plan: 1NCE IoT SIM

- **Cost:** €10 one-time for 10 years / 500MB
- **Coverage:** Pan-European
- **No monthly fees**
- **Perfect for low-data IoT**

### Data Usage

```
Per transmission: ~1 KB
Transmissions/day: 2
Daily data: ~2 KB
Monthly data: ~60 KB
Yearly data: ~720 KB
500MB lifetime: 700+ years (effectively unlimited)
```

---

## Power Management

### Power States

| State          | Current Draw | Duration    | Frequency      |
| -------------- | ------------ | ----------- | -------------- |
| Deep sleep     | 15 µA        | ~23.9 hours | Continuous     |
| Wake + measure | 40 mA        | 2 seconds   | 2x daily       |
| LTE-M transmit | 200 mA       | 10 seconds  | 2x daily       |
| LED ambient    | 5 mA         | 8 hours     | Weekdays only  |
| LED attention  | 20 mA        | 5 min/hour  | When <20% full |

### Battery Life Calculation

```
Daily consumption (weekday): ~41.5 mAh
Daily consumption (weekend): ~1.5 mAh
Weekly average: ~30 mAh/day

6000 mAh × 80% usable = 4800 mAh
4800 ÷ 30 = 160 days (~5.5 months)
```

**Target: 6+ months between charges** ✅

### Power Optimization Options

| Feature                               | Battery Savings |
| ------------------------------------- | --------------- |
| Disable ambient LED                   | +2 months       |
| Reduce to 1x/day transmission         | +1 month        |
| Motion-activated LEDs only            | +3 months       |
| Office hours LED only (auto-detected) | +40% savings    |

---

## LED Behavior

### Fill Level Indicator (5 Segments, Vertical)

```
┌───┐
│ ● │ 100%  ── All warm white
├───┤
│ ● │ 80%   ── All warm white  
├───┤
│ ● │ 60%   ── Top 3 warm white
├───┤
│ ◐ │ 40%   ── Top 2 amber
├───┤
│ ○ │ 20%   ── Top 1 red, gentle pulse
└───┘
```

### Battery Indicator (4 Dots, Horizontal)

```
100%:    ● ● ● ●  (all white, solid)
75%:     ● ● ● ○
50%:     ● ● ○ ○
25%:     ● ○ ○ ○  (amber)
<10%:    ◐ ○ ○ ○  (red, slow blink)
Charging: ● ● ◐ ○  (rightmost pulses)
```

### Attention States

| State                   | LED Behavior              | Trigger                  |
| ----------------------- | ------------------------- | ------------------------ |
| Normal                  | Soft ambient glow         | Office hours             |
| Low coffee (<20%)       | Gentle breathing pulse    | Every 30 seconds         |
| Critical coffee (<10%)  | Slow red pulse            | Every 10 seconds         |
| Low battery (<20%)      | Battery dots amber        | Constant                 |
| Critical battery (<10%) | Red dot blinking          | Every 5 seconds          |
| Charging                | Rightmost dot pulses      | USB-C connected          |
| Just refilled           | Brief "fill up" animation | Weight increase detected |
| Offline/Error           | Logo pulses red           | No connectivity 48h+     |

---

## Golden Sign & QR Code

### Integrated Design

The brass QR plate is integrated into the wooden base:
- Laser-etched QR code
- "MARIE LOU" text above
- Links to `/b2b/welcome/[company-promo-code]`
- Optional: NFC chip behind plate (+€1)

### Employee Flow

```
Employee sees SmartBox in kitchen
        ↓
Scans QR code (or taps NFC)
        ↓
Opens: marieloucoffee.com/b2b/welcome/ACME10
        ↓
"Your office drinks Marie Lou. Get 10% off at home."
        ↓
Promo code auto-applied to cart
        ↓
New D2C customer acquired (tracked to company)
```

---

## Backend Integration

### Data Payload (Device → Server)

```json
POST /api/devices/reading
{
  "device_id": "box_abc123",
  "timestamp": "2026-01-15T08:30:00Z",
  "weight_grams": 1450,
  "battery_percent": 87,
  "battery_mv": 3920,
  "signal_rssi": -75,
  "temperature_c": 22.5
}
```

### Analytics Derived

| Metric                | Calculation                              |
| --------------------- | ---------------------------------------- |
| Current fill %        | `weight / capacity × 100`                |
| Daily consumption     | `weight_yesterday - weight_today`        |
| Days until empty      | `current_weight / avg_daily_consumption` |
| Recommended ship date | `predicted_empty_date - lead_time_days`  |
| Consumption trend     | Compare last 7 days vs previous 7 days   |

### Automatic Order Logic

```
Daily at 6 AM:
1. For each active SmartBox:
   a. Calculate days until empty
   b. If days_until_empty <= (lead_time + buffer):
      - Calculate quantity needed (fill to 90%)
      - Round up to nearest 250g
      - Create shipment order
      - Flag as urgent if < lead_time
2. Group orders by roast date
3. Generate roasting plan
4. Notify admin
```

---

## Admin Dashboard Features

### Operations View

```
┌─────────────────────────────────────────────────────────────┐
│ 🔥 TODAY'S ROASTING        │ 📬 SHIP TODAY                 │
│ ─────────────────          │ ────────────                  │
│ Total: 4.5 kg              │ 3 shipments ready             │
│ • Ethiopia 2.0 kg          │ • TechHub (URGENT)            │
│ • Colombia 1.5 kg          │ • Design Co                   │
│ • House 1.0 kg             │ • StartupXYZ                  │
│ [Start Roasting]           │ [Print Labels]                │
├─────────────────────────────────────────────────────────────┤
│ ⚠️ ALERTS                   │ 📊 THIS WEEK                  │
│ 🔋 Low Battery: 2 boxes    │ Total kg: 14.5                │
│ 📡 Offline: 1 box (48h)    │ Shipments: 18                 │
│ ☕ Critical (<10%): 1 box  │ Avg consumption: 340g/day     │
└─────────────────────────────────────────────────────────────┘
```

### Per-Box Analytics

- Weight over time chart (30 days)
- Daily consumption breakdown (Mon-Sun pattern)
- Refill history
- Predicted empty date
- Consumption trend (increasing/stable/decreasing)
- Anomaly detection (sudden drops, unusual patterns)

---

## Future Enhancements (V2)

### Automatic Vacuum Pump System ⭐

**The Headline Feature for V2**

An automated vacuum pump that activates when the lid is closed, removing air to keep coffee fresher longer.

#### How It Works

```
1. LID CLOSED (magnetic sensor detects)
        ↓
2. Wait 2 seconds (ensure fully closed)
        ↓
3. Pump activates (15-20 seconds)
        ↓
4. Air evacuated through check valve
        ↓
5. Pump stops, vacuum sealed
        ↓
6. LED indicator: "Sealed" ✓ (green pulse)
        ↓
7. Log event + report to backend
```

#### Technical Implementation

```
VACUUM SYSTEM DIAGRAM:

┌─────────────────────────────────────┐
│           Modified Lid              │
│  ┌─────────────────────────────┐    │
│  │    Silicone gasket ring     │    │
│  │  ┌───────────────────────┐  │    │
│  │  │   Check valve (out)   │──────→ Tube to pump
│  │  └───────────────────────┘  │    │
│  │    Magnet (for sensor)  ◉   │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
              │
              │ Silicone tube (hidden along back)
              │
┌─────────────┴───────────────────────┐
│          Tech Base                  │
│  ┌──────────┐                       │
│  │  Micro   │ ← SC3701PM pump       │
│  │  Pump    │   (creates vacuum)    │
│  └──────────┘                       │
│  [ESP32]  [Battery]  [Load cell]    │
└─────────────────────────────────────┘
```

#### Components Required

| Component             | Model/Type      | Purpose             | Cost       |
| --------------------- | --------------- | ------------------- | ---------- |
| Micro diaphragm pump  | SC3701PM        | Creates vacuum      | €8-12      |
| Check valve           | One-way, 4mm    | Maintains vacuum    | €2         |
| Silicone tubing       | 4mm ID, 50cm    | Air path            | €2         |
| Modified lid seal     | Silicone gasket | Airtight seal       | €3         |
| Pressure sensor       | BMP280          | Verify vacuum level | €3         |
| Magnetic reed switch  | Standard        | Detect lid closed   | €1         |
| **Total V2 addition** |                 |                     | **€19-23** |

#### Power Impact

```
Pump specs:
- Voltage: 3.3-6V DC
- Current: 300-500mA
- Run time per seal: 15-20 seconds
- Vacuum achieved: -0.3 to -0.5 bar

Daily usage (typical office):
- Lid opens/closes: ~8-10 times/day
- Pump runs: 10 × 15 sec = 150 seconds/day
- Power: 400mA × 150s ÷ 3600 = ~17 mAh/day

Battery life impact:
- V1 (no pump): ~160 days (5+ months)
- V2 (with pump): ~100 days (3+ months)

Still acceptable for quarterly check-ins ✓
```

#### Coffee Freshness Context

| Days Post-Roast | Bean State          | Vacuum Benefit         |
| --------------- | ------------------- | ---------------------- |
| 0-3 days        | Heavy CO2 degassing | Low (needs to breathe) |
| 3-7 days        | Moderate degassing  | Medium                 |
| 7-14 days       | Light degassing     | High                   |
| 14+ days        | Stable              | Very high              |

**For Marie Lou's use case:**
- Roast fresh, ship within 2-3 days
- Arrives at office 3-5 days post-roast
- Consumed within 7-10 days
- **Vacuum helps in second half of consumption cycle**

#### Vacuum UX Indicators

| State               | LED Behavior                    |
| ------------------- | ------------------------------- |
| Lid open            | Normal fill indicator           |
| Lid closed, pumping | Small LED pulses blue           |
| Vacuum sealed       | LED solid green 3 sec, then off |
| Vacuum lost (leak)  | LED amber (maintenance needed)  |

#### Why Wait for V2?

1. **Validate core concept first** — Auto-reorder is the main value prop
2. **Simpler = faster to market** — Get units deployed, learn from real usage
3. **Add differentiation later** — When competitors emerge, vacuum becomes moat
4. **Reduce initial complexity** — Fewer failure points in V1

#### V2 BOM Update (With Vacuum)

| Component                | SmartBox S | SmartBox M | SmartBox L |
| ------------------------ | ---------- | ---------- | ---------- |
| Container                | €40        | €45        | €65        |
| Electronics              | €52        | €52        | €52        |
| **Vacuum system**        | €22        | €22        | €22        |
| Custom tech base         | €32        | €34        | €42        |
| LEDs, QR plate, assembly | €15        | €15        | €18        |
| **Total BOM (V2)**       | **€161**   | **€168**   | **€199**   |

---

### Other V2 Features

| Feature            | Purpose                      | Cost Impact |
| ------------------ | ---------------------------- | ----------- |
| NFC chip           | Tap-to-open promo page       | +€1         |
| Temperature sensor | Quality assurance alerts     | +€0.50      |
| Lid open sensor    | Better consumption tracking  | +€1         |
| Motion sensor      | Power-saving LED activation  | +€2         |
| Speaker            | Audio feedback on refill     | +€2         |
| Mobile app         | Customer self-service        | Dev cost    |
| Stackable design   | Multiple boxes, shared power | Redesign    |

---

## Manufacturing Plan

### Phase 1: Prototype (Units 1-5)
**Timeline: 2-3 weeks**

- Buy 5× OXO Steel POP containers
- 3D print tech base for fit testing
- Hand-assemble electronics on perfboard
- Validate: load cell accuracy, cellular connectivity, battery life
- Deploy with friendly beta clients

**Cost per unit:** ~€180 (low volume, hand assembly)

### Phase 2: Pilot (Units 6-25)
**Timeline: 4-6 weeks**

- Order 25× OXO containers
- CNC machine oak tech bases (local woodworker)
- Custom PCB design and small batch order
- Refined firmware with OTA updates
- Real-world deployment and feedback

**Cost per unit:** ~€150

### Phase 3: Production V1 (Units 25-100)
**Timeline: Ongoing**

- Establish OXO supply chain (or identify OEM alternative)
- Small batch PCB production
- Standardized tech base production
- Quality control process
- Target: 10-20 units/month capacity

**Cost per unit:** ~€135-145

### Phase 4: Production V2 with Vacuum (Units 100+)
**Timeline: After V1 validated**

- Add vacuum pump system
- Modified lid design (custom or OEM)
- Tube routing integration
- Extended testing for reliability
- Premium positioning justified

**Cost per unit:** ~€165-175

### Phase 5: Scale (Units 500+)
**Timeline: Year 2+**

- Full custom enclosure (if volume justifies tooling)
- Contract manufacturing partnership
- Injection molded components
- Target BOM reduction to €100-120

---

## Risk Mitigation

| Risk                | Impact               | Mitigation                                 |
| ------------------- | -------------------- | ------------------------------------------ |
| Load cell drift     | Inaccurate readings  | Auto-tare on empty + refill detection      |
| Cellular dead spots | No data transmission | Local storage, batch send when connected   |
| Battery issues      | Safety, lifespan     | Quality cells, proper BMS, temp monitoring |
| Firmware bugs       | Devices stuck        | OTA update capability                      |
| Liquid damage       | Electronics fail     | Conformal coating, drainage design         |
| Coffee outgassing   | Pressure buildup     | One-way CO2 valve                          |

---

## Success Metrics

| Metric                | Target                        |
| --------------------- | ----------------------------- |
| Reading reliability   | >99% successful transmissions |
| Battery life          | >6 months per charge          |
| Weight accuracy       | ±20g                          |
| Auto-order accuracy   | >95% ship before empty        |
| Device failure rate   | <2% annually                  |
| Customer satisfaction | >90% would recommend          |

---

## Data Strategy & Long-Term Value

### The Data Asset

Every SmartBox continuously collects valuable consumption data:

```
Per Reading (2x daily):
├── Weight (grams)
├── Timestamp
├── Battery level
├── Temperature (optional sensor)
└── Lid opens (optional sensor)

Derived Analytics:
├── Daily/weekly consumption patterns
├── Day-of-week distribution
├── Seasonal trends
├── Per-employee consumption
├── Refill frequency
└── Consumption predictions
```

### Data Value Streams

| Stream                      | Timeline     | Revenue Potential | Description                                    |
| --------------------------- | ------------ | ----------------- | ---------------------------------------------- |
| **Customer Dashboards**     | Launch       | Retention value   | Consumption trends, predictions, benchmarks    |
| **Premium Analytics**       | 6-12 months  | €5-10K/year       | Multi-location comparison, API access, exports |
| **Aggregate Data Products** | 12-24 months | €15-40K/year      | "Munich Office Coffee Index", industry reports |
| **Platform Partnerships**   | 24+ months   | €50-150K/year     | API licensing to HR/facilities platforms       |
| **Economic Indicator**      | 36+ months   | PR + €10-30K/year | Quoted metric in business media                |

### Who Would Buy This Data?

| Buyer Type                    | Interest                    | Use Case             |
| ----------------------------- | --------------------------- | -------------------- |
| Commercial real estate        | Office amenity planning     | Tenant satisfaction  |
| Co-working operators          | Service optimization        | Cost management      |
| HR platforms (Personio, etc.) | Employee engagement metrics | Platform integration |
| Facilities management         | Consumption tracking        | Automated ordering   |
| Economic researchers          | Office occupancy indicator  | Market analysis      |
| Coffee industry               | Demand forecasting          | Supply planning      |

### Data Privacy Principles

1. **Individual company data never shared** — only anonymized aggregates
2. **Opt-in for aggregate inclusion** — customers choose participation
3. **No employee-level tracking** — box-level data only
4. **Transparent data use** — clearly disclosed in contracts
5. **GDPR compliant** — no personal data collected
6. **Data deletion on request** — if customer leaves

### The Network Effect Moat

```
More SmartBoxes → More data → Better benchmarks → 
More valuable insights → Higher retention → More SmartBoxes
```

At 100+ SmartBoxes, Marie Lou will have a **unique dataset** no competitor can replicate. This creates:
- **Competitive moat** — 2+ years of data cannot be copied
- **Higher valuation** — Data-rich businesses command 5-10x multiples vs 2-4x for pure subscription
- **Partnership leverage** — Attractive to larger players for acquisition or partnership
- **Thought leadership** — Authority on Munich office coffee trends

### Implementation Phases

| Phase                 | Timeline    | Focus                                         | Investment |
| --------------------- | ----------- | --------------------------------------------- | ---------- |
| Foundation            | Now         | Time-series database, basic dashboards        | Included   |
| Customer Analytics    | Month 6-12  | Premium tier, benchmarks                      | €2-5K      |
| Aggregate Products    | Month 12-24 | Munich Office Coffee Index, first data buyers | €10-20K    |
| Platform Partnerships | Month 24+   | API licensing, integrations                   | €25-50K    |

**The coffee pays the bills. The data builds the moat.**

---

## Launch Strategy: Validation-First Approach

### The Plan

Build the complete B2B system production-ready, but launch with a **waitlist landing page** first to validate demand before manufacturing SmartBoxes.

```
PHASE 1: Build Everything (Production-Ready)
├── Complete B2B backend (companies, billing, SmartBox tracking)
├── B2B portal (onboarding, dashboard, analytics)
├── Admin panel (operations, shipments, roasting queue)
├── SmartBox firmware & API
├── Email automation
└── All features fully functional

PHASE 2: Launch Waitlist Landing Page
├── Beautiful B2B landing page explaining SmartBox
├── Lead capture form:
│   ├── Company name
│   ├── Contact name & email
│   ├── Team size
│   ├── Current coffee solution
│   ├── Interest level (Flex vs Smart tier)
│   └── Preferred start date
├── Link from main site to landing page
└── Track signups & engagement

PHASE 3: Validate Demand
├── Target: 20+ qualified signups
├── Measure: Team sizes, tier interest
├── Outreach: Follow up with leads
└── Decision point: Proceed or iterate

PHASE 4: Go Live
├── Build first batch of SmartBoxes
├── Switch landing page link → production B2B signup
├── Onboard first customers
└── Scale based on demand
```

### Why This Approach?

| Benefit                | Explanation                                |
| ---------------------- | ------------------------------------------ |
| **Zero hardware risk** | Don't build SmartBoxes until demand proven |
| **Market validation**  | Real signup data vs assumptions            |
| **Lead pipeline**      | Warm leads ready when you launch           |
| **Iterate messaging**  | Test value propositions before commit      |
| **Capital efficient**  | Delay hardware spend until validated       |

### Landing Page Requirements

**Must capture:**
- Company name
- Contact name & email
- Team size (dropdown: 5-10, 10-20, 20-35, 35-50, 50+)
- Current coffee solution (dropdown: None, Supermarket, Local roaster, Big supplier, Other)
- Interest in tier (Flex vs Smart)
- Optional: When they'd want to start

**Must communicate:**
- SmartBox value proposition (never run out)
- Premium quality & ethical sourcing story
- Transparency dashboard preview
- Pricing indication
- "Join waitlist" CTA

**Design:**
- Premium, clean aesthetic matching Marie Lou brand
- Hero section with SmartBox visualization
- Feature highlights
- Social proof (if available)
- Clear form with minimal friction

### Success Metrics for Validation

| Metric              | Target          | Action if Met                  |
| ------------------- | --------------- | ------------------------------ |
| Waitlist signups    | 20+ companies   | Proceed to manufacturing       |
| Smart tier interest | 50%+ of signups | Prioritize SmartBox production |
| Average team size   | 15+ employees   | Confirms pricing viability     |
| Follow-up response  | 30%+ reply rate | Warm pipeline confirmed        |

### Implementation Note for Coding Agent

The entire B2B system should be built production-ready:

1. **Complete all B2B features** — Companies, billing, SmartBox tracking, admin panel, emails
2. **Test thoroughly** — All flows working end-to-end
3. **Final step: Create landing page** — Waitlist capture instead of direct signup
4. **Easy switchover** — When validated, change one link to go live

The codebase should be ready to ship immediately once demand is validated. The landing page is just the initial entry point that will be swapped for the real signup flow.

---

## Summary

The SmartBox transforms office coffee from a logistics headache into a seamless, premium experience. By combining a premium off-the-shelf container (OXO Steel POP) with a custom-designed tech base, we achieve beautiful aesthetics and rapid time-to-market without complex manufacturing.

**V1 Core Value Proposition:**
- For office managers: "Never think about coffee again"
- For employees: "Always fresh, always available"
- For Marie Lou: "Predictable revenue, automatic operations, D2C lead generation"

**V2 Enhancement (Vacuum):**
- Automatic vacuum sealing on lid close
- Extended freshness for beans
- Additional premium differentiation
- "The only smart coffee box that vacuum-seals itself"

### Product Lineup Summary

| Model      | Capacity | Target          | BOM (V1) | BOM (V2) |
| ---------- | -------- | --------------- | -------- | -------- |
| SmartBox S | 1.4 kg   | 5-12 employees  | €135     | €161     |
| SmartBox M | 1.9 kg   | 10-18 employees | €142     | €168     |
| SmartBox L | 3.3 kg   | 18-30 employees | €173     | €199     |

### Key Advantages of This Approach

1. **Fast to market** — No custom enclosure tooling needed
2. **Premium aesthetics** — OXO is already beautiful
3. **Proven reliability** — Container is battle-tested
4. **Easy iteration** — Tech base can evolve independently
5. **Replaceable parts** — Container can be swapped if damaged
6. **Scalable** — Can transition to custom enclosure at volume

---

*Document Version: 2.0*
*Last Updated: January 2026*