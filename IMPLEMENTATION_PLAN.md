# Marie Lou Online Shop — Final Implementation Plan

## Overview

Transform the existing static HTML site into a production-ready, multi-brand online shop serving both **marieloucoffee.com** and **marieloutea.com** from a single, maintainable codebase with full German/English language support, automated workflows, and an admin dashboard optimized for a one-person business.

---

## 1. Architecture Decision

### Approach: Single App, Configuration-Driven Multi-Tenant + Admin Dashboard

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Single Codebase                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │   Shared    │  │   Brand     │  │   i18n       │  │   Admin          │   │
│  │ Components  │  │   Configs   │  │   (DE/EN)    │  │   Dashboard      │   │
│  └─────────────┘  └─────────────┘  └──────────────┘  └──────────────────┘   │
├─────────────────────────────────────────────────────────────────────────────┤
│              ▼                    ▼                        ▼                │
│  ┌─────────────────┐  ┌─────────────────┐  ┌────────────────────────────┐   │
│  │ marieloucoffee  │  │  marieloutea    │  │  admin.marielou.de         │   │
│  │     .com        │  │     .com        │  │  (Password Protected)      │   │
│  └─────────────────┘  └─────────────────┘  └────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
             ┌──────────┐    ┌──────────┐    ┌──────────────┐
             │  Stripe  │    │ Rechnungs│    │   Resend     │
             │ Payments │    │   API    │    │   Emails     │
             └──────────┘    └──────────┘    └──────────────┘
