# Marie Lou Referral Program — Design Document

## Program Name Options

| Name                  | German            | Vibe                                             |
| --------------------- | ----------------- | ------------------------------------------------ |
| **Marie Lou's Table** | Marie Lous Tisch  | Ties to grandma's kitchen table, inviting others |
| **Share the Love**    | Teile die Liebe   | Warm, matches brand                              |
| **Spread the Warmth** | Wärme weitergeben | Coffee + emotional warmth                        |
| **Coffee Friends**    | Kaffeefreunde     | Simple, friendly                                 |

**Recommendation:** "Marie Lou's Table" — it directly connects to the story. Just like grandma always invited someone new to her table, you're inviting friends to join yours.

---

## Program Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                        MARIE LOU'S TABLE                                    │
│                     Referral Program Flow                                   │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   EXISTING CUSTOMER                         NEW FRIEND                      │
│   ─────────────────                         ──────────                      │
│                                                                             │
│   Has account + at least                    Receives referral               │
│   one completed order                       link from friend                │
│          │                                        │                         │
│          │  Shares unique                         │                         │
│          │  referral link ──────────────────────▶ │                         │
│          │                                        │                         │
│          │                                        ▼                         │
│          │                                  Signs up using                  │
│          │                                  referral link                   │
│          │                                        │                         │
│          │                                        ▼                         │
│          │                                  Places first order              │
│          │                                  (min. €25 before shipping)      │
│          │                                        │                         │
│          │                                        ▼                         │
│          │                                  Friend gets:                    │
│          │                                  10% off first order             │
│          │                                        │                         │
│          │         Order confirmed                │                         │
│          │         & paid                         │                         │
│          │◀────────────────────────────────────────                         │
│          │                                                                  │
│          ▼                                                                  │
│   Referrer gets:                                                            │
│   FREE random bag                                                           │
│   of coffee!                                                                │
│   (added to next order                                                      │
│   or ships for €4.95)                                                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Program Rules

### For the Referrer (Existing Customer)

| Rule                | Detail                                            |
| ------------------- | ------------------------------------------------- |
| **Eligibility**     | Must have account + at least 1 completed order    |
| **Reward**          | 1 free random bag of coffee (250g)                |
| **When earned**     | After referred friend's first order is paid       |
| **Reward delivery** | Added to next order OR ships separately for €4.95 |
| **Limit**           | No cap (but monitored for abuse)                  |
| **Expiry**          | Rewards don't expire                              |
| **Stackable**       | Yes — refer 5 friends, get 5 free bags            |

### For the Referred Friend (New Customer)

| Rule              | Detail                                     |
| ----------------- | ------------------------------------------ |
| **Eligibility**   | Must be new customer (email not in system) |
| **Reward**        | 10% off first order                        |
| **Minimum order** | €25 before shipping                        |
| **Link expiry**   | 90 days from creation                      |
| **Combinable**    | Not combinable with other discounts        |

### Anti-Abuse Rules

| Risk          | Prevention                                                                                                           |
| ------------- | -------------------------------------------------------------------------------------------------------------------- |
| Self-referral | Referrer and referred cannot have same email domain (for work emails), same shipping address, or same payment method |
| Fake accounts | Referred friend must complete a real order with valid payment                                                        |
| Churning      | One referral reward per unique email address, ever                                                                   |
| Mass abuse    | Flag accounts with >20 referrals/month for manual review                                                             |
| Refund gaming | If referred friend refunds within 30 days, reward is revoked                                                         |

---

## Technical Implementation

### Database Schema Addition

