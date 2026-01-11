# Marie Lou Shop - Remaining Features Implementation Plan

## Overview

This document outlines all remaining features needed to make the Marie Lou Coffee/Tea shop fully functional and ready for production deployment on Vercel.

**Current Status:** ~60% Complete
**Estimated Remaining Work:** 4-5 weeks
**Priority:** High → Medium → Low

---

## Table of Contents

1. [Email System](#1-email-system)
2. [Vercel Deployment Configuration](#2-vercel-deployment-configuration)
3. [Cron Jobs & Automated Tasks](#3-cron-jobs--automated-tasks)
4. [Reviews System](#4-reviews-system)
5. [Subscription System](#5-subscription-system)
6. [Gift Cards System](#6-gift-cards-system)
7. [Admin Dashboard Enhancements](#7-admin-dashboard-enhancements)
8. [Customer Account Enhancements](#8-customer-account-enhancements)
9. [Missing Pages](#9-missing-pages)
10. [SEO & Performance](#10-seo--performance)
11. [Inventory Management](#11-inventory-management)
12. [Environment Variables](#12-environment-variables)

---

## 1. Email System

**Priority:** 🔴 HIGH (Required for Launch)
**Estimated Time:** 1-2 days

### 1.1 Setup Resend

**File:** `src/lib/email.ts`

```typescript
import { Resend } from 'resend';

export const resend = new Resend(process.env.RESEND_API_KEY);

// Domain configuration
export const getEmailDomain = (brand: 'coffee' | 'tea') => {
  return brand === 'coffee' ? 'marieloucoffee.com' : 'marieloutea.com';
};

export const getFromEmail = (brand: 'coffee' | 'tea', type: 'orders' | 'hello' | 'system') => {
  const domain = getEmailDomain(brand);
  return `Marie Lou <${type}@${domain}>`;
};
```

### 1.2 Email Templates to Create

Create folder: `src/emails/`

| Template              | File                       | Trigger                       |
| --------------------- | -------------------------- | ----------------------------- |
| Order Confirmation    | `OrderConfirmation.tsx`    | After successful payment      |
| Shipping Notification | `OrderShipped.tsx`         | When admin marks as shipped   |
| Delivery Confirmation | `OrderDelivered.tsx`       | When admin marks as delivered |
| Review Request        | `ReviewRequest.tsx`        | 7 days after delivery (cron)  |
| Subscription Reminder | `SubscriptionReminder.tsx` | 3 days before charge (cron)   |
| Gift Card Delivery    | `GiftCardDelivery.tsx`     | After gift card purchase      |
| Admin New Order       | `AdminNewOrder.tsx`        | After successful payment      |
| Admin Low Stock       | `AdminLowStock.tsx`        | Weekly cron job               |
| Admin Daily Summary   | `AdminDailySummary.tsx`    | Daily cron job                |
| Password Reset        | `PasswordReset.tsx`        | User requests reset           |
| Welcome Email         | `Welcome.tsx`              | After account creation        |

### 1.3 Template Structure (React Email)

```typescript
// src/emails/OrderConfirmation.tsx
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Row,
  Column,
} from '@react-email/components';

interface OrderConfirmationProps {
  orderNumber: string;
  customerName: string;
  items: Array<{
    name: string;
    variant: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  shipping: number;
  total: number;
  shippingAddress: {
    name: string;
    line1: string;
    line2?: string;
    city: string;
    postalCode: string;
    country: string;
  };
  locale: 'de' | 'en';
  brand: 'coffee' | 'tea';
}

export default function OrderConfirmation({
  orderNumber,
  customerName,
  items,
  subtotal,
  shipping,
  total,
  shippingAddress,
  locale,
  brand,
}: OrderConfirmationProps) {
  // Implementation
}
```

### 1.4 Send Email Functions

**File:** `src/lib/email.ts` (extend)

```typescript
export async function sendOrderConfirmation(order: Order, locale: 'de' | 'en') {
  const subject = locale === 'de' 
    ? `Bestellbestätigung #${order.orderNumber}`
    : `Order Confirmation #${order.orderNumber}`;
  
  return resend.emails.send({
    from: getFromEmail(order.brand as 'coffee' | 'tea', 'orders'),
    to: order.email,
    subject,
    react: OrderConfirmation({ /* props */ }),
  });
}

export async function sendShippingNotification(order: Order, trackingNumber: string, trackingUrl: string, locale: 'de' | 'en') {
  // Implementation
}

export async function sendAdminNewOrderNotification(order: Order) {
  return resend.emails.send({
    from: 'Marie Lou System <system@marielou.de>',
    to: process.env.ADMIN_EMAIL!,
    subject: `🛒 New Order: ${order.orderNumber} (€${(order.total / 100).toFixed(2)})`,
    react: AdminNewOrder({ order }),
  });
}
```

### 1.5 Integration Points

Update these files to send emails:

1. **`src/app/api/webhook/stripe/route.ts`**
   - After order creation: send `OrderConfirmation` + `AdminNewOrder`

2. **`src/app/api/admin/orders/[id]/status/route.ts`** (create)
   - On status change to 'shipped': send `OrderShipped`
   - On status change to 'delivered': send `OrderDelivered`

3. **`src/app/api/auth/register/route.ts`**
   - After registration: send `Welcome`

### 1.6 Dependencies

```bash
npm install resend @react-email/components
```

---

## 2. Vercel Deployment Configuration

**Priority:** 🔴 HIGH (Required for Launch)
**Estimated Time:** 2-4 hours

### 2.1 Create vercel.json

**File:** `vercel.json`

```json
{
  "crons": [
    {
      "path": "/api/cron/process-subscriptions",
      "schedule": "0 8 * * *"
    },
    {
      "path": "/api/cron/send-review-requests",
      "schedule": "0 10 * * *"
    },
    {
      "path": "/api/cron/subscription-reminders",
      "schedule": "0 9 * * *"
    },
    {
      "path": "/api/cron/check-low-stock",
      "schedule": "0 7 * * 1"
    },
    {
      "path": "/api/cron/daily-summary",
      "schedule": "0 6 * * *"
    },
    {
      "path": "/api/cron/cleanup-sessions",
      "schedule": "0 3 * * *"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

### 2.2 Create .env.example

**File:** `.env.example`

```bash
# ===========================================
# Marie Lou Shop - Environment Variables
# ===========================================

# Brand Configuration
NEXT_PUBLIC_BRAND=coffee  # or 'tea'

# Database
DATABASE_PATH=./data/marie-lou.db

# Stripe
STRIPE_SECRET_KEY=sk_live_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Invoice API (rechnungs-api.de)
RECHNUNGS_API_KEY=xxx
RECHNUNGS_API_URL=https://api.rechnungs-api.de

# Email (Resend)
RESEND_API_KEY=re_xxx

# Admin Authentication
ADMIN_EMAIL=admin@marielou.de
ADMIN_PASSWORD=your-secure-password-here

# Base URL (for webhooks, emails, etc.)
NEXT_PUBLIC_BASE_URL=https://marieloucoffee.com

# Cron Secret (for securing cron endpoints)
CRON_SECRET=your-cron-secret-here

# Optional: Analytics
# NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

### 2.3 Update next.config.ts for Production

**File:** `next.config.ts`

```typescript
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  // Enable static exports for better performance
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,
  
  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'marieloucoffee.com',
      },
      {
        protocol: 'https',
        hostname: 'marieloutea.com',
      },
    ],
  },
  
  // Headers for security
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
```

### 2.4 Database for Production

Since Vercel's serverless functions have ephemeral filesystems, you need a persistent database solution:

**Option A: Turso (Recommended for SQLite)**
```bash
npm install @libsql/client
```

Update `src/db/index.ts`:
```typescript
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });
```

**Option B: Keep SQLite with Vercel Blob Storage**
- Use Vercel Blob to store/backup the SQLite file
- Not recommended for production with multiple writes

---

## 3. Cron Jobs & Automated Tasks

**Priority:** 🔴 HIGH
**Estimated Time:** 1 day

### 3.1 Cron Authentication Middleware

**File:** `src/lib/cron-auth.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';

export function verifyCronRequest(request: NextRequest): boolean {
  // Vercel adds this header for cron jobs
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (authHeader === `Bearer ${cronSecret}`) {
    return true;
  }
  
  // Also check for Vercel's cron header
  const vercelCron = request.headers.get('x-vercel-cron');
  if (vercelCron) {
    return true;
  }
  
  return false;
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

### 3.2 Cron Job Routes

#### Process Subscriptions
**File:** `src/app/api/cron/process-subscriptions/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { verifyCronRequest, unauthorizedResponse } from '@/lib/cron-auth';
import { db } from '@/db';
import { subscriptions, orders } from '@/db/schema';
import { eq, lte, and } from 'drizzle-orm';
import { stripe } from '@/lib/stripe';

export async function GET(request: NextRequest) {
  if (!verifyCronRequest(request)) {
    return unauthorizedResponse();
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Find subscriptions due today
    const dueSubscriptions = await db.query.subscriptions.findMany({
      where: and(
        eq(subscriptions.status, 'active'),
        lte(subscriptions.nextDeliveryDate, today)
      ),
    });
    
    let processed = 0;
    let failed = 0;
    
    for (const subscription of dueSubscriptions) {
      try {
        // Create order from subscription
        // Charge customer via Stripe
        // Send confirmation email
        // Update next delivery date
        processed++;
      } catch (error) {
        console.error(`Failed to process subscription ${subscription.id}:`, error);
        failed++;
      }
    }
    
    return NextResponse.json({
      success: true,
      processed,
      failed,
      total: dueSubscriptions.length,
    });
  } catch (error) {
    console.error('Cron process-subscriptions error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

#### Send Review Requests
**File:** `src/app/api/cron/send-review-requests/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { verifyCronRequest, unauthorizedResponse } from '@/lib/cron-auth';
import { db } from '@/db';
import { orders } from '@/db/schema';
import { eq, and, lte, isNull } from 'drizzle-orm';
import { sendReviewRequestEmail } from '@/lib/email';

export async function GET(request: NextRequest) {
  if (!verifyCronRequest(request)) {
    return unauthorizedResponse();
  }

  try {
    // Find orders delivered 7 days ago that haven't received review request
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);
    
    const eightDaysAgo = new Date();
    eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);
    eightDaysAgo.setHours(0, 0, 0, 0);
    
    const eligibleOrders = await db.query.orders.findMany({
      where: and(
        eq(orders.status, 'delivered'),
        lte(orders.deliveredAt, sevenDaysAgo),
        // Add a reviewRequestSentAt column to track this
      ),
      limit: 50, // Process in batches
    });
    
    let sent = 0;
    for (const order of eligibleOrders) {
      try {
        await sendReviewRequestEmail(order);
        // Mark as sent
        sent++;
      } catch (error) {
        console.error(`Failed to send review request for order ${order.id}:`, error);
      }
    }
    
    return NextResponse.json({ success: true, sent });
  } catch (error) {
    console.error('Cron send-review-requests error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

#### Check Low Stock
**File:** `src/app/api/cron/check-low-stock/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { verifyCronRequest, unauthorizedResponse } from '@/lib/cron-auth';
import { db } from '@/db';
import { products } from '@/db/schema';
import { lte } from 'drizzle-orm';
import { sendAdminLowStockAlert } from '@/lib/email';

export async function GET(request: NextRequest) {
  if (!verifyCronRequest(request)) {
    return unauthorizedResponse();
  }

  try {
    const LOW_STOCK_THRESHOLD = 10;
    
    const lowStockProducts = await db.query.products.findMany({
      where: lte(products.stockQuantity, LOW_STOCK_THRESHOLD),
    });
    
    if (lowStockProducts.length > 0) {
      await sendAdminLowStockAlert(lowStockProducts);
    }
    
    return NextResponse.json({
      success: true,
      lowStockCount: lowStockProducts.length,
    });
  } catch (error) {
    console.error('Cron check-low-stock error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

#### Daily Summary
**File:** `src/app/api/cron/daily-summary/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { verifyCronRequest, unauthorizedResponse } from '@/lib/cron-auth';
import { db } from '@/db';
import { orders } from '@/db/schema';
import { eq, gte, sql } from 'drizzle-orm';
import { sendAdminDailySummary } from '@/lib/email';

export async function GET(request: NextRequest) {
  if (!verifyCronRequest(request)) {
    return unauthorizedResponse();
  }

  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get yesterday's stats
    const stats = await db.select({
      totalOrders: sql<number>`count(*)`,
      totalRevenue: sql<number>`sum(${orders.total})`,
      pendingOrders: sql<number>`sum(case when ${orders.status} = 'pending' then 1 else 0 end)`,
    })
    .from(orders)
    .where(gte(orders.createdAt, yesterday));
    
    await sendAdminDailySummary({
      date: yesterday,
      totalOrders: stats[0].totalOrders || 0,
      totalRevenue: stats[0].totalRevenue || 0,
      pendingOrders: stats[0].pendingOrders || 0,
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Cron daily-summary error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

#### Cleanup Sessions
**File:** `src/app/api/cron/cleanup-sessions/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { verifyCronRequest, unauthorizedResponse } from '@/lib/cron-auth';
import { cleanupExpiredSessions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  if (!verifyCronRequest(request)) {
    return unauthorizedResponse();
  }

  try {
    await cleanupExpiredSessions();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Cron cleanup-sessions error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

---

## 4. Reviews System

**Priority:** 🟡 MEDIUM
**Estimated Time:** 1-2 days

### 4.1 Database Schema

Add to `src/db/schema.ts`:

```typescript
export const reviews = sqliteTable('reviews', {
  id: text('id').primaryKey(),
  productId: text('product_id').notNull(),
  productSlug: text('product_slug').notNull(),
  customerId: text('customer_id').references(() => customers.id),
  orderId: text('order_id').references(() => orders.id),
  orderItemId: text('order_item_id'),
  
  rating: integer('rating').notNull(), // 1-5
  title: text('title'),
  content: text('content'),
  
  status: text('status').notNull().default('pending'), // 'pending' | 'approved' | 'rejected'
  
  customerName: text('customer_name'), // Display name (can be anonymous)
  verifiedPurchase: integer('verified_purchase', { mode: 'boolean' }).default(false),
  
  // Admin response
  adminResponse: text('admin_response'),
  adminRespondedAt: integer('admin_responded_at', { mode: 'timestamp' }),
  
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  approvedAt: integer('approved_at', { mode: 'timestamp' }),
});

// Track which orders have been sent review requests
export const reviewRequests = sqliteTable('review_requests', {
  id: text('id').primaryKey(),
  orderId: text('order_id').notNull().references(() => orders.id),
  sentAt: integer('sent_at', { mode: 'timestamp' }).notNull(),
  clickedAt: integer('clicked_at', { mode: 'timestamp' }),
  reviewId: text('review_id').references(() => reviews.id),
});
```

### 4.2 Create Migration

```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

### 4.3 API Routes

**File:** `src/app/api/reviews/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { reviews, orders, orderItems } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getCurrentCustomer } from '@/lib/auth';

// GET - Get reviews for a product
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const productSlug = searchParams.get('productSlug');
  
  if (!productSlug) {
    return NextResponse.json({ error: 'Product slug required' }, { status: 400 });
  }
  
  const productReviews = await db.query.reviews.findMany({
    where: and(
      eq(reviews.productSlug, productSlug),
      eq(reviews.status, 'approved')
    ),
    orderBy: (reviews, { desc }) => [desc(reviews.createdAt)],
  });
  
  // Calculate average rating
  const avgRating = productReviews.length > 0
    ? productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length
    : 0;
  
  return NextResponse.json({
    reviews: productReviews,
    averageRating: avgRating,
    totalReviews: productReviews.length,
  });
}

// POST - Submit a review
export async function POST(request: NextRequest) {
  try {
    const customer = await getCurrentCustomer();
    const body = await request.json();
    
    const { productSlug, orderId, rating, title, content, displayName } = body;
    
    // Validate
    if (!productSlug || !rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Invalid review data' }, { status: 400 });
    }
    
    // Check if verified purchase
    let verifiedPurchase = false;
    let orderItemId = null;
    
    if (orderId && customer) {
      const order = await db.query.orders.findFirst({
        where: and(
          eq(orders.id, orderId),
          eq(orders.customerId, customer.id)
        ),
      });
      
      if (order) {
        const item = await db.query.orderItems.findFirst({
          where: and(
            eq(orderItems.orderId, orderId),
            eq(orderItems.productSlug, productSlug)
          ),
        });
        
        if (item) {
          verifiedPurchase = true;
          orderItemId = item.id;
        }
      }
    }
    
    const reviewId = crypto.randomUUID();
    const now = new Date();
    
    await db.insert(reviews).values({
      id: reviewId,
      productSlug,
      customerId: customer?.id || null,
      orderId: orderId || null,
      orderItemId,
      rating,
      title: title || null,
      content: content || null,
      status: 'pending',
      customerName: displayName || customer?.firstName || 'Anonymous',
      verifiedPurchase,
      createdAt: now,
    });
    
    return NextResponse.json({ success: true, reviewId });
  } catch (error) {
    console.error('Review submission error:', error);
    return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
  }
}
```

### 4.4 Admin Review Moderation

**File:** `src/app/admin/(dashboard)/reviews/page.tsx`

```typescript
import { db } from '@/db';
import { reviews } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import styles from '../dashboard.module.css';
import ReviewActions from './ReviewActions';

export const dynamic = 'force-dynamic';

export default async function AdminReviewsPage() {
  const allReviews = await db.query.reviews.findMany({
    orderBy: [desc(reviews.createdAt)],
  });
  
  const pendingReviews = allReviews.filter(r => r.status === 'pending');
  const approvedReviews = allReviews.filter(r => r.status === 'approved');
  
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Review Moderation</h1>
        <p>{pendingReviews.length} pending reviews</p>
      </header>
      
      <section>
        <h2>Pending Reviews</h2>
        {pendingReviews.map(review => (
          <div key={review.id} className={styles.reviewCard}>
            <div className={styles.reviewHeader}>
              <span>{'⭐'.repeat(review.rating)}</span>
              <span>{review.customerName}</span>
              {review.verifiedPurchase && <span className={styles.badge}>Verified Purchase</span>}
            </div>
            {review.title && <h3>{review.title}</h3>}
            <p>{review.content}</p>
            <ReviewActions reviewId={review.id} />
          </div>
        ))}
      </section>
    </div>
  );
}
```

### 4.5 Review Display Component

**File:** `src/components/reviews/ReviewList.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import styles from './ReviewList.module.css';

interface Review {
  id: string;
  rating: number;
  title?: string;
  content?: string;
  customerName: string;
  verifiedPurchase: boolean;
  createdAt: string;
}

interface ReviewListProps {
  productSlug: string;
}

export default function ReviewList({ productSlug }: ReviewListProps) {
  const t = useTranslations('reviews');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetch(`/api/reviews?productSlug=${productSlug}`)
      .then(res => res.json())
      .then(data => {
        setReviews(data.reviews);
        setAverageRating(data.averageRating);
        setLoading(false);
      });
  }, [productSlug]);
  
  if (loading) return <div>Loading reviews...</div>;
  
  return (
    <div className={styles.container}>
      <div className={styles.summary}>
        <div className={styles.averageRating}>
          <span className={styles.stars}>{'⭐'.repeat(Math.round(averageRating))}</span>
          <span>{averageRating.toFixed(1)} / 5</span>
        </div>
        <span>{reviews.length} {t('reviews')}</span>
      </div>
      
      <div className={styles.reviewList}>
        {reviews.map(review => (
          <div key={review.id} className={styles.review}>
            <div className={styles.reviewHeader}>
              <span className={styles.stars}>{'⭐'.repeat(review.rating)}</span>
              <span className={styles.author}>{review.customerName}</span>
              {review.verifiedPurchase && (
                <span className={styles.verifiedBadge}>{t('verifiedPurchase')}</span>
              )}
            </div>
            {review.title && <h4>{review.title}</h4>}
            {review.content && <p>{review.content}</p>}
            <span className={styles.date}>
              {new Date(review.createdAt).toLocaleDateString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 5. Subscription System

**Priority:** 🟡 MEDIUM
**Estimated Time:** 3-4 days

### 5.1 Database Schema

Add to `src/db/schema.ts`:

```typescript
export const subscriptions = sqliteTable('subscriptions', {
  id: text('id').primaryKey(),
  customerId: text('customer_id').notNull().references(() => customers.id),
  brand: text('brand').notNull(),
  
  // Stripe subscription info
  stripeSubscriptionId: text('stripe_subscription_id'),
  stripeCustomerId: text('stripe_customer_id'),
  stripePriceId: text('stripe_price_id'),
  
  // Subscription details
  status: text('status').notNull().default('active'), // 'active' | 'paused' | 'cancelled'
  frequency: text('frequency').notNull(), // 'weekly' | 'biweekly' | 'monthly'
  
  // Products in subscription (JSON)
  items: text('items', { mode: 'json' }).$type<SubscriptionItem[]>(),
  
  // Pricing
  subtotal: integer('subtotal').notNull(), // cents
  shippingCost: integer('shipping_cost').notNull(),
  total: integer('total').notNull(),
  
  // Delivery
  shippingAddressId: text('shipping_address_id').references(() => addresses.id),
  nextDeliveryDate: integer('next_delivery_date', { mode: 'timestamp' }),
  lastDeliveryDate: integer('last_delivery_date', { mode: 'timestamp' }),
  
  // Pause info
  pausedAt: integer('paused_at', { mode: 'timestamp' }),
  pauseUntil: integer('pause_until', { mode: 'timestamp' }),
  
  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  cancelledAt: integer('cancelled_at', { mode: 'timestamp' }),
});

interface SubscriptionItem {
  productId: string;
  productSlug: string;
  productName: string;
  variantId: string;
  variantName: string;
  quantity: number;
  unitPrice: number;
}
```

### 5.2 Subscribe Page

**File:** `src/app/[locale]/subscribe/page.tsx`

Create a subscription builder page where customers can:
1. Select products to include
2. Choose quantities
3. Select delivery frequency
4. Enter shipping address
5. Set up payment with Stripe

### 5.3 Stripe Subscription Integration

**File:** `src/lib/stripe-subscriptions.ts`

```typescript
import { stripe } from './stripe';

export async function createStripeSubscription(params: {
  customerId: string;
  priceId: string;
  metadata: Record<string, string>;
}) {
  const subscription = await stripe.subscriptions.create({
    customer: params.customerId,
    items: [{ price: params.priceId }],
    metadata: params.metadata,
    payment_behavior: 'default_incomplete',
    expand: ['latest_invoice.payment_intent'],
  });
  
  return subscription;
}

export async function pauseSubscription(subscriptionId: string) {
  return stripe.subscriptions.update(subscriptionId, {
    pause_collection: {
      behavior: 'void',
    },
  });
}

export async function resumeSubscription(subscriptionId: string) {
  return stripe.subscriptions.update(subscriptionId, {
    pause_collection: '',
  });
}

export async function cancelSubscription(subscriptionId: string) {
  return stripe.subscriptions.cancel(subscriptionId);
}
```

### 5.4 Customer Subscription Management

**File:** `src/app/[locale]/account/subscriptions/page.tsx`

Display:
- Active subscriptions
- Next delivery date
- Products included
- Pause/Skip/Cancel buttons
- Edit products/frequency

---

## 6. Gift Cards System

**Priority:** 🟡 MEDIUM
**Estimated Time:** 2-3 days

### 6.1 Database Schema

Add to `src/db/schema.ts`:

```typescript
export const giftCards = sqliteTable('gift_cards', {
  id: text('id').primaryKey(),
  code: text('code').notNull().unique(), // MARIE-XXXX-XXXX
  brand: text('brand'), // null = valid for both brands
  
  // Amounts (cents)
  initialBalance: integer('initial_balance').notNull(),
  currentBalance: integer('current_balance').notNull(),
  
  // Purchaser info
  purchaserId: text('purchaser_id').references(() => customers.id),
  purchaserEmail: text('purchaser_email'),
  
  // Recipient info
  recipientEmail: text('recipient_email'),
  recipientName: text('recipient_name'),
  personalMessage: text('personal_message'),
  
  // Status
  status: text('status').notNull().default('active'), // 'active' | 'used' | 'expired'
  
  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  deliveredAt: integer('delivered_at', { mode: 'timestamp' }),
  firstUsedAt: integer('first_used_at', { mode: 'timestamp' }),
  expiresAt: integer('expires_at', { mode: 'timestamp' }),
});

export const giftCardTransactions = sqliteTable('gift_card_transactions', {
  id: text('id').primaryKey(),
  giftCardId: text('gift_card_id').notNull().references(() => giftCards.id),
  orderId: text('order_id').references(() => orders.id),
  
  type: text('type').notNull(), // 'purchase' | 'redemption' | 'refund'
  amount: integer('amount').notNull(), // cents (positive for purchase, negative for redemption)
  balanceAfter: integer('balance_after').notNull(),
  
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});
```

### 6.2 Gift Card Code Generation

**File:** `src/lib/gift-cards.ts`

```typescript
export function generateGiftCardCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing chars
  let code = 'MARIE-';
  
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  code += '-';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return code;
}

export async function validateGiftCard(code: string) {
  const giftCard = await db.query.giftCards.findFirst({
    where: eq(giftCards.code, code.toUpperCase()),
  });
  
  if (!giftCard) {
    return { valid: false, error: 'Gift card not found' };
  }
  
  if (giftCard.status !== 'active') {
    return { valid: false, error: 'Gift card is no longer active' };
  }
  
  if (giftCard.currentBalance <= 0) {
    return { valid: false, error: 'Gift card has no remaining balance' };
  }
  
  if (giftCard.expiresAt && giftCard.expiresAt < new Date()) {
    return { valid: false, error: 'Gift card has expired' };
  }
  
  return { valid: true, giftCard };
}

export async function redeemGiftCard(code: string, amount: number, orderId: string) {
  const { valid, giftCard, error } = await validateGiftCard(code);
  
  if (!valid || !giftCard) {
    throw new Error(error);
  }
  
  const redeemAmount = Math.min(amount, giftCard.currentBalance);
  const newBalance = giftCard.currentBalance - redeemAmount;
  
  await db.transaction(async (tx) => {
    // Update gift card balance
    await tx.update(giftCards)
      .set({
        currentBalance: newBalance,
        status: newBalance === 0 ? 'used' : 'active',
        firstUsedAt: giftCard.firstUsedAt || new Date(),
      })
      .where(eq(giftCards.id, giftCard.id));
    
    // Record transaction
    await tx.insert(giftCardTransactions).values({
      id: crypto.randomUUID(),
      giftCardId: giftCard.id,
      orderId,
      type: 'redemption',
      amount: -redeemAmount,
      balanceAfter: newBalance,
      createdAt: new Date(),
    });
  });
  
  return { redeemed: redeemAmount, remainingBalance: newBalance };
}
```

### 6.3 Gift Card Purchase Page

**File:** `src/app/[locale]/gift-cards/page.tsx`

Create page with:
- Preset amounts (€25, €50, €100)
- Custom amount option
- Recipient email and name
- Personal message
- Stripe checkout for payment

### 6.4 Gift Card Redemption at Checkout

Update checkout page to:
1. Add gift card code input field
2. Validate code on entry
3. Apply balance to order total
4. Show remaining balance after purchase

---

## 7. Admin Dashboard Enhancements

**Priority:** 🟡 MEDIUM
**Estimated Time:** 2-3 days

### 7.1 Dashboard Overview Page

**File:** `src/app/admin/(dashboard)/page.tsx`

```typescript
import { db } from '@/db';
import { orders, customers } from '@/db/schema';
import { sql, gte, eq } from 'drizzle-orm';
import styles from './dashboard.module.css';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  // Today's stats
  const todayStats = await db.select({
    orders: sql<number>`count(*)`,
    revenue: sql<number>`sum(${orders.total})`,
  })
  .from(orders)
  .where(gte(orders.createdAt, today));
  
  // Month stats
  const monthStats = await db.select({
    orders: sql<number>`count(*)`,
    revenue: sql<number>`sum(${orders.total})`,
  })
  .from(orders)
  .where(gte(orders.createdAt, thirtyDaysAgo));
  
  // Pending orders
  const pendingOrders = await db.query.orders.findMany({
    where: eq(orders.status, 'paid'),
    orderBy: (orders, { asc }) => [asc(orders.createdAt)],
    limit: 10,
  });
  
  // Ready to ship
  const readyToShip = await db.query.orders.findMany({
    where: eq(orders.status, 'processing'),
    orderBy: (orders, { asc }) => [asc(orders.createdAt)],
    limit: 10,
  });
  
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Dashboard</h1>
        <p>Good morning! Here's what's happening today.</p>
      </header>
      
      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Today's Revenue</span>
          <span className={styles.statValue}>€{((todayStats[0]?.revenue || 0) / 100).toFixed(2)}</span>
          <span className={styles.statSubtext}>{todayStats[0]?.orders || 0} orders</span>
        </div>
        {/* More stat cards... */}
      </div>
      
      {/* Action Required Section */}
      <section className={styles.actionSection}>
        <h2>⏳ Action Required</h2>
        
        {pendingOrders.length > 0 && (
          <div className={styles.actionCard}>
            <h3>{pendingOrders.length} orders awaiting processing</h3>
            {/* Order list with quick actions */}
          </div>
        )}
        
        {readyToShip.length > 0 && (
          <div className={styles.actionCard}>
            <h3>{readyToShip.length} orders ready to ship</h3>
            {/* Order list with tracking entry */}
          </div>
        )}
      </section>
    </div>
  );
}
```

### 7.2 Order Status Updates

**File:** `src/app/api/admin/orders/[id]/status/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { orders } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { sendShippingNotification, sendDeliveryConfirmation } from '@/lib/email';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { status, trackingNumber, trackingUrl } = await request.json();
    const orderId = params.id;
    
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
    });
    
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    
    const now = new Date();
    const updates: Partial<typeof orders.$inferInsert> = {
      status,
      updatedAt: now,
    };
    
    // Status-specific updates
    if (status === 'processing') {
      updates.roastedAt = now;
    } else if (status === 'shipped') {
      updates.shippedAt = now;
      updates.trackingNumber = trackingNumber;
      updates.trackingUrl = trackingUrl;
      
      // Send shipping notification email
      await sendShippingNotification(order, trackingNumber, trackingUrl, 'de');
    } else if (status === 'delivered') {
      updates.deliveredAt = now;
      
      // Send delivery confirmation email
      await sendDeliveryConfirmation(order, 'de');
    }
    
    await db.update(orders).set(updates).where(eq(orders.id, orderId));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Order status update error:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}
```

### 7.3 Product Management

**File:** `src/app/admin/(dashboard)/products/page.tsx`

Create admin page to:
- List all products with stock levels
- Add new products
- Edit existing products
- Toggle product active status
- Update stock quantities
- Manage variants

### 7.4 CSV Export

**File:** `src/app/api/admin/export/orders/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { orders, orderItems } from '@/db/schema';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  
  const allOrders = await db.query.orders.findMany({
    // Add date filters
    orderBy: (orders, { desc }) => [desc(orders.createdAt)],
  });
  
  // Generate CSV
  const headers = ['Order Number', 'Date', 'Customer', 'Email', 'Status', 'Total', 'Items'];
  const rows = allOrders.map(order => [
    order.orderNumber,
    new Date(order.createdAt).toISOString(),
    `${order.firstName} ${order.lastName}`,
    order.email,
    order.status,
    (order.total / 100).toFixed(2),
    // Add items
  ]);
  
  const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
  
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="orders-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  });
}
```

### 7.5 Settings Page

**File:** `src/app/admin/(dashboard)/settings/page.tsx`

Create settings page for:
- Shipping rates configuration
- Low stock thresholds
- Email notification preferences
- Store information (for invoices)

---

## 8. Customer Account Enhancements

**Priority:** 🟡 MEDIUM
**Estimated Time:** 1-2 days

### 8.1 Password Reset Flow

**File:** `src/app/api/auth/forgot-password/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { customers, passwordResetTokens } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { sendPasswordResetEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  const { email } = await request.json();
  
  const customer = await db.query.customers.findFirst({
    where: eq(customers.email, email.toLowerCase()),
  });
  
  // Always return success to prevent email enumeration
  if (!customer) {
    return NextResponse.json({ success: true });
  }
  
  // Generate reset token
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  
  await db.insert(passwordResetTokens).values({
    id: crypto.randomUUID(),
    customerId: customer.id,
    token,
    expiresAt,
    createdAt: new Date(),
  });
  
  await sendPasswordResetEmail(customer.email, token);
  
  return NextResponse.json({ success: true });
}
```

**File:** `src/app/api/auth/reset-password/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { customers, passwordResetTokens } from '@/db/schema';
import { eq, and, gt } from 'drizzle-orm';
import { hashPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const { token, password } = await request.json();
  
  const resetToken = await db.query.passwordResetTokens.findFirst({
    where: and(
      eq(passwordResetTokens.token, token),
      gt(passwordResetTokens.expiresAt, new Date())
    ),
  });
  
  if (!resetToken) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
  }
  
  const passwordHash = hashPassword(password);
  
  await db.update(customers)
    .set({ passwordHash, updatedAt: new Date() })
    .where(eq(customers.id, resetToken.customerId));
  
  // Delete used token
  await db.delete(passwordResetTokens)
    .where(eq(passwordResetTokens.id, resetToken.id));
  
  return NextResponse.json({ success: true });
}
```

### 8.2 Address Management

**File:** `src/app/[locale]/account/addresses/page.tsx`

Create page to:
- List saved addresses
- Add new address
- Edit existing address
- Delete address
- Set default shipping/billing address

### 8.3 Account Settings

**File:** `src/app/[locale]/account/settings/page.tsx`

Create page for:
- Update name
- Update phone
- Change password
- Marketing preferences
- Delete account

---

## 9. Missing Pages

**Priority:** 🟢 LOW-MEDIUM
**Estimated Time:** 1 day

### 9.1 Story Page

**File:** `src/app/[locale]/story/page.tsx`

Use content from BRAND_STORY.md to create:
- Full brand story
- Grandmother's legacy
- Transparent pricing section
- Farmer stories (placeholder for now)

### 9.2 FAQ Page

**File:** `src/app/[locale]/faq/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import styles from './faq.module.css';

interface FAQItem {
  question: string;
  answer: string;
}

export default function FAQPage() {
  const t = useTranslations('faq');
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  
  const faqs: FAQItem[] = [
    { question: t('q1'), answer: t('a1') },
    { question: t('q2'), answer: t('a2') },
    // Add more FAQs
  ];
  
  return (
    <main className={styles.main}>
      <h1>{t('title')}</h1>
      
      <div className={styles.faqList}>
        {faqs.map((faq, index) => (
          <div key={index} className={styles.faqItem}>
            <button
              className={styles.question}
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
            >
              {faq.question}
              <span>{openIndex === index ? '−' : '+'}</span>
            </button>
            {openIndex === index && (
              <div className={styles.answer}>{faq.answer}</div>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
```

### 9.3 Cookie Consent Banner

**File:** `src/components/layout/CookieBanner.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import styles from './CookieBanner.module.css';

export default function CookieBanner() {
  const t = useTranslations('cookies');
  const [show, setShow] = useState(false);
  
  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setShow(true);
    }
  }, []);
  
  const acceptAll = () => {
    localStorage.setItem('cookie-consent', JSON.stringify({
      necessary: true,
      analytics: true,
      marketing: true,
      accepted: new Date().toISOString(),
    }));
    setShow(false);
  };
  
  const acceptNecessary = () => {
    localStorage.setItem('cookie-consent', JSON.stringify({
      necessary: true,
      analytics: false,
      marketing: false,
      accepted: new Date().toISOString(),
    }));
    setShow(false);
  };
  
  if (!show) return null;
  
  return (
    <div className={styles.banner}>
      <div className={styles.content}>
        <p>{t('message')}</p>
        <div className={styles.buttons}>
          <button onClick={acceptNecessary} className={styles.secondary}>
            {t('necessaryOnly')}
          </button>
          <button onClick={acceptAll} className={styles.primary}>
            {t('acceptAll')}
          </button>
        </div>
      </div>
    </div>
  );
}
```

Add translations to `src/i18n/messages/de/common.json` and `src/i18n/messages/en/common.json`.

---

## 10. SEO & Performance

**Priority:** 🟢 LOW
**Estimated Time:** 1 day

### 10.1 Metadata Configuration

**File:** `src/app/[locale]/layout.tsx`

```typescript
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const brand = process.env.NEXT_PUBLIC_BRAND || 'coffee';
  const locale = params.locale;
  
  const titles = {
    coffee: {
      de: 'Marie Lou Coffee | Frisch gerösteter Kaffee direkt vom Bauern',
      en: 'Marie Lou Coffee | Freshly Roasted Coffee Direct from Farmers',
    },
    tea: {
      de: 'Marie Lou Tea | Premium Tee mit Herkunftsgarantie',
      en: 'Marie Lou Tea | Premium Tea with Origin Guarantee',
    },
  };
  
  return {
    title: {
      default: titles[brand][locale],
      template: `%s | Marie Lou ${brand === 'coffee' ? 'Coffee' : 'Tea'}`,
    },
    description: locale === 'de' 
      ? 'Ethisch bezogener Kaffee, frisch geröstet nach Bestellung. Wir zahlen Bauern 3-4x Marktpreis.'
      : 'Ethically sourced coffee, freshly roasted to order. We pay farmers 3-4x market price.',
    openGraph: {
      type: 'website',
      locale: locale === 'de' ? 'de_DE' : 'en_US',
      siteName: `Marie Lou ${brand === 'coffee' ? 'Coffee' : 'Tea'}`,
    },
  };
}
```

### 10.2 Sitemap Generation

**File:** `src/app/sitemap.ts`

```typescript
import { MetadataRoute } from 'next';
import { allProducts } from '@/config/products';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://marieloucoffee.com';
  const brand = process.env.NEXT_PUBLIC_BRAND || 'coffee';
  
  const staticPages = [
    '',
    '/shop',
    '/story',
    '/faq',
    '/legal/impressum',
    '/legal/agb',
    '/legal/datenschutz',
    '/legal/widerruf',
  ];
  
  const products = allProducts.filter(p => p.brand === brand);
  
  const urls: MetadataRoute.Sitemap = [];
  
  // Add static pages for both locales
  for (const locale of ['de', 'en']) {
    for (const page of staticPages) {
      urls.push({
        url: `${baseUrl}/${locale}${page}`,
        lastModified: new Date(),
        changeFrequency: page === '' ? 'daily' : 'weekly',
        priority: page === '' ? 1 : 0.8,
      });
    }
    
    // Add product pages
    for (const product of products) {
      urls.push({
        url: `${baseUrl}/${locale}/shop/${product.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.9,
      });
    }
  }
  
  return urls;
}
```

### 10.3 Robots.txt

**File:** `src/app/robots.ts`

```typescript
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://marieloucoffee.com';
  
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/', '/account/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
```

---

## 11. Inventory Management

**Priority:** 🟢 LOW
**Estimated Time:** 1 day

### 11.1 Update Product Schema

Products should have stock tracking. Either:

**Option A:** Use database products table (recommended for dynamic management)

```typescript
// Already exists in schema, ensure stockQuantity is used
export const products = sqliteTable('products', {
  // ... existing fields
  stockQuantity: integer('stock_quantity').default(0),
  lowStockThreshold: integer('low_stock_threshold').default(10),
  trackInventory: integer('track_inventory', { mode: 'boolean' }).default(true),
});
```

**Option B:** Add stock to product config

```typescript
// src/config/products/index.ts
export interface Product {
  // ... existing fields
  stockQuantity: number;
  lowStockThreshold: number;
  trackInventory: boolean;
}
```

### 11.2 Stock Deduction on Order

Update `src/app/api/webhook/stripe/route.ts`:

```typescript
// After creating order items, deduct stock
for (const item of cartItems) {
  if (item.trackInventory) {
    await db.update(products)
      .set({ 
        stockQuantity: sql`${products.stockQuantity} - ${item.quantity}` 
      })
      .where(eq(products.id, item.productId));
  }
}
```

### 11.3 Stock Check Before Checkout

Update checkout API to verify stock availability before creating Stripe session.

---

## 12. Environment Variables

### 12.1 Required for Production

```bash
# Core
NEXT_PUBLIC_BRAND=coffee
NEXT_PUBLIC_BASE_URL=https://marieloucoffee.com

# Database (Turso recommended for production)
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-token

# Or for development
DATABASE_PATH=./data/marie-lou.db

# Stripe
STRIPE_SECRET_KEY=sk_live_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Email
RESEND_API_KEY=re_xxx

# Invoice
RECHNUNGS_API_KEY=xxx
RECHNUNGS_API_URL=https://api.rechnungs-api.de

# Admin
ADMIN_EMAIL=marcel@marielou.de
ADMIN_PASSWORD=secure-password

# Cron
CRON_SECRET=your-cron-secret
```

### 12.2 Vercel Environment Setup

1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Add all variables above
3. For multi-domain setup:
   - Add `NEXT_PUBLIC_BRAND=coffee` for marieloucoffee.com
   - Add `NEXT_PUBLIC_BRAND=tea` for marieloutea.com (create separate project or use domain-based config)

---

## Implementation Checklist

### Phase 1: Critical Path (Week 1)
- [ ] Email system setup (Resend + templates)
- [ ] vercel.json configuration
- [ ] Environment variables documentation
- [ ] Database migration to Turso (or persistent solution)
- [ ] Test deployment to Vercel

### Phase 2: Core Features (Week 2)
- [ ] Cron jobs implementation
- [ ] Admin dashboard overview
- [ ] Order status workflow
- [ ] Email notifications integration

### Phase 3: Customer Features (Week 3)
- [ ] Reviews system
- [ ] Password reset flow
- [ ] Account settings page
- [ ] Cookie consent banner

### Phase 4: Advanced Features (Week 4)
- [ ] Gift cards system
- [ ] Subscription system (basic)
- [ ] Story page
- [ ] FAQ page

### Phase 5: Polish (Week 5)
- [ ] SEO optimization
- [ ] Performance audit
- [ ] Accessibility review
- [ ] Final testing
- [ ] Production launch

---

## Notes for Implementation

1. **Test Incrementally**: After each feature, test thoroughly before moving on
2. **Mobile First**: All new UI should be mobile-responsive
3. **i18n**: All new text must have DE and EN translations
4. **Error Handling**: All API routes need proper error handling
5. **Logging**: Add console.log for debugging, can add proper logging later
6. **Security**: Validate all inputs, sanitize outputs, check auth on protected routes

---

*Last Updated: January 2026*
*Version: 1.0*