```

**Why this approach:**
- Minimal code duplication
- Single deployment pipeline (with different env vars per domain)
- Easy to maintain — fix a bug once, both sites benefit
- Admin dashboard gives you full control without external tools
- Automation reduces manual work to: roast → pack → ship

---

## 2. Technology Stack

| Layer            | Technology                  | Rationale                                              |
| ---------------- | --------------------------- | ------------------------------------------------------ |
| **Framework**    | Next.js 16 (App Router)     | Latest features, RSC, excellent i18n                   |
| **Styling**      | CSS Modules + CSS Variables | Preserves your existing styles, easy theming           |
| **Language**     | TypeScript                  | Type safety, better DX                                 |
| **i18n**         | next-intl                   | Clean, well-maintained, works with App Router          |
| **Database**     | SQLite + Drizzle ORM        | Simple, file-based, no external DB needed, easy backup |
| **Payments**     | Stripe Checkout             | Secure, handles EU compliance (SCA), Klarna/SEPA       |
| **Invoices**     | rechnungs-api.de            | Your custom invoice API with templates                 |
| **Email**        | Resend                      | Simple API, good deliverability, templates             |
| **Hosting**      | Vercel                      | Zero-config Next.js, easy multi-domain                 |
| **Analytics**    | Built-in (custom)           | Simple analytics in admin dashboard                    |
| **Auth (Admin)** | Simple password or Auth.js  | Protect admin routes                                   |

---

## 3. Project Structure

```
marie-lou-shop/
├── public/
│   ├── images/
│   │   ├── coffee/                    # Coffee brand assets
│   │   │   ├── logo.svg
│   │   │   ├── logo-white.svg
│   │   │   └── products/
│   │   └── tea/                       # Tea brand assets
│   │       ├── logo.svg
│   │       ├── logo-white.svg
│   │       └── products/
│   └── fonts/
│
├── src/
│   ├── app/
│   │   ├── [locale]/                  # Public storefront (i18n)
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx               # Homepage
│   │   │   ├── shop/
│   │   │   │   ├── page.tsx           # Product listing
│   │   │   │   └── [slug]/page.tsx    # Product detail
│   │   │   ├── cart/page.tsx
│   │   │   ├── checkout/
│   │   │   │   ├── page.tsx
│   │   │   │   └── success/page.tsx
│   │   │   ├── account/               # Customer accounts
│   │   │   │   ├── page.tsx           # Dashboard
│   │   │   │   ├── orders/page.tsx    # Order history
│   │   │   │   ├── subscriptions/page.tsx
│   │   │   │   └── settings/page.tsx
│   │   │   ├── gift-cards/
│   │   │   │   ├── page.tsx           # Buy gift cards
│   │   │   │   └── redeem/page.tsx    # Redeem gift card
│   │   │   ├── subscribe/page.tsx     # Subscription signup
│   │   │   ├── story/page.tsx
│   │   │   ├── faq/page.tsx
│   │   │   └── legal/
│   │   │       ├── impressum/page.tsx
│   │   │       ├── datenschutz/page.tsx
│   │   │       ├── agb/page.tsx
│   │   │       └── widerruf/page.tsx
│   │   │
│   │   ├── admin/                     # Admin Dashboard
│   │   │   ├── layout.tsx             # Admin layout with sidebar
│   │   │   ├── page.tsx               # Dashboard overview
│   │   │   ├── orders/
│   │   │   │   ├── page.tsx           # All orders
│   │   │   │   └── [id]/page.tsx      # Order detail
│   │   │   ├── products/
│   │   │   │   ├── page.tsx           # Product management
│   │   │   │   ├── new/page.tsx       # Add product
│   │   │   │   └── [id]/page.tsx      # Edit product
│   │   │   ├── customers/page.tsx     # Customer list
│   │   │   ├── subscriptions/page.tsx # Active subscriptions
│   │   │   ├── gift-cards/page.tsx    # Gift card management
│   │   │   ├── reviews/page.tsx       # Review moderation
│   │   │   ├── analytics/page.tsx     # Detailed analytics
│   │   │   └── settings/page.tsx      # Shop settings
│   │   │
│   │   └── api/
│   │       ├── checkout/route.ts
│   │       ├── webhook/
│   │       │   └── stripe/route.ts
│   │       ├── invoice/route.ts       # rechnungs-api.de integration
│   │       ├── newsletter/route.ts
│   │       ├── subscriptions/
│   │       │   ├── route.ts           # Create subscription
│   │       │   └── process/route.ts   # Cron: process due subscriptions
│   │       ├── gift-cards/
│   │       │   ├── route.ts           # Create/validate
│   │       │   └── redeem/route.ts
│   │       ├── reviews/route.ts
│   │       ├── analytics/route.ts     # Log events
│   │       └── admin/
│   │           ├── orders/route.ts
│   │           ├── products/route.ts
│   │           └── export/route.ts    # CSV export
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navigation.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── LanguageSwitcher.tsx
│   │   │   └── CookieBanner.tsx
│   │   ├── home/
│   │   │   ├── Hero.tsx
│   │   │   ├── FreshnessPromise.tsx
│   │   │   ├── Story.tsx
│   │   │   ├── Process.tsx
│   │   │   ├── Testimonials.tsx
│   │   │   └── Newsletter.tsx
│   │   ├── shop/
│   │   │   ├── ProductCard.tsx
│   │   │   ├── ProductGrid.tsx
│   │   │   ├── ProductDetail.tsx
│   │   │   ├── VariantSelector.tsx    # Grind type selector
│   │   │   └── ReviewList.tsx
│   │   ├── cart/
│   │   │   ├── CartProvider.tsx
│   │   │   ├── CartDrawer.tsx
│   │   │   ├── CartItem.tsx
│   │   │   └── CartSummary.tsx
│   │   ├── subscription/
│   │   │   ├── SubscriptionBuilder.tsx
│   │   │   └── SubscriptionCard.tsx
│   │   ├── account/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   └── OrderCard.tsx
│   │   ├── admin/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── StatsCard.tsx
│   │   │   ├── OrdersTable.tsx
│   │   │   ├── OrderTimeline.tsx      # Order status workflow
│   │   │   ├── ProductForm.tsx
│   │   │   ├── AnalyticsChart.tsx
│   │   │   └── QuickActions.tsx
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       ├── Select.tsx
│   │       ├── Badge.tsx
│   │       ├── Modal.tsx
│   │       ├── Toast.tsx
│   │       └── DataTable.tsx
│   │
│   ├── config/
│   │   ├── brands/
│   │   │   ├── index.ts
│   │   │   ├── coffee.ts
│   │   │   └── tea.ts
│   │   ├── products/
│   │   │   ├── types.ts
│   │   │   └── variants.ts            # Grind options, sizes
│   │   ├── shipping.ts                # Shipping zones & rates
│   │   └── site.ts
│   │
│   ├── db/
│   │   ├── schema.ts                  # Drizzle schema
│   │   ├── index.ts                   # DB connection
│   │   └── migrations/
│   │
│   ├── i18n/
│   │   ├── config.ts
│   │   ├── request.ts
│   │   └── messages/
│   │       ├── en/
│   │       └── de/
│   │
│   ├── lib/
│   │   ├── stripe.ts
│   │   ├── invoice.ts                 # rechnungs-api.de client
│   │   ├── email.ts                   # Resend client + templates
│   │   ├── brand.ts
│   │   ├── analytics.ts
│   │   └── utils.ts
│   │
│   ├── hooks/
│   │   ├── useCart.ts
│   │   ├── useBrand.ts
│   │   └── useLocalStorage.ts
│   │
│   └── styles/
│       ├── globals.css
│       ├── admin.css                  # Admin-specific styles
│       └── themes/
│           ├── coffee.css
│           └── tea.css
│
├── data/
│   └── marie-lou.db                   # SQLite database file
│
├── middleware.ts
├── next.config.js
├── drizzle.config.ts
├── .env.local
└── package.json
```

---

## 4. Brand Configuration System

### 4.1 Coffee Brand Config (Existing)

```typescript
// src/config/brands/coffee.ts
export const coffeeBrand: BrandConfig = {
  id: 'coffee',
  name: 'Marie Lou Coffee',
  domain: 'marieloucoffee.com',
  tagline: 'Freshly Roasted, Directly Sourced',
  
  logo: '/images/coffee/logo.svg',
  logoWhite: '/images/coffee/logo-white.svg',
  
  fonts: {
    display: 'Playfair Display',
    body: 'DM Sans',
  },
  
  colors: {
    cream: '#FAF7F2',
    warmWhite: '#FFFDF9',
    primary: '#3D2B1F',           // Dark brown
    primaryMedium: '#5C4033',
    primaryLight: '#8B7355',
    accent: '#C4A77D',
    accentLight: '#E8DCC8',
    text: '#2D2118',
    textMuted: '#6B5D4D',
  },
  
  email: 'hello@marieloucoffee.com',
  social: {
    instagram: 'marieloucoffee',
  },
};
```

### 4.2 Tea Brand Config (New Design)

```typescript
// src/config/brands/tea.ts
export const teaBrand: BrandConfig = {
  id: 'tea',
  name: 'Marie Lou Tea',
  domain: 'marieloutea.com',
  tagline: 'Handpicked, Thoughtfully Blended',
  
  logo: '/images/tea/logo.svg',
  logoWhite: '/images/tea/logo-white.svg',
  
  fonts: {
    display: 'Playfair Display',      // Keep consistent
    body: 'DM Sans',
  },
  
  // Elegant sage green palette - calming, natural, premium
  colors: {
    cream: '#F8FAF7',                  // Soft green-tinted white
    warmWhite: '#FDFFF9',
    primary: '#3A5A40',                // Deep forest green
    primaryMedium: '#588157',          // Sage green
    primaryLight: '#81A784',           // Soft green
    accent: '#A7C4A0',                 // Muted mint
    accentLight: '#DAE5D8',            // Very light sage
    text: '#1E2E22',                   // Dark green-black
    textMuted: '#5C6B5E',              // Muted green-gray
  },
  
  email: 'hello@marieloutea.com',
  social: {
    instagram: 'marieloutea',
  },
};
```

### 4.3 Tea Color Palette Preview

```
┌─────────────────────────────────────────────────────────────┐
│  Marie Lou Tea — Color Palette                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Primary       ████████  #3A5A40  Deep Forest Green         │
│  Primary Med   ████████  #588157  Sage Green                │
│  Primary Light ████████  #81A784  Soft Green                │
│                                                             │
│  Accent        ████████  #A7C4A0  Muted Mint                │
│  Accent Light  ████████  #DAE5D8  Light Sage                │
│                                                             │
│  Cream         ████████  #F8FAF7  Green-tinted White        │
│  Text          ████████  #1E2E22  Dark Green-Black          │
│  Text Muted    ████████  #5C6B5E  Muted Green-Gray          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Product & Variant System

### 5.1 Product Schema

```typescript
// src/config/products/types.ts
export interface Product {
  id: string;
  slug: string;
  brand: 'coffee' | 'tea';
  active: boolean;
  
  // Localized content
  name: { en: string; de: string };
  origin: { en: string; de: string };
  notes: { en: string; de: string };
  description: { en: string; de: string };
  
  // Base pricing (in cents, smallest variant)
  basePrice: number;
  currency: 'EUR';
  
  // Available variants
  variants: ProductVariant[];
  
  // Metadata
  badge?: 'bestseller' | 'new' | 'limited';
  
  // Inventory
  stockQuantity: number;        // Simple stock count
  lowStockThreshold: number;    // Alert when below this
  
  // Images
  image: string;
  images?: string[];
  
  // Type-specific attributes
  attributes: CoffeeAttributes | TeaAttributes;
  
  // Reviews (aggregated)
  averageRating?: number;
  reviewCount?: number;
  
  // Stripe
  stripeProductId?: string;
}

export interface ProductVariant {
  id: string;
  sku: string;
  name: { en: string; de: string };
  priceModifier: number;        // Additional cents (can be 0 or negative)
  stripePriceId?: string;
  weight: string;               // "250g", "500g", etc.
}

export interface CoffeeAttributes {
  type: 'coffee';
  roastLevel: 'light' | 'medium' | 'medium-dark' | 'dark';
  process: 'washed' | 'natural' | 'honey';
  altitude?: string;
  variety?: string;
}

export interface TeaAttributes {
  type: 'tea';
  teaType: 'green' | 'black' | 'oolong' | 'white' | 'herbal' | 'blend';
  caffeine: 'none' | 'low' | 'medium' | 'high';
  steepTime: string;
  temperature: string;
}
```

