import { db } from '@/db';
import { subscriptions, subscriptionOrders, customers } from '@/db/schema';
import { eq, and, lt } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { getProductById } from '@/config/products';

// Subscription intervals
export const SUBSCRIPTION_INTERVALS = [
  { value: 2, unit: 'week', label: { de: 'Alle 2 Wochen', en: 'Every 2 weeks' } },
  { value: 4, unit: 'week', label: { de: 'Alle 4 Wochen', en: 'Every 4 weeks' } },
  { value: 6, unit: 'week', label: { de: 'Alle 6 Wochen', en: 'Every 6 weeks' } },
  { value: 8, unit: 'week', label: { de: 'Alle 8 Wochen', en: 'Every 8 weeks' } },
];

// Subscription discount (10% off for subscribers)
export const SUBSCRIPTION_DISCOUNT_PERCENT = 10;

export function calculateSubscriptionPrice(basePrice: number): number {
  return Math.round(basePrice * (1 - SUBSCRIPTION_DISCOUNT_PERCENT / 100));
}

// Create a subscription
export async function createSubscription(data: {
  customerId: string;
  productId: string;
  variantId: string;
  quantity: number;
  intervalCount: number;
  intervalUnit: 'week' | 'month';
  shippingAddress: {
    firstName: string;
    lastName: string;
    line1: string;
    line2?: string;
    city: string;
    postalCode: string;
    country: string;
  };
}) {
  const product = getProductById(data.productId);
  if (!product) {
    throw new Error('Product not found');
  }

  const variant = product.variants.find(v => v.id === data.variantId);
  if (!variant) {
    throw new Error('Variant not found');
  }

  const unitPrice = calculateSubscriptionPrice(product.basePrice + variant.priceModifier);
  
  // Calculate next delivery date
  const nextDeliveryAt = new Date();
  if (data.intervalUnit === 'week') {
    nextDeliveryAt.setDate(nextDeliveryAt.getDate() + (data.intervalCount * 7));
  } else {
    nextDeliveryAt.setMonth(nextDeliveryAt.getMonth() + data.intervalCount);
  }

  const id = nanoid();
  const now = new Date();

  await db.insert(subscriptions).values({
    id,
    customerId: data.customerId,
    productId: data.productId,
    variantId: data.variantId,
    productName: product.name.de,
    variantName: variant.name.de,
    intervalCount: data.intervalCount,
    intervalUnit: data.intervalUnit,
    unitPrice,
    quantity: data.quantity,
    shippingFirstName: data.shippingAddress.firstName,
    shippingLastName: data.shippingAddress.lastName,
    shippingLine1: data.shippingAddress.line1,
    shippingLine2: data.shippingAddress.line2 || null,
    shippingCity: data.shippingAddress.city,
    shippingPostalCode: data.shippingAddress.postalCode,
    shippingCountry: data.shippingAddress.country,
    status: 'active',
    nextDeliveryAt,
    createdAt: now,
    updatedAt: now,
  });

  return id;
}

// Get customer subscriptions
export async function getCustomerSubscriptions(customerId: string) {
  return db.select()
    .from(subscriptions)
    .where(eq(subscriptions.customerId, customerId));
}

// Get subscription by ID
export async function getSubscription(subscriptionId: string) {
  const result = await db.select()
    .from(subscriptions)
    .where(eq(subscriptions.id, subscriptionId))
    .limit(1);
  
  return result[0] || null;
}

// Pause a subscription
export async function pauseSubscription(subscriptionId: string, pauseUntil?: Date) {
  const now = new Date();
  
  await db.update(subscriptions)
    .set({
      status: 'paused',
      pausedAt: now,
      pauseUntil: pauseUntil || null,
      updatedAt: now,
    })
    .where(eq(subscriptions.id, subscriptionId));
}

// Resume a subscription
export async function resumeSubscription(subscriptionId: string) {
  const subscription = await getSubscription(subscriptionId);
  if (!subscription) {
    throw new Error('Subscription not found');
  }

  const now = new Date();
  
  // Calculate new next delivery date
  const nextDeliveryAt = new Date();
  if (subscription.intervalUnit === 'week') {
    nextDeliveryAt.setDate(nextDeliveryAt.getDate() + (subscription.intervalCount * 7));
  } else {
    nextDeliveryAt.setMonth(nextDeliveryAt.getMonth() + subscription.intervalCount);
  }

  await db.update(subscriptions)
    .set({
      status: 'active',
      pausedAt: null,
      pauseUntil: null,
      nextDeliveryAt,
      updatedAt: now,
    })
    .where(eq(subscriptions.id, subscriptionId));
}