```typescript
// Add to src/db/schema.ts

// Referral codes
export const referralCodes = sqliteTable('referral_codes', {
  id: text('id').primaryKey(),
  customerId: text('customer_id').references(() => customers.id),
  code: text('code').notNull().unique(),        // MARIE-XXXXX (5 chars)
  
  // Stats
  timesUsed: integer('times_used').default(0),
  totalRewardsEarned: integer('total_rewards_earned').default(0),
  
  createdAt: integer('created_at', { mode: 'timestamp' }),
  active: integer('active', { mode: 'boolean' }).default(true),
});

// Referral tracking
export const referrals = sqliteTable('referrals', {
  id: text('id').primaryKey(),
  referrerCodeId: text('referrer_code_id').references(() => referralCodes.id),
  referrerId: text('referrer_id').references(() => customers.id),
  referredId: text('referred_id').references(() => customers.id),
  referredEmail: text('referred_email').notNull(),
  
  // Status workflow
  status: text('status').notNull(),  // 'pending' | 'qualified' | 'rewarded' | 'revoked'
  
  // The qualifying order
  qualifyingOrderId: text('qualifying_order_id').references(() => orders.id),
  
  // Reward tracking
  rewardId: text('reward_id').references(() => referralRewards.id),
  
  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' }),
  qualifiedAt: integer('qualified_at', { mode: 'timestamp' }),
  rewardedAt: integer('rewarded_at', { mode: 'timestamp' }),
  revokedAt: integer('revoked_at', { mode: 'timestamp' }),
  revokeReason: text('revoke_reason'),
});

// Referral rewards (the free bags)
export const referralRewards = sqliteTable('referral_rewards', {
  id: text('id').primaryKey(),
  customerId: text('customer_id').references(() => customers.id),
  referralId: text('referral_id').references(() => referrals.id),
  
  // The reward
  productId: text('product_id').notNull(),       // Which coffee they'll get
  productName: text('product_name').notNull(),   // Snapshot
  
  // Status
  status: text('status').notNull(),  // 'pending' | 'claimed' | 'shipped' | 'expired'
  
  // How it was redeemed
  claimedOrderId: text('claimed_order_id').references(() => orders.id),
  shippedSeparately: integer('shipped_separately', { mode: 'boolean' }).default(false),
  
  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' }),
  claimedAt: integer('claimed_at', { mode: 'timestamp' }),
  expiresAt: integer('expires_at', { mode: 'timestamp' }),  // Optional: if you want expiry
});

// Referral stats (for analytics)
export const REFERRAL_STATUS = {
  pending: 'Pending',           // Friend signed up but hasn't ordered
  qualified: 'Qualified',       // Friend placed qualifying order
  rewarded: 'Rewarded',         // Referrer received free bag
  revoked: 'Revoked',           // Cancelled due to refund/abuse
} as const;
```

### Referral Code Generation

```typescript
// src/lib/referral.ts

// Generate unique, memorable referral codes
export function generateReferralCode(customerName: string): string {
  // Format: MARIE-XXXXX
  // Use a mix of letters (no ambiguous ones like 0/O, 1/I/L)
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return `MARIE-${code}`;
}

// Referral link format
export function getReferralLink(code: string, brand: 'coffee' | 'tea'): string {
  const domain = brand === 'coffee' ? 'marieloucoffee.com' : 'marieloutea.com';
  return `https://${domain}/ref/${code}`;
}
```

### API Endpoints

```typescript
// src/app/api/referral/route.ts

// GET: Get current user's referral code + stats
// POST: Generate referral code for user (if they don't have one)

// src/app/api/referral/validate/route.ts
// GET: Validate a referral code (for signup page)

// src/app/api/referral/apply/route.ts
// POST: Apply referral code during checkout

// src/app/api/referral/rewards/route.ts
// GET: List user's pending rewards
// POST: Claim reward (add to cart or ship separately)
```

### Random Bag Selection Logic

```typescript
// src/lib/referral.ts