### 5.2 Variant Configuration

```typescript
// src/config/products/variants.ts

// Coffee grind options
export const coffeeGrindVariants: ProductVariant[] = [
  {
    id: 'whole-bean',
    sku: 'WB',
    name: { en: 'Whole Bean', de: 'Ganze Bohne' },
    priceModifier: 0,
    weight: '250g',
  },
  {
    id: 'filter',
    sku: 'FI',
    name: { en: 'Ground for Filter', de: 'Gemahlen für Filter' },
    priceModifier: 0,
    weight: '250g',
  },
  {
    id: 'espresso',
    sku: 'ES',
    name: { en: 'Ground for Espresso', de: 'Gemahlen für Espresso' },
    priceModifier: 0,
    weight: '250g',
  },
  {
    id: 'french-press',
    sku: 'FP',
    name: { en: 'Ground for French Press', de: 'Gemahlen für French Press' },
    priceModifier: 0,
    weight: '250g',
  },
  {
    id: 'moka',
    sku: 'MK',
    name: { en: 'Ground for Moka Pot', de: 'Gemahlen für Mokka' },
    priceModifier: 0,
    weight: '250g',
  },
];

// Size variants (optional, if you want different sizes)
export const sizeVariants = [
  { id: '250g', name: { en: '250g', de: '250g' }, priceModifier: 0 },
  { id: '500g', name: { en: '500g', de: '500g' }, priceModifier: 850 },  // +€8.50
  { id: '1kg', name: { en: '1kg', de: '1kg' }, priceModifier: 1500 },    // +€15.00
];

// Tea formats
export const teaFormatVariants: ProductVariant[] = [
  {
    id: 'loose-leaf',
    sku: 'LL',
    name: { en: 'Loose Leaf', de: 'Loser Tee' },
    priceModifier: 0,
    weight: '100g',
  },
  {
    id: 'tea-bags',
    sku: 'TB',
    name: { en: 'Tea Bags (15 pcs)', de: 'Teebeutel (15 Stk)' },
    priceModifier: 200,  // +€2.00
    weight: '15 bags',
  },
];
```

### 5.3 Initial Products (3 per brand)

```typescript
// Coffee Products
const coffeeProducts = [
  {
    id: 'ethiopia-yirgacheffe',
    name: { en: 'Yirgacheffe Natural', de: 'Yirgacheffe Natural' },
    origin: { en: 'Ethiopia', de: 'Äthiopien' },
    notes: { en: 'Blueberry, jasmine, honey sweetness', de: 'Blaubeere, Jasmin, Honigsüße' },
    basePrice: 1490,
    badge: 'bestseller',
    attributes: { type: 'coffee', roastLevel: 'light', process: 'natural' },
  },
  {
    id: 'colombia-huila',
    name: { en: 'Huila Supremo', de: 'Huila Supremo' },
    origin: { en: 'Colombia', de: 'Kolumbien' },
    notes: { en: 'Caramel, red apple, milk chocolate', de: 'Karamell, roter Apfel, Milchschokolade' },
    basePrice: 1350,
    badge: 'new',
    attributes: { type: 'coffee', roastLevel: 'medium', process: 'washed' },
  },
  {
    id: 'brazil-santos',
    name: { en: 'Santos Natural', de: 'Santos Natural' },
    origin: { en: 'Brazil', de: 'Brasilien' },
    notes: { en: 'Nuts, dark chocolate, smooth body', de: 'Nüsse, dunkle Schokolade, vollmundig' },
    basePrice: 1290,
    attributes: { type: 'coffee', roastLevel: 'medium-dark', process: 'natural' },
  },
];

// Tea Products
const teaProducts = [
  {
    id: 'jade-dragon',
    name: { en: 'Jade Dragon', de: 'Jade Drache' },
    origin: { en: 'China, Zhejiang', de: 'China, Zhejiang' },
    notes: { en: 'Sweet, chestnut, vegetal freshness', de: 'Süß, Kastanie, pflanzliche Frische' },
    basePrice: 1290,
    badge: 'bestseller',
    attributes: { type: 'tea', teaType: 'green', caffeine: 'medium', steepTime: '2-3 min', temperature: '75°C' },
  },
  {
    id: 'earl-grey-supreme',
    name: { en: 'Earl Grey Supreme', de: 'Earl Grey Supreme' },
    origin: { en: 'India & Sri Lanka Blend', de: 'Indien & Sri Lanka Mischung' },
    notes: { en: 'Bergamot, citrus, malty base', de: 'Bergamotte, Zitrus, malzige Basis' },
    basePrice: 1190,
    badge: 'new',
    attributes: { type: 'tea', teaType: 'black', caffeine: 'high', steepTime: '3-5 min', temperature: '95°C' },
  },
  {
    id: 'alpine-herbs',
    name: { en: 'Alpine Herbs', de: 'Alpenkräuter' },
    origin: { en: 'Bavaria, Germany', de: 'Bayern, Deutschland' },
    notes: { en: 'Mint, chamomile, lemon balm', de: 'Minze, Kamille, Zitronenmelisse' },
    basePrice: 990,
    attributes: { type: 'tea', teaType: 'herbal', caffeine: 'none', steepTime: '5-7 min', temperature: '100°C' },
  },
];
```

---

## 6. Database Schema

Using SQLite with Drizzle ORM for simplicity and easy backups.