// Cancel a subscription
export async function cancelSubscription(subscriptionId: string) {
  const now = new Date();
  
  await db.update(subscriptions)
    .set({
      status: 'cancelled',
      cancelledAt: now,
      updatedAt: now,
    })
    .where(eq(subscriptions.id, subscriptionId));
}

// Update subscription product/variant
export async function updateSubscriptionProduct(
  subscriptionId: string,
  productId: string,
  variantId: string,
  quantity?: number
) {
  const product = getProductById(productId);
  if (!product) {
    throw new Error('Product not found');
  }

  const variant = product.variants.find(v => v.id === variantId);
  if (!variant) {
    throw new Error('Variant not found');
  }

  const unitPrice = calculateSubscriptionPrice(product.basePrice + variant.priceModifier);

  await db.update(subscriptions)
    .set({
      productId,
      variantId,
      productName: product.name.de,
      variantName: variant.name.de,
      unitPrice,
      ...(quantity !== undefined && { quantity }),
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.id, subscriptionId));
}

// Update subscription interval
export async function updateSubscriptionInterval(
  subscriptionId: string,
  intervalCount: number,
  intervalUnit: 'week' | 'month'
) {
  await db.update(subscriptions)
    .set({
      intervalCount,
      intervalUnit,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.id, subscriptionId));
}

// Update subscription shipping address
export async function updateSubscriptionAddress(
  subscriptionId: string,
  shippingAddress: {
    firstName: string;
    lastName: string;
    line1: string;
    line2?: string;
    city: string;
    postalCode: string;
    country: string;
  }
) {
  await db.update(subscriptions)
    .set({
      shippingFirstName: shippingAddress.firstName,
      shippingLastName: shippingAddress.lastName,
      shippingLine1: shippingAddress.line1,
      shippingLine2: shippingAddress.line2 || null,
      shippingCity: shippingAddress.city,
      shippingPostalCode: shippingAddress.postalCode,
      shippingCountry: shippingAddress.country,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.id, subscriptionId));
}

// Get subscriptions due for delivery (for cron job)
export async function getSubscriptionsDueForDelivery() {
  const now = new Date();
  
  return db.select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.status, 'active'),
        lt(subscriptions.nextDeliveryAt, now)
      )
    );
}

// Process a subscription order
export async function processSubscriptionOrder(subscriptionId: string) {
  const subscription = await getSubscription(subscriptionId);
  if (!subscription) {
    throw new Error('Subscription not found');
  }

  // Create subscription order record
  const subscriptionOrderId = nanoid();
  const now = new Date();

  await db.insert(subscriptionOrders).values({
    id: subscriptionOrderId,
    subscriptionId,
    status: 'pending',
    scheduledFor: now,
    createdAt: now,
  });

  // Calculate next delivery date
  const nextDeliveryAt = new Date();
  if (subscription.intervalUnit === 'week') {
    nextDeliveryAt.setDate(nextDeliveryAt.getDate() + (subscription.intervalCount * 7));
  } else {
    nextDeliveryAt.setMonth(nextDeliveryAt.getMonth() + subscription.intervalCount);
  }

  // Update subscription with new next delivery date
  await db.update(subscriptions)
    .set({
      nextDeliveryAt,
      updatedAt: now,
    })
    .where(eq(subscriptions.id, subscriptionId));

  return subscriptionOrderId;
}

// Get subscription order history
export async function getSubscriptionOrders(subscriptionId: string) {
  return db.select()
    .from(subscriptionOrders)
    .where(eq(subscriptionOrders.subscriptionId, subscriptionId));
}

// Admin: Get all active subscriptions
export async function getAllActiveSubscriptions() {
  return db.select()
    .from(subscriptions)
    .where(eq(subscriptions.status, 'active'));
}

// Admin: Get all subscriptions
export async function getAllSubscriptions() {
  return db.select({
    subscription: subscriptions,
    customer: customers,
  })
    .from(subscriptions)
    .leftJoin(customers, eq(subscriptions.customerId, customers.id));
}