export async function selectRandomRewardBag(brand: 'coffee' | 'tea'): Promise<Product> {
  const products = await db.query.products.findMany({
    where: and(
      eq(products.brand, brand),
      eq(products.active, true),
      gt(products.stockQuantity, 10)  // Only if well-stocked
    ),
  });
  
  // Weighted random: slightly favor slower-moving products
  // This helps clear inventory while still feeling random
  const weights = products.map(p => {
    const baseWeight = 1;
    // Boost weight for products with higher stock (helps move inventory)
    const stockBoost = p.stockQuantity > 50 ? 1.5 : 1;
    return baseWeight * stockBoost;
  });
  
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;
  
  for (let i = 0; i < products.length; i++) {
    random -= weights[i];
    if (random <= 0) return products[i];
  }
  
  return products[0]; // Fallback
}
```

---

## User Interface

### 1. Account Page — Referral Section

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  🎁 MARIE LOU'S TABLE                                                       │
│  ═══════════════════                                                        │
│                                                                             │
│  Invite friends to the table. When they order, you get a free bag!          │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                                                                       │  │
│  │  Your referral link:                                                  │  │
│  │  ┌─────────────────────────────────────────────┐  ┌────────────────┐  │  │
│  │  │ marieloucoffee.com/ref/MARIE-HK7M2         │  │  📋 Copy Link  │  │  │
│  │  └─────────────────────────────────────────────┘  └────────────────┘  │  │
│  │                                                                       │  │
│  │  Or share directly:  [WhatsApp] [Email] [Twitter] [Copy]             │  │
│  │                                                                       │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  📊 Your Referral Stats                                                     │
│                                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                          │
│  │  Friends    │  │  Pending    │  │  Free Bags  │                          │
│  │  Referred   │  │  Signups    │  │  Earned     │                          │
│  │      7      │  │      2      │  │      5      │                          │
│  └─────────────┘  └─────────────┘  └─────────────┘                          │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  🎉 Your Rewards                                                            │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  🎁 FREE: Colombia Huila (250g)                                       │  │
│  │     Earned from referring Sarah M.                                    │  │
│  │     [Add to Next Order]  [Ship Now (€4.95)]                          │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  🎁 FREE: Ethiopia Yirgacheffe (250g)                                 │  │
│  │     Earned from referring Thomas K.                                   │  │
│  │     [Add to Next Order]  [Ship Now (€4.95)]                          │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2. Referral Landing Page (/ref/[code])

When someone clicks a referral link:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                           [Marie Lou Logo]                                  │
│                                                                             │
│                    Your friend thinks you'll love this.                     │
│                                                                             │
│  ═══════════════════════════════════════════════════════════════════════    │
│                                                                             │
│                        Welcome to Marie Lou Coffee                          │
│                                                                             │
│             Fresh-roasted coffee that pays farmers fairly.                  │
│                    No middlemen. Full transparency.                         │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│                   🎁 You've been invited to the table!                      │
│                                                                             │
│                        Get 10% off your first order                         │
│                                                                             │
│                         [Shop Now with 10% Off]                             │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│                        "Coffee the way it should be.                        │
│                      Fresh, honest, made with love."                        │
│                                                                             │
│                           [Read Our Story →]                                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3. Checkout — Referral Discount Applied

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  Order Summary                                                              │
│  ─────────────                                                              │
│                                                                             │
│  Ethiopia Yirgacheffe (250g, Whole Bean)          €14.90                    │
│  Colombia Huila (250g, Filter)                    €13.50                    │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│  Subtotal                                         €28.40                    │
│  🎁 Referral Discount (10%)                       -€2.84                    │
│  Shipping (Standard DE)                            €4.95                    │
│  ─────────────────────────────────────────────────────────────────────────  │
│  Total                                            €30.51                    │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ 🎉 Referral discount applied! Your friend will receive a free bag    │  │
│  │    of coffee when your order is confirmed.                           │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4. Email — Reward Notification

When someone's referral converts:

```
Subject: 🎁 Sarah ordered — your free coffee is waiting!

─────────────────────────────────────────────────────────

Hey Marcel,

Great news! Your friend Sarah just placed their first order.

As a thank you for spreading the word, you've earned:

    🎁 FREE: Brazil Santos (250g)
    
    This one's on us. Add it to your next order, or we'll 
    ship it separately for just €4.95.

    [Claim Your Free Coffee →]