```typescript
// src/db/schema.ts
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

// Products (synced from config, but allows dynamic management)
export const products = sqliteTable('products', {
  id: text('id').primaryKey(),
  brand: text('brand').notNull(),              // 'coffee' | 'tea'
  slug: text('slug').notNull().unique(),
  data: text('data', { mode: 'json' }),        // Full product JSON
  stockQuantity: integer('stock_quantity').default(0),
  active: integer('active', { mode: 'boolean' }).default(true),
  stripeProductId: text('stripe_product_id'),
  createdAt: integer('created_at', { mode: 'timestamp' }),
  updatedAt: integer('updated_at', { mode: 'timestamp' }),
});

// Customers
export const customers = sqliteTable('customers', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'),         // null for guest checkouts
  name: text('name'),
  phone: text('phone'),
  defaultAddressId: text('default_address_id'),
  stripeCustomerId: text('stripe_customer_id'),
  createdAt: integer('created_at', { mode: 'timestamp' }),
  lastOrderAt: integer('last_order_at', { mode: 'timestamp' }),
  totalOrders: integer('total_orders').default(0),
  totalSpent: integer('total_spent').default(0), // cents
});

// Customer Addresses
export const addresses = sqliteTable('addresses', {
  id: text('id').primaryKey(),
  customerId: text('customer_id').references(() => customers.id),
  name: text('name').notNull(),
  street: text('street').notNull(),
  city: text('city').notNull(),
  postalCode: text('postal_code').notNull(),
  country: text('country').notNull(),          // ISO code
  isDefault: integer('is_default', { mode: 'boolean' }).default(false),
});

// Orders
export const orders = sqliteTable('orders', {
  id: text('id').primaryKey(),
  orderNumber: text('order_number').notNull().unique(),  // ML-2024-0001
  brand: text('brand').notNull(),
  customerId: text('customer_id').references(() => customers.id),
  
  // Status workflow
  status: text('status').notNull(),            // See status enum below
  
  // Stripe
  stripeSessionId: text('stripe_session_id'),
  stripePaymentIntentId: text('stripe_payment_intent_id'),
  
  // Invoice
  invoiceId: text('invoice_id'),               // From rechnungs-api.de
  invoiceUrl: text('invoice_url'),
  invoiceNumber: text('invoice_number'),
  
  // Amounts (cents)
  subtotal: integer('subtotal').notNull(),
  shippingCost: integer('shipping_cost').notNull(),
  taxAmount: integer('tax_amount').notNull(),
  total: integer('total').notNull(),
  
  // Shipping
  shippingAddress: text('shipping_address', { mode: 'json' }),
  shippingMethod: text('shipping_method'),
  trackingNumber: text('tracking_number'),
  
  // Customer info (denormalized for guests)
  customerEmail: text('customer_email').notNull(),
  customerName: text('customer_name'),
  
  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' }),
  paidAt: integer('paid_at', { mode: 'timestamp' }),
  roastedAt: integer('roasted_at', { mode: 'timestamp' }),     // Coffee: when roasted
  preparedAt: integer('prepared_at', { mode: 'timestamp' }),   // Tea: when prepared
  shippedAt: integer('shipped_at', { mode: 'timestamp' }),
  deliveredAt: integer('delivered_at', { mode: 'timestamp' }),
  
  // Notes
  customerNote: text('customer_note'),
  internalNote: text('internal_note'),
  
  // Locale
  locale: text('locale').default('de'),
});

// Order Items
export const orderItems = sqliteTable('order_items', {
  id: text('id').primaryKey(),
  orderId: text('order_id').references(() => orders.id),
  productId: text('product_id').notNull(),
  variantId: text('variant_id'),
  productName: text('product_name').notNull(),   // Snapshot
  variantName: text('variant_name'),
  quantity: integer('quantity').notNull(),
  unitPrice: integer('unit_price').notNull(),
  totalPrice: integer('total_price').notNull(),
});

// Order Status Enum
export const ORDER_STATUSES = {
  pending: 'Pending Payment',
  paid: 'Paid',
  processing: 'Processing',              // Roasting/Preparing
  ready: 'Ready to Ship',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
} as const;

// Subscriptions
export const subscriptions = sqliteTable('subscriptions', {
  id: text('id').primaryKey(),
  customerId: text('customer_id').references(() => customers.id),
  brand: text('brand').notNull(),
  
  // Schedule
  frequency: text('frequency').notNull(),      // 'weekly' | 'biweekly' | 'monthly'
  nextDeliveryDate: integer('next_delivery_date', { mode: 'timestamp' }),
  
  // Product selection
  items: text('items', { mode: 'json' }),      // Array of {productId, variantId, quantity}
  
  // Pricing
  subtotal: integer('subtotal').notNull(),
  shippingCost: integer('shipping_cost').notNull(),
  
  // Stripe
  stripeSubscriptionId: text('stripe_subscription_id'),
  
  // Status
  status: text('status').notNull(),            // 'active' | 'paused' | 'cancelled'
  pausedUntil: integer('paused_until', { mode: 'timestamp' }),
  
  createdAt: integer('created_at', { mode: 'timestamp' }),
  cancelledAt: integer('cancelled_at', { mode: 'timestamp' }),
});

// Gift Cards
export const giftCards = sqliteTable('gift_cards', {
  id: text('id').primaryKey(),
  code: text('code').notNull().unique(),       // MARIE-XXXX-XXXX
  brand: text('brand'),                        // null = valid for both
  
  initialBalance: integer('initial_balance').notNull(),  // cents
  currentBalance: integer('current_balance').notNull(),
  
  purchaserEmail: text('purchaser_email'),
  recipientEmail: text('recipient_email'),
  recipientName: text('recipient_name'),
  message: text('message'),
  
  expiresAt: integer('expires_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }),
  redeemedAt: integer('redeemed_at', { mode: 'timestamp' }),
});

// Reviews
export const reviews = sqliteTable('reviews', {
  id: text('id').primaryKey(),
  productId: text('product_id').notNull(),
  customerId: text('customer_id').references(() => customers.id),
  orderId: text('order_id').references(() => orders.id),
  
  rating: integer('rating').notNull(),         // 1-5
  title: text('title'),
  content: text('content'),
  
  status: text('status').notNull(),            // 'pending' | 'approved' | 'rejected'
  
  customerName: text('customer_name'),         // Display name
  verifiedPurchase: integer('verified_purchase', { mode: 'boolean' }),
  
  createdAt: integer('created_at', { mode: 'timestamp' }),
  approvedAt: integer('approved_at', { mode: 'timestamp' }),
});

// Analytics Events (simple)
export const analyticsEvents = sqliteTable('analytics_events', {
  id: text('id').primaryKey(),
  brand: text('brand'),
  event: text('event').notNull(),              // 'page_view', 'add_to_cart', 'purchase', etc.
  path: text('path'),
  productId: text('product_id'),
  value: integer('value'),                     // Order value for purchases
  metadata: text('metadata', { mode: 'json' }),
  sessionId: text('session_id'),
  createdAt: integer('created_at', { mode: 'timestamp' }),
});

// Newsletter Subscribers
export const newsletterSubscribers = sqliteTable('newsletter_subscribers', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  brand: text('brand'),                        // null = both
  locale: text('locale').default('de'),
  subscribedAt: integer('subscribed_at', { mode: 'timestamp' }),
  unsubscribedAt: integer('unsubscribed_at', { mode: 'timestamp' }),
});
```

---

## 7. Shipping Configuration

