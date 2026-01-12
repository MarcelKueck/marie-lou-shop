# Marie Lou SmartBox — Product Specification

## Overview

The SmartBox is a premium, sensor-equipped coffee/tea storage container that automatically monitors inventory levels and triggers replenishment orders. It's the core hardware differentiator for the Marie Lou B2B Smart tier.

**Mission:** Never let an office run out of great coffee — while looking beautiful doing it.

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

## Design: "The Monolith"

A minimalist metal + wood design that fits any office aesthetic.

```
┌─────────────────────────┐
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │  ← Matte black powder-coated aluminum
│  ▓                   ▓  │
│  ▓   MARIE LOU       ▓  │  ← Laser-etched logo (backlit warm LED)
│  ▓   ─────────       ▓  │
│  ▓   ▓▓▓▓▓▓▓▓        ▓  │  ← Vertical LED fill indicator (amber)
│  ▓   ▓▓▓▓▓▓▓▓        ▓  │    (shows current fill level)
│  ▓   ▓▓▓▓░░░░        ▓  │
│  ▓   ▓▓░░░░░░        ▓  │
│  ▓                   ▓  │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
├─────────────────────────┤
│      Oak wood base      │  ← FSC-certified oak, houses electronics
│  [●] [QR] [USB-C]       │  ← Power LED, brass QR plate, charging
└─────────────────────────┘
```

### Materials

| Component      | Material                                   | Notes                                 |
| -------------- | ------------------------------------------ | ------------------------------------- |
| Body           | Recycled aluminum                          | Powder-coated matte black or white    |
| Interior liner | Food-grade stainless steel                 | Easy to clean, no flavor transfer     |
| Lid            | Aluminum + silicone gasket                 | Soft-close mechanism                  |
| CO2 valve      | One-way valve                              | For freshly roasted beans off-gassing |
| Base           | FSC-certified oak or walnut                | Houses all electronics                |
| QR plate       | Brass                                      | Laser-etched, premium feel            |
| Finish options | Matte black, matte white, natural aluminum | Client choice                         |

### Color Options

| Option         | Body                     | Base        | Target Aesthetic      |
| -------------- | ------------------------ | ----------- | --------------------- |
| **Obsidian**   | Matte black              | Dark walnut | Modern, tech-forward  |
| **Alpine**     | Matte white              | Light oak   | Scandinavian, clean   |
| **Industrial** | Natural brushed aluminum | Oak         | Loft, creative spaces |

---

## Sizes & Dimensions

| Size  | Capacity | Target Office   | Dimensions (W×D×H) | Refill Frequency     |
| ----- | -------- | --------------- | ------------------ | -------------------- |
| **S** | 1 kg     | 5-10 employees  | 12 × 12 × 20 cm    | Weekly               |
| **M** | 2 kg     | 10-25 employees | 14 × 14 × 25 cm    | Bi-weekly            |
| **L** | 3 kg     | 25-50 employees | 16 × 16 × 30 cm    | Bi-weekly to monthly |

### Form Factor Priorities

- ✅ Fits next to standard coffee machine
- ✅ Fits inside standard cabinet (< 35cm height)
- ✅ Stable (low center of gravity in wood base)
- ✅ Easy to open one-handed
- ✅ Doesn't block power outlets
- ❌ Not wider than 20cm
- ❌ Not taller than 35cm

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

| Size    | Electronics | Enclosure | Assembly | **Total BOM** |
| ------- | ----------- | --------- | -------- | ------------- |
| S (1kg) | €52         | €68       | €10      | **€130**      |
| M (2kg) | €52         | €73       | €10      | **€135**      |
| L (3kg) | €52         | €80       | €12      | **€144**      |

*At 100+ units, costs reduce 20-30% through bulk purchasing.*

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

| Feature            | Purpose                      | Cost Impact        |
| ------------------ | ---------------------------- | ------------------ |
| NFC chip           | Tap-to-open promo page       | +€1                |
| Temperature sensor | Quality assurance alerts     | +€0.50             |
| Lid open sensor    | Better consumption tracking  | +€1                |
| Motion sensor      | Power-saving LED activation  | +€2                |
| Speaker            | Audio feedback on refill     | +€2                |
| Mobile app         | Customer self-service        | Development cost   |
| Stackable design   | Multiple boxes, shared power | Enclosure redesign |

---

## Manufacturing Plan

### Phase 1: Prototype (Units 1-5)
- Hand-assembled
- 3D printed enclosure for testing
- Validate electronics, firmware, connectivity
- Beta test with friendly clients

### Phase 2: Pilot (Units 6-20)
- CNC machined aluminum bodies
- Refined PCB design
- Real-world deployment
- Iterate based on feedback

### Phase 3: Production (Units 21-100)
- Small batch manufacturing
- Negotiate component bulk pricing
- Establish assembly process
- Target BOM reduction of 20%

### Phase 4: Scale (100+ Units)
- Contract manufacturing
- Injection molded components where possible
- Target BOM reduction of 30%

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

## Summary

The SmartBox transforms office coffee from a logistics headache into a seamless, premium experience. By combining beautiful industrial design with invisible IoT technology, it creates genuine value for office managers while establishing Marie Lou's brand presence in every client kitchen.

**Core Value Proposition:**
- For office managers: "Never think about coffee again"
- For employees: "Always fresh, always available"
- For Marie Lou: "Predictable revenue, automatic operations, D2C lead generation"

---

*Document Version: 1.0*
*Last Updated: January 2026*