─────────────────────────────────────────────────────────

You've now referred 5 friends to Marie Lou's table. 
That's 5 farmers earning fair wages, 5 people enjoying 
fresh coffee, and 5 free bags for you.

Oma would be proud. ☕

— Marcel

─────────────────────────────────────────────────────────
```

---

## Admin Dashboard — Referral Section

### Referral Analytics

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  🎁 Referral Program                                    [This Month ▼]      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐             │
│  │ Referrals  │  │ Converted  │  │ Conversion │  │ Rewards    │             │
│  │ Created    │  │            │  │ Rate       │  │ Given      │             │
│  │    127     │  │     43     │  │   33.8%    │  │    43      │             │
│  │            │  │            │  │            │  │  (~€215)   │             │
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘             │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  Top Referrers                                                              │
│  ─────────────                                                              │
│  1. thomas.k@example.com         12 referrals    12 free bags               │
│  2. sarah.m@example.com           8 referrals     8 free bags               │
│  3. emma.l@example.com            6 referrals     6 free bags               │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  ⚠️ Flagged for Review (unusual activity)                                   │
│  ─────────────────────────────────────────                                  │
│  • suspicious@example.com — 25 referrals this week (avg is 2)               │
│    [Review] [Block]                                                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Website Content — Referral Program Page

### English

```markdown
# Marie Lou's Table

## Pull Up a Chair for a Friend

My grandmother Marie Lou never drank her coffee alone. Her kitchen table 
was always set for one more — a neighbor, a friend, sometimes someone 
she'd just met. Everyone was welcome.

That's what this referral program is about. When you invite someone to 
try Marie Lou Coffee, you're not just sharing a product — you're inviting 
them to a table where quality matters, farmers are treated fairly, and 
every cup is made with love.

---

## How It Works

**1. Share Your Link**
Every Marie Lou customer gets a unique referral link. Share it with 
friends, family, colleagues — anyone who deserves better coffee.

**2. They Get 10% Off**
When your friend uses your link, they'll get 10% off their first order. 
A warm welcome to the table.

**3. You Get a Free Bag**
Once their order is confirmed, we'll send you a free bag of coffee — 
picked randomly from our current selection. A thank-you from us.

---

## The Details

**For You (the referrer):**
- Get 1 free bag (250g) for each friend who orders
- No limit — refer 10 friends, get 10 bags
- Choose to add it to your next order or ship separately (€4.95)
- Your reward never expires

**For Your Friend:**
- 10% off their first order
- Minimum order: €25 (before shipping)
- Valid for 90 days

---

## Why a Random Bag?

We could let you choose, but where's the fun in that?

The random bag is a little gift, a surprise, a chance to try something 
you might not have picked yourself. Maybe you'll discover your new 
favorite. Maybe it'll be an old friend.

Either way, it's our way of saying thank you for spreading the word.

---

## Get Your Referral Link

[Log in to your account to get your unique referral link →]

Not a customer yet? [Shop now →] and you'll get your link after 
your first order.

---

*There's always room at Marie Lou's table.*
```

### German

```markdown
# Marie Lous Tisch

## Hol einen Freund an den Tisch

Meine Großmutter Marie Lou trank ihren Kaffee nie allein. Ihr Küchentisch 
war immer für einen mehr gedeckt — eine Nachbarin, eine Freundin, manchmal 
jemand, den sie gerade erst kennengelernt hatte. Jeder war willkommen.

Darum geht es bei diesem Empfehlungsprogramm. Wenn du jemanden einlädst, 
Marie Lou Coffee zu probieren, teilst du nicht nur ein Produkt — du lädst 
sie an einen Tisch ein, an dem Qualität zählt, Bauern fair behandelt werden 
und jede Tasse mit Liebe gemacht wird.

---

## So funktioniert's