```typescript
// src/config/shipping.ts

export interface ShippingZone {
  id: string;
  name: { en: string; de: string };
  countries: string[];           // ISO codes
  methods: ShippingMethod[];
}

export interface ShippingMethod {
  id: string;
  name: { en: string; de: string };
  description: { en: string; de: string };
  price: number;                 // cents
  freeAbove?: number;            // Free shipping threshold (cents)
  estimatedDays: { min: number; max: number };
  stripeShippingRateId?: string;
}

export const shippingZones: ShippingZone[] = [
  {
    id: 'germany',
    name: { en: 'Germany', de: 'Deutschland' },
    countries: ['DE'],
    methods: [
      {
        id: 'standard-de',
        name: { en: 'Standard Shipping', de: 'Standardversand' },
        description: { en: 'DHL Paket', de: 'DHL Paket' },
        price: 495,              // €4.95
        freeAbove: 4900,         // Free above €49
        estimatedDays: { min: 2, max: 4 },
      },
      {
        id: 'express-de',
        name: { en: 'Express Shipping', de: 'Expressversand' },
        description: { en: 'DHL Express (next business day)', de: 'DHL Express (nächster Werktag)' },
        price: 995,              // €9.95
        estimatedDays: { min: 1, max: 1 },
      },
    ],
  },
  {
    id: 'eu',
    name: { en: 'European Union', de: 'Europäische Union' },
    countries: ['AT', 'NL', 'BE', 'FR', 'IT', 'ES', 'PL', 'CZ', 'DK', 'SE'],
    methods: [
      {
        id: 'standard-eu',
        name: { en: 'EU Shipping', de: 'EU-Versand' },
        description: { en: 'DHL Paket International', de: 'DHL Paket International' },
        price: 995,              // €9.95
        freeAbove: 7500,         // Free above €75
        estimatedDays: { min: 3, max: 7 },
      },
    ],
  },
  {
    id: 'ch',
    name: { en: 'Switzerland', de: 'Schweiz' },
    countries: ['CH'],
    methods: [
      {
        id: 'standard-ch',
        name: { en: 'Switzerland Shipping', de: 'Schweiz Versand' },
        description: { en: 'DHL Paket (customs may apply)', de: 'DHL Paket (Zoll kann anfallen)' },
        price: 1495,             // €14.95
        estimatedDays: { min: 4, max: 8 },
      },
    ],
  },
];
```

---

## 8. Invoice Integration (rechnungs-api.de)

```typescript
// src/lib/invoice.ts

interface InvoiceData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  billingAddress: Address;
  items: InvoiceItem[];
  subtotal: number;
  shippingCost: number;
  taxRate: number;           // e.g., 19 for 19%
  taxAmount: number;
  total: number;
  paidAt: Date;
  locale: 'de' | 'en';
}

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export async function createInvoice(data: InvoiceData): Promise<{
  invoiceId: string;
  invoiceNumber: string;
  invoiceUrl: string;
  pdfUrl: string;
}> {
  const response = await fetch('https://api.rechnungs-api.de/v1/invoices', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RECHNUNGS_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      template_id: process.env.RECHNUNGS_API_TEMPLATE_ID,
      
      // Customer info
      customer: {
        name: data.customerName,
        email: data.customerEmail,
        address: {
          street: data.billingAddress.street,
          city: data.billingAddress.city,
          postal_code: data.billingAddress.postalCode,
          country: data.billingAddress.country,
        },
      },
      
      // Line items
      items: data.items.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unitPrice / 100,  // Convert cents to euros
        tax_rate: data.taxRate,
      })),
      
      // Shipping as line item
      shipping: {
        description: data.locale === 'de' ? 'Versandkosten' : 'Shipping',
        amount: data.shippingCost / 100,
        tax_rate: data.taxRate,
      },
      
      // Metadata
      reference: data.orderNumber,
      paid: true,
      paid_at: data.paidAt.toISOString(),
      language: data.locale,
      
      // Auto-send to customer
      send_to_customer: true,
    }),
  });
  
  const result = await response.json();
  
  return {
    invoiceId: result.id,
    invoiceNumber: result.invoice_number,
    invoiceUrl: result.web_url,
    pdfUrl: result.pdf_url,
  };
}
```

---

## 9. Email Automation

