import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// ============================================================================
// Existing Tables
// ============================================================================

export const customers = sqliteTable('customers', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'), // Optional - only set when customer creates account
  firstName: text('first_name'),
  lastName: text('last_name'),
  phone: text('phone'),
  stripeCustomerId: text('stripe_customer_id'),
  marketingOptIn: integer('marketing_opt_in', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const orders = sqliteTable('orders', {
  id: text('id').primaryKey(),
  orderNumber: text('order_number').notNull().unique(),
  customerId: text('customer_id').references(() => customers.id),
  brand: text('brand').notNull(),
  email: text('email').notNull(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  phone: text('phone'),
  status: text('status').notNull().default('pending'),
  // Shipping address
  shippingFirstName: text('shipping_first_name').notNull(),
  shippingLastName: text('shipping_last_name').notNull(),
  shippingCompany: text('shipping_company'),
  shippingLine1: text('shipping_line1').notNull(),
  shippingLine2: text('shipping_line2'),
  shippingCity: text('shipping_city').notNull(),
  shippingState: text('shipping_state'),
  shippingPostalCode: text('shipping_postal_code').notNull(),
  shippingCountry: text('shipping_country').notNull(),
  // Billing address
  billingFirstName: text('billing_first_name'),
  billingLastName: text('billing_last_name'),
  billingCompany: text('billing_company'),
  billingLine1: text('billing_line1'),
  billingLine2: text('billing_line2'),
  billingCity: text('billing_city'),
  billingState: text('billing_state'),
  billingPostalCode: text('billing_postal_code'),
  billingCountry: text('billing_country'),
  // Pricing
  shippingMethod: text('shipping_method').notNull(),
  shippingCost: integer('shipping_cost').notNull(),
  subtotal: integer('subtotal').notNull(),
  tax: integer('tax').notNull().default(0),
  discount: integer('discount').notNull().default(0),
  total: integer('total').notNull(),
  currency: text('currency').notNull().default('EUR'),
  // Payment
  stripePaymentIntentId: text('stripe_payment_intent_id'),
  stripeSessionId: text('stripe_session_id').unique(),
  paymentStatus: text('payment_status').notNull().default('pending'),
  paidAt: integer('paid_at', { mode: 'timestamp' }),
  // Fulfillment
  roastedAt: integer('roasted_at', { mode: 'timestamp' }),
  shippedAt: integer('shipped_at', { mode: 'timestamp' }),
  deliveredAt: integer('delivered_at', { mode: 'timestamp' }),
  trackingNumber: text('tracking_number'),
  trackingUrl: text('tracking_url'),
  // Invoice
  invoiceNumber: text('invoice_number'),
  invoiceId: text('invoice_id'), // External invoice ID from rechnungs-api
  invoiceGeneratedAt: integer('invoice_generated_at', { mode: 'timestamp' }),
  // Notes
  customerNotes: text('customer_notes'),
  internalNotes: text('internal_notes'),
  // Referral tracking
  referralCodeUsed: text('referral_code_used'),
  referralDiscount: integer('referral_discount').default(0),
  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const orderItems = sqliteTable('order_items', {
  id: text('id').primaryKey(),
  orderId: text('order_id').notNull().references(() => orders.id),
  productId: text('product_id').notNull(),
  variantId: text('variant_id').notNull(),
  productName: text('product_name').notNull(),
  variantName: text('variant_name').notNull(),
  productSlug: text('product_slug').notNull(),
  quantity: integer('quantity').notNull(),
  unitPrice: integer('unit_price').notNull(),
  totalPrice: integer('total_price').notNull(),
  weight: text('weight').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const addresses = sqliteTable('addresses', {
  id: text('id').primaryKey(),
  customerId: text('customer_id').notNull().references(() => customers.id),
  type: text('type').notNull(), // 'shipping' | 'billing'
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  company: text('company'),
  line1: text('line1').notNull(),
  line2: text('line2'),
  city: text('city').notNull(),
  state: text('state'),
  postalCode: text('postal_code').notNull(),
  country: text('country').notNull(),
  isDefault: integer('is_default', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const newsletters = sqliteTable('newsletters', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  brand: text('brand').notNull(),
  status: text('status').notNull().default('active'),
  subscribedAt: integer('subscribed_at', { mode: 'timestamp' }).notNull(),
  unsubscribedAt: integer('unsubscribed_at', { mode: 'timestamp' }),
});

export const contactSubmissions = sqliteTable('contact_submissions', {
  id: text('id').primaryKey(),
  brand: text('brand').notNull(),
  email: text('email').notNull(),
  name: text('name').notNull(),
  subject: text('subject'),
  message: text('message').notNull(),
  status: text('status').notNull().default('new'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// Sessions table for persistent authentication
export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(), // The session token
  customerId: text('customer_id').notNull().references(() => customers.id),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// ============================================================================
// Referral Program Tables
// ============================================================================

// Referral codes - one per customer
export const referralCodes = sqliteTable('referral_codes', {
  id: text('id').primaryKey(),
  customerId: text('customer_id').notNull().references(() => customers.id),
  code: text('code').notNull().unique(), // MARIE-XXXXX format
  // Stats
  timesUsed: integer('times_used').notNull().default(0),
  totalRewardsEarned: integer('total_rewards_earned').notNull().default(0),
  // Status
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// Referral tracking - tracks each referral relationship
export const referrals = sqliteTable('referrals', {
  id: text('id').primaryKey(),
  referrerCodeId: text('referrer_code_id').notNull().references(() => referralCodes.id),
  referrerId: text('referrer_id').notNull().references(() => customers.id),
  referredId: text('referred_id').references(() => customers.id),
  referredEmail: text('referred_email').notNull(),
  // Status: pending -> qualified -> rewarded (or revoked)
  status: text('status').notNull().default('pending'), // 'pending' | 'qualified' | 'rewarded' | 'revoked'
  // The qualifying order
  qualifyingOrderId: text('qualifying_order_id').references(() => orders.id),
  // Reward tracking
  rewardId: text('reward_id').references(() => referralRewards.id),
  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  qualifiedAt: integer('qualified_at', { mode: 'timestamp' }),
  rewardedAt: integer('rewarded_at', { mode: 'timestamp' }),
  revokedAt: integer('revoked_at', { mode: 'timestamp' }),
  revokeReason: text('revoke_reason'),
});

// Referral rewards - the free bags earned by referrers
export const referralRewards = sqliteTable('referral_rewards', {
  id: text('id').primaryKey(),
  customerId: text('customer_id').notNull().references(() => customers.id),
  referralId: text('referral_id').notNull(),
  // The reward product
  productId: text('product_id').notNull(),
  productName: text('product_name').notNull(),
  productSlug: text('product_slug').notNull(),
  variantId: text('variant_id').notNull(),
  variantName: text('variant_name').notNull(),
  // Status: pending -> claimed/shipped
  status: text('status').notNull().default('pending'), // 'pending' | 'claimed' | 'shipped'
  // How it was redeemed
  claimedOrderId: text('claimed_order_id').references(() => orders.id),
  shippedSeparately: integer('shipped_separately', { mode: 'boolean' }).default(false),
  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  claimedAt: integer('claimed_at', { mode: 'timestamp' }),
  expiresAt: integer('expires_at', { mode: 'timestamp' }),
});

// ============================================================================
// Type Exports
// ============================================================================

export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;

export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;

export type Address = typeof addresses.$inferSelect;
export type NewAddress = typeof addresses.$inferInsert;

export type Newsletter = typeof newsletters.$inferSelect;
export type NewNewsletter = typeof newsletters.$inferInsert;

export type ContactSubmission = typeof contactSubmissions.$inferSelect;
export type NewContactSubmission = typeof contactSubmissions.$inferInsert;

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

export type ReferralCode = typeof referralCodes.$inferSelect;
export type NewReferralCode = typeof referralCodes.$inferInsert;

export type Referral = typeof referrals.$inferSelect;
export type NewReferral = typeof referrals.$inferInsert;

export type ReferralReward = typeof referralRewards.$inferSelect;
export type NewReferralReward = typeof referralRewards.$inferInsert;

// Status constants
export const REFERRAL_STATUS = {
  PENDING: 'pending',
  QUALIFIED: 'qualified',
  REWARDED: 'rewarded',
  REVOKED: 'revoked',
} as const;

export const REWARD_STATUS = {
  PENDING: 'pending',
  CLAIMED: 'claimed',
  SHIPPED: 'shipped',
} as const;