**1. Teile deinen Link**
Jeder Marie Lou Kunde bekommt einen einzigartigen Empfehlungslink. Teile 
ihn mit Freunden, Familie, Kollegen — allen, die besseren Kaffee verdienen.

**2. Sie bekommen 10% Rabatt**
Wenn dein Freund deinen Link nutzt, bekommt er 10% Rabatt auf seine erste 
Bestellung. Ein herzliches Willkommen am Tisch.

**3. Du bekommst eine Gratistüte**
Sobald die Bestellung bestätigt ist, schicken wir dir eine kostenlose 
Tüte Kaffee — zufällig aus unserem aktuellen Sortiment ausgewählt. 
Ein Dankeschön von uns.

---

## Die Details

**Für dich (Empfehler):**
- 1 Gratistüte (250g) für jeden Freund, der bestellt
- Kein Limit — 10 Freunde empfehlen, 10 Tüten bekommen
- Zu deiner nächsten Bestellung hinzufügen oder separat versenden (€4,95)
- Deine Belohnung läuft nie ab

**Für deinen Freund:**
- 10% Rabatt auf die erste Bestellung
- Mindestbestellwert: €25 (vor Versand)
- 90 Tage gültig

---

## Warum eine zufällige Tüte?

Wir könnten dich wählen lassen, aber wo bleibt da der Spaß?

Die zufällige Tüte ist ein kleines Geschenk, eine Überraschung, eine 
Chance, etwas zu probieren, das du vielleicht nicht selbst ausgesucht 
hättest. Vielleicht entdeckst du deinen neuen Lieblingskaffee. Vielleicht 
ist es ein alter Bekannter.

So oder so ist es unsere Art, Danke zu sagen, dass du uns weiterempfiehlst.

---

## Hol dir deinen Empfehlungslink

[Melde dich in deinem Konto an, um deinen persönlichen Link zu bekommen →]

Noch kein Kunde? [Jetzt einkaufen →] und du bekommst deinen Link nach 
deiner ersten Bestellung.

---

*Am Tisch von Marie Lou ist immer Platz.*
```

---

## Implementation Phases

### Add to Phase 8 (Subscriptions) or Create Phase 8.5

```
### Phase 8.5: Referral Program (Week 9-10)

- [ ] Add referral tables to database schema
- [ ] Create referral code generation system
- [ ] Build /ref/[code] landing page
- [ ] Implement referral tracking during signup
- [ ] Add referral discount at checkout
- [ ] Create reward fulfillment system
- [ ] Build account page referral section
- [ ] Create referral notification emails
- [ ] Build admin referral analytics
- [ ] Implement anti-abuse detection
- [ ] Add referral program page (/referral)
- [ ] Create share widgets (WhatsApp, email, copy link)
```

---

## Economics Summary

| Metric                        | Value                                        |
| ----------------------------- | -------------------------------------------- |
| Cost per free bag             | ~€5-6 (green beans + roasting + packaging)   |
| Typical CAC (other companies) | €15-30                                       |
| Your effective CAC            | €5-6 (only paid on conversion)               |
| + You get:                    | Brand ambassadors who believe in the mission |

### Break-Even Analysis

If average customer orders 3x per year at €40 average order value:
- Customer lifetime value (year 1): ~€120
- Cost to acquire (1 free bag): ~€5-6
- **ROI: 20x in year 1 alone**

Even if only 50% of referred customers reorder:
- Still 10x ROI
- Plus they might refer others too

---

## Final Thoughts

This referral program:

✅ **Fits the brand story** — Grandma's table, always room for one more
✅ **Zero upfront cost** — Only "pay" when you get a new paying customer  
✅ **Creates community** — Customers become ambassadors
✅ **Surprise & delight** — Random bag adds joy
✅ **Sustainable** — Economics work at any scale
✅ **Simple** — Easy to understand, easy to use

The name "Marie Lou's Table" ties it all together beautifully. It's not a corporate referral program — it's an invitation to join something meaningful.

---

*Add this document to the coding agent package alongside the other files.*