```typescript
// src/lib/email.ts

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Email templates
export const emailTemplates = {
  // Order confirmation
  orderConfirmation: async (order: Order, locale: 'de' | 'en') => {
    const subject = locale === 'de' 
      ? `Bestellbestätigung #${order.orderNumber}`
      : `Order Confirmation #${order.orderNumber}`;
    
    // Use React Email templates or HTML
    return resend.emails.send({
      from: `Marie Lou <orders@${order.brand === 'coffee' ? 'marieloucoffee' : 'marieloutea'}.com>`,
      to: order.customerEmail,
      subject,
      react: OrderConfirmationEmail({ order, locale }),
    });
  },
  
  // Shipping notification
  orderShipped: async (order: Order, trackingNumber: string, locale: 'de' | 'en') => {
    const subject = locale === 'de'
      ? `Deine Bestellung ist unterwegs! #${order.orderNumber}`
      : `Your order is on its way! #${order.orderNumber}`;
    
    return resend.emails.send({
      from: `Marie Lou <orders@${order.brand === 'coffee' ? 'marieloucoffee' : 'marieloutea'}.com>`,
      to: order.customerEmail,
      subject,
      react: OrderShippedEmail({ order, trackingNumber, locale }),
    });
  },
  
  // Review request (sent 7 days after delivery)
  reviewRequest: async (order: Order, locale: 'de' | 'en') => {
    const subject = locale === 'de'
      ? 'Wie hat dir dein Kaffee geschmeckt?'
      : 'How did you enjoy your coffee?';
    
    return resend.emails.send({
      from: `Marie Lou <hello@${order.brand === 'coffee' ? 'marieloucoffee' : 'marieloutea'}.com>`,
      to: order.customerEmail,
      subject,
      react: ReviewRequestEmail({ order, locale }),
    });
  },
  
  // Subscription reminder (3 days before charge)
  subscriptionReminder: async (subscription: Subscription, locale: 'de' | 'en') => {
    // ...
  },
  
  // Gift card delivery
  giftCardDelivery: async (giftCard: GiftCard, locale: 'de' | 'en') => {
    // ...
  },
  
  // Admin notification for new orders
  adminNewOrder: async (order: Order) => {
    return resend.emails.send({
      from: 'Marie Lou System <system@marielou.de>',
      to: 'marcel@marielou.de',  // Your email
      subject: `🛒 New Order: ${order.orderNumber} (€${(order.total / 100).toFixed(2)})`,
      react: AdminNewOrderEmail({ order }),
    });
  },
  
  // Low stock alert
  adminLowStock: async (products: Product[]) => {
    return resend.emails.send({
      from: 'Marie Lou System <system@marielou.de>',
      to: 'marcel@marielou.de',
      subject: `⚠️ Low Stock Alert: ${products.length} products`,
      react: AdminLowStockEmail({ products }),
    });
  },
};
```

---

## 10. Automation Workflows

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ORDER AUTOMATION FLOW                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Customer places order                                                      │
│         │                                                                   │
│         ▼                                                                   │
│  ┌──────────────┐                                                           │
│  │ Stripe       │ ──────▶ Webhook: checkout.session.completed               │
│  │ Checkout     │                      │                                    │
│  └──────────────┘                      ▼                                    │
│                              ┌──────────────────┐                           │
│                              │  Create Order    │                           │
│                              │  in Database     │                           │
│                              └────────┬─────────┘                           │
│                                       │                                     │
│                    ┌──────────────────┼──────────────────┐                  │
│                    ▼                  ▼                  ▼                  │
│          ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐        │
│          │ Create Invoice  │ │ Send Customer   │ │ Notify Admin    │        │
│          │ (rechnungs-api) │ │ Confirmation    │ │ (Email + Push)  │        │
│          └─────────────────┘ └─────────────────┘ └─────────────────┘        │
│                                                                             │
│  ═══════════════════════════════════════════════════════════════════════    │
│                                                                             │
│  Admin sees order in dashboard → Roasts/Prepares → Clicks "Mark Ready"      │
│         │                                                                   │
│         ▼                                                                   │
│  Admin enters tracking number → Clicks "Mark Shipped"                       │
│         │                                                                   │
│         ▼                                                                   │
│  ┌─────────────────┐                                                        │
│  │ Send Shipping   │                                                        │
│  │ Notification    │                                                        │
│  └─────────────────┘                                                        │
│                                                                             │
│  ═══════════════════════════════════════════════════════════════════════    │
│                                                                             │
│  7 days after delivery (Cron Job)                                           │
│         │                                                                   │
│         ▼                                                                   │
│  ┌─────────────────┐                                                        │
│  │ Send Review     │                                                        │
│  │ Request Email   │                                                        │
│  └─────────────────┘                                                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Automated Cron Jobs (Vercel Cron)

```typescript
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/process-subscriptions",
      "schedule": "0 8 * * *"         // Daily at 8 AM
    },
    {
      "path": "/api/cron/send-review-requests",
      "schedule": "0 10 * * *"        // Daily at 10 AM
    },
    {
      "path": "/api/cron/subscription-reminders",
      "schedule": "0 9 * * *"         // Daily at 9 AM
    },
    {
      "path": "/api/cron/check-low-stock",
      "schedule": "0 7 * * 1"         // Weekly on Monday at 7 AM
    }
  ]
}
```

---

## 11. Admin Dashboard

### 11.1 Dashboard Overview Page

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  🏠 Marie Lou Admin                                      [Coffee ▼] [Marcel]│
├────────────┬────────────────────────────────────────────────────────────────┤
│            │                                                                │
│  📊 Dashboard│  Good morning, Marcel!                   📅 Today, Jan 5     │
│  📦 Orders  │  ─────────────────────────────────────────────────────────    │
│  🛍 Products│                                                               │
│  👥 Customers│ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐  │
│  🔄 Subscr. │ │  💰 Today  │ │ 📦 Pending │ │ 🔥 Ready   │ │ 📈 Month   │  │
│  🎁 Gift Cards│ €127.50    │ │  3 orders  │ │  1 order   │ │ €2,847     │  │
│  ⭐ Reviews │ │  +2 orders │ │            │ │  to ship   │ │ +12% ↑     │  │
│  📈 Analytics│ └────────────┘ └────────────┘ └────────────┘ └────────────┘  │
│  ⚙️ Settings│                                                               │
│            │  ─────────────────────────────────────────────────────────     │
│            │                                                                │
│            │  🚨 Action Required                                            │
│            │  ┌─────────────────────────────────────────────────────────┐   │
│            │  │ ⏳ 3 orders awaiting processing                         │   │
│            │  │    → ML-2024-0127  Sarah M.     €42.50   [Process →]   │   │
│            │  │    → ML-2024-0126  Thomas K.    €28.00   [Process →]   │   │
│            │  │    → ML-2024-0125  Emma L.      €57.00   [Process →]   │   │
│            │  └─────────────────────────────────────────────────────────┘   │
│            │                                                                │
│            │  📦 Ready to Ship                                              │
│            │  ┌─────────────────────────────────────────────────────────┐   │
│            │  │ ML-2024-0124  Jan D.    €35.00   [Enter Tracking →]    │   │
│            │  └─────────────────────────────────────────────────────────┘   │
│            │                                                                │
│            │  ─────────────────────────────────────────────────────────     │
│            │                                                                │
│            │  📊 Recent Activity                                            │
│            │  • 10:23  New order ML-2024-0127 from Sarah M. (€42.50)        │
│            │  • 09:45  Review submitted for Ethiopia Yirgacheffe ⭐⭐⭐⭐⭐    │
│            │  • 09:12  New newsletter subscriber: max@example.com           │
│            │  • Yesterday  Order ML-2024-0122 delivered                     │
│            │                                                                │
└────────────┴────────────────────────────────────────────────────────────────┘
```

### 11.2 Orders Page

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  📦 Orders                                     [Search...] [Filter ▼] [↓CSV]│
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [All] [Pending 3] [Processing] [Ready 1] [Shipped] [Delivered]             │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ #         │ Customer      │ Items    │ Total   │ Status    │ Date  │    │
│  ├───────────┼───────────────┼──────────┼─────────┼───────────┼───────┤    │
│  │ ML-0127   │ Sarah M.      │ 2 items  │ €42.50  │ 🟡 Paid   │ Today │    │
│  │ ML-0126   │ Thomas K.     │ 1 item   │ €28.00  │ 🟡 Paid   │ Today │    │
│  │ ML-0125   │ Emma L.       │ 3 items  │ €57.00  │ 🟡 Paid   │ Today │    │
│  │ ML-0124   │ Jan D.        │ 2 items  │ €35.00  │ 🔵 Ready  │ Yest. │    │
│  │ ML-0123   │ Lisa W.       │ 1 item   │ €14.90  │ 🟢 Shipped│ Yest. │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 11.3 Order Detail Page

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ← Back to Orders          Order ML-2024-0127              [Print] [Invoice]│
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌────────────────────────────────────┐  ┌────────────────────────────────┐ │
│  │ Status                             │  │ Customer                       │ │
│  │ ───────────────────────────────    │  │ ────────────────────────────── │ │
│  │ ● Paid ─── ○ Processing ─── ○ Ready│  │ Sarah M.                       │ │
│  │            ─── ○ Shipped ─── ○ Done│  │ sarah@example.com              │ │
│  │                                    │  │ +49 123 456 789                │ │
│  │ [▶ Start Processing]               │  │                                │ │
│  └────────────────────────────────────┘  │ Musterstraße 123               │ │
│                                          │ 80331 München                  │ │
│  ┌────────────────────────────────────┐  │ Germany                        │ │
│  │ Items                              │  └────────────────────────────────┘ │
│  │ ──────────────────────────────────│                                     │
│  │ 1× Ethiopia Yirgacheffe           │  ┌────────────────────────────────┐ │
│  │    Whole Bean, 250g       €14.90  │  │ Timeline                       │ │
│  │                                    │  │ ────────────────────────────── │ │
│  │ 2× Colombia Huila                  │  │ ● 10:23  Payment received      │ │
│  │    Ground for Filter, 250g €27.00 │  │ ○ ──:──  Processing started    │ │
│  │ ─────────────────────────────────  │  │ ○ ──:──  Ready to ship        │ │
│  │ Subtotal                  €41.90  │  │ ○ ──:──  Shipped               │ │
│  │ Shipping (Standard DE)     €4.95  │  │ ○ ──:──  Delivered             │ │
│  │ ─────────────────────────────────  │  └────────────────────────────────┘ │
│  │ Total                     €46.85  │                                     │
│  └────────────────────────────────────┘                                     │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ Internal Notes                                                         │ │
│  │ [Add a note for yourself about this order...]                         │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 11.4 Analytics Page

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  📈 Analytics                               [This Month ▼] [Coffee ▼]       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐                │
│  │ Revenue    │ │ Orders     │ │ Avg Order  │ │ Conversion │                │
│  │ €2,847     │ │ 67         │ │ €42.49     │ │ 3.2%       │                │
│  │ +12% ↑     │ │ +8% ↑      │ │ +4% ↑      │ │ +0.3% ↑    │                │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘                │
│                                                                             │
│  Revenue Over Time                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │     €400 ┤                         ╭─╮                              │    │
│  │          │                     ╭───╯ ╰──╮                           │    │
│  │     €300 ┤              ╭──────╯        ╰───╮                       │    │
│  │          │         ╭────╯                   ╰────╮                  │    │
│  │     €200 ┤    ╭────╯                             ╰───               │    │
│  │          │ ───╯                                                     │    │
│  │     €100 ┼────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────   │    │
│  │          1    5    10   15   20   25   30                           │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  ┌─────────────────────────────────┐  ┌─────────────────────────────────┐   │
│  │ Top Products                    │  │ Traffic Sources                 │   │
│  │ ───────────────────────────────│  │ ─────────────────────────────── │   │
│  │ 1. Ethiopia Yirgacheffe   23%  │  │ Direct              45%  ████   │   │
│  │ 2. Colombia Huila         19%  │  │ Google Search       32%  ███    │   │
│  │ 3. Brazil Santos          15%  │  │ Instagram           18%  ██     │   │
│  │ 4. Subscription Box       12%  │  │ Other                5%  █      │   │
│  └─────────────────────────────────┘  └─────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 11.5 Admin Features Summary

| Feature                     | Description                                                                |
| --------------------------- | -------------------------------------------------------------------------- |
| **Dashboard**               | Quick overview: today's revenue, pending orders, actions needed            |
| **Order Management**        | List, filter, search orders. Update status with one click.                 |
| **Order Workflow**          | Visual status progression: Paid → Processing → Ready → Shipped → Delivered |
| **Bulk Actions**            | Mark multiple orders as processing, export to CSV                          |
| **Product Management**      | Add/edit/disable products, update stock, manage variants                   |
| **Customer List**           | View all customers, order history, total spent                             |
| **Subscription Management** | View active subscriptions, pause/cancel, upcoming renewals                 |
| **Gift Card Management**    | Create gift cards, view balances, redemption history                       |
| **Review Moderation**       | Approve/reject reviews before they go live                                 |
| **Analytics**               | Revenue, orders, conversion rate, top products, traffic                    |
| **Inventory Alerts**        | Low stock notifications on dashboard                                       |
| **Export**                  | CSV export for orders, customers, products                                 |
| **Settings**                | Shipping rates, email templates, store settings                            |

---

## 12. Feature Details (All Included)

### 12.1 Subscription System

**How it works:**
1. Customer selects products and frequency (weekly, biweekly, monthly)
2. Customer enters payment details (Stripe saves card)
3. System creates subscription record with next delivery date
4. 3 days before: Reminder email sent
5. On delivery date: Cron job creates order, charges card, triggers fulfillment
6. Customer can pause, skip, or cancel anytime from account page

**Customer controls:**
- Pause subscription (with resume date)
- Skip next delivery
- Change products or quantities
- Change delivery frequency
- Update payment method
- Cancel subscription

**Admin view:**
- List all active subscriptions
- See upcoming renewals this week
- View subscription revenue (MRR)
- Manually trigger or skip deliveries

### 12.2 Customer Accounts

**Features:**
- Email + password registration (optional at checkout)
- Order history with status tracking
- Saved addresses
- Subscription management
- Review submission
- Wishlist (optional)

**Guest checkout:**
- Still supported — account creation optional
- Can create account post-purchase using order email

**Authentication:**
- Simple email/password with Auth.js
- Magic link option (passwordless)
- Password reset flow

### 12.3 Inventory Tracking

**Simple stock management:**
- Each product has `stockQuantity`
- Decremented on successful order
- Low stock threshold per product (default: 10)
- Dashboard shows products below threshold
- Weekly email alert for low stock items

**Admin actions:**
- Update stock quantities
- View stock history
- Set low stock thresholds
- Bulk stock update via CSV

### 12.4 Gift Cards

**Purchase flow:**
1. Customer buys gift card (€25, €50, €100 or custom)
2. Enters recipient email and optional message
3. After payment, gift card code generated (MARIE-XXXX-XXXX)
4. Email sent to recipient with code and message
5. Recipient redeems at checkout

**Redemption:**
- Enter code at checkout
- Balance applied to order
- Remaining balance saved for future orders
- Cannot be combined with other gift cards (simplicity)

**Admin view:**
- All gift cards with balances
- Create manual gift cards (for promotions)
- View redemption history

### 12.5 Reviews System

**Collection:**
- 7 days after delivery: automated review request email
- Customer clicks link, lands on review form
- Fields: Rating (1-5 stars), Title, Review text
- Verified purchase badge shown

**Moderation:**
- New reviews go to "pending" status
- Admin reviews and approves/rejects
- Approved reviews appear on product pages
- Star ratings aggregated on product cards

**Display:**
- Product pages show approved reviews
- Average rating on product cards
- "X reviews" count
- Sort by: newest, highest, lowest

---

## 13. Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] Initialize Next.js 16 project with TypeScript
- [ ] Set up project structure
- [ ] Configure SQLite + Drizzle ORM
- [ ] Port existing CSS to CSS Modules with theme variables
- [ ] Implement brand configuration system (coffee + tea colors)
- [ ] Set up i18n with next-intl
- [ ] Create middleware for brand + locale detection
- [ ] Convert HTML sections to React components

### Phase 2: Core Components (Week 2)
- [ ] Build all homepage sections as components
- [ ] Create Navigation with language switcher
- [ ] Create Footer with legal links
- [ ] Implement responsive mobile menu
- [ ] Test both brand themes
- [ ] Create all legal pages (Impressum, AGB, etc.)
- [ ] Implement cookie consent banner

### Phase 3: Shop & Products (Week 3)
- [ ] Implement product data schema
- [ ] Create product listing page with filters
- [ ] Create product detail page
- [ ] Build ProductCard and ProductGrid components
- [ ] Implement variant selector (grind type, size)
- [ ] Seed initial products (3 per brand)

### Phase 4: Cart & Checkout (Week 4)
- [ ] Implement CartProvider (Context + localStorage)
- [ ] Build CartDrawer component
- [ ] Create full Cart page
- [ ] Set up Stripe account and products
- [ ] Implement checkout API route
- [ ] Integrate shipping zone selection
- [ ] Build success/confirmation page
- [ ] Set up Stripe webhook handling

### Phase 5: Invoice & Email Integration (Week 5)
- [ ] Integrate rechnungs-api.de for invoices
- [ ] Set up Resend for transactional emails
- [ ] Create email templates (order confirmation, shipping)
- [ ] Implement admin notification emails
- [ ] Test complete order flow end-to-end

### Phase 6: Admin Dashboard (Week 6-7)
- [ ] Build admin layout with sidebar
- [ ] Create dashboard overview page
- [ ] Implement orders list and detail views
- [ ] Build order status workflow
- [ ] Create product management pages
- [ ] Implement basic analytics
- [ ] Add CSV export functionality
- [ ] Set up admin authentication

### Phase 7: Customer Accounts (Week 8)
- [ ] Implement authentication (Auth.js)
- [ ] Create registration and login pages
- [ ] Build account dashboard
- [ ] Implement order history view
- [ ] Add address management
- [ ] Enable guest → account conversion

### Phase 8: Subscriptions (Week 9)
- [ ] Design subscription builder UI
- [ ] Implement Stripe subscription integration
- [ ] Create subscription management pages (customer)
- [ ] Build admin subscription view
- [ ] Set up cron jobs for processing
- [ ] Implement pause/skip/cancel functionality
- [ ] Add subscription reminder emails

### Phase 9: Gift Cards & Reviews (Week 10)
- [ ] Implement gift card purchase flow
- [ ] Create gift card email template
- [ ] Build redemption at checkout
- [ ] Add gift card admin management
- [ ] Implement review submission flow
- [ ] Build review moderation admin page
- [ ] Add review display on product pages
- [ ] Set up automated review request emails

### Phase 10: Polish & Launch (Week 11-12)
- [ ] Performance optimization
- [ ] SEO meta tags and sitemap
- [ ] Accessibility audit
- [ ] Security review
- [ ] Load testing
- [ ] Configure Vercel project
- [ ] Set up domains (coffee + tea)
- [ ] Configure environment variables per domain
- [ ] Set up Stripe webhooks for production
- [ ] Final testing on both domains
- [ ] **Go live!** 🚀

---

## 14. Environment Variables

```bash
# .env.local

# Brand (set per deployment)
NEXT_PUBLIC_BRAND=coffee  # or 'tea'

# Database
DATABASE_URL=file:./data/marie-lou.db

# Stripe
STRIPE_SECRET_KEY=sk_live_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Invoice API (rechnungs-api.de)
RECHNUNGS_API_KEY=xxx
RECHNUNGS_API_TEMPLATE_ID=xxx

# Email (Resend)
RESEND_API_KEY=re_xxx

# Auth
AUTH_SECRET=xxx
ADMIN_PASSWORD=xxx            # Simple admin auth (or use Auth.js)

# Base URL (for webhooks, emails)
NEXT_PUBLIC_BASE_URL=https://marieloucoffee.com

# Cron secret (Vercel)
CRON_SECRET=xxx
```

---

## 15. Deployment Strategy

### Vercel Setup

```
Vercel Project: marie-lou-shop
│
├── Production Domain: marieloucoffee.com
│   └── Environment: NEXT_PUBLIC_BRAND=coffee
│
├── Production Domain: marieloutea.com  
│   └── Environment: NEXT_PUBLIC_BRAND=tea
│
├── Admin Domain: admin.marielou.de (or /admin route)
│   └── Password protected
│
└── Preview (for pull requests)
    └── Environment: NEXT_PUBLIC_BRAND=coffee (default)
```

### Database Backup

```bash
# SQLite backup is simple - just copy the file
# Set up daily backup to cloud storage (S3, Cloudflare R2, etc.)

# Vercel Cron job or external service
0 3 * * * /backup/database.sh
```

---

## 16. One-Person Business Optimizations

| Aspect                    | Solution                                                  |
| ------------------------- | --------------------------------------------------------- |
| **Order notifications**   | Push notification + email for every new order             |
| **Daily summary**         | Morning email with: orders to process, low stock, revenue |
| **Quick actions**         | One-click status updates in admin                         |
| **Mobile-friendly admin** | Admin dashboard works on phone                            |
| **Batch processing**      | Process multiple orders at once                           |
| **Print packing slips**   | One-click print all pending orders                        |
| **Tracking entry**        | Quick form to enter tracking numbers                      |
| **Auto-emails**           | All customer emails automated                             |
| **Auto-invoices**         | Invoices generated and sent automatically                 |
| **Review moderation**     | Quick approve/reject in admin                             |
| **Stock alerts**          | Weekly email for items to reorder                         |

---

## 17. Summary: What You Get

```
✅ Beautiful multi-brand storefront (coffee + tea)
✅ German + English language support
✅ Product variants (grind types, sizes)
✅ Full shopping cart and checkout
✅ Stripe payments (cards, SEPA, Klarna)
✅ Automatic invoices via rechnungs-api.de
✅ Automated transactional emails
✅ Customer accounts with order history
✅ Subscription system (recurring orders)
✅ Gift cards (purchase and redeem)
✅ Product reviews with moderation
✅ Simple inventory tracking
✅ Clean admin dashboard
✅ Built-in analytics
✅ Order workflow management
✅ GDPR-compliant legal pages
✅ Mobile-responsive design
✅ Optimized for one-person operation
✅ Easy to maintain and extend
```

---

## Ready to Build?

This plan gives you a complete, production-ready e-commerce system that:
- Serves both brands from one codebase
- Automates as much as possible
- Gives you full control via admin dashboard
- Scales with your business

When you approve, we'll start with **Phase 1: Foundation** and work through systematically.