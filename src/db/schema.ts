import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

// ============================================================================
// Products Tables (Database-driven product management)
// ============================================================================

export const products = sqliteTable('products', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  brand: text('brand').notNull(), // 'coffee' | 'tea'
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  // Localized fields stored as JSON
  nameEn: text('name_en').notNull(),
  nameDe: text('name_de').notNull(),
  originEn: text('origin_en'),
  originDe: text('origin_de'),
  notesEn: text('notes_en'),
  notesDe: text('notes_de'),
  descriptionEn: text('description_en'),
  descriptionDe: text('description_de'),
  // Pricing
  basePrice: integer('base_price').notNull(), // in cents
  currency: text('currency').notNull().default('EUR'),
  // Stock
  stockQuantity: integer('stock_quantity').default(0),
  lowStockThreshold: integer('low_stock_threshold').default(10),
  trackInventory: integer('track_inventory', { mode: 'boolean' }).default(true),
  // Media
  image: text('image'),
  // Display
  badge: text('badge'), // 'bestseller' | 'new' | 'sale' | null
  sortOrder: integer('sort_order').default(0),
  // Attributes stored as JSON
  attributes: text('attributes'), // JSON string for type-specific attributes
  // Reviews
  averageRating: real('average_rating').default(0),
  reviewCount: integer('review_count').default(0),
  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const productVariants = sqliteTable('product_variants', {
  id: text('id').primaryKey(),
  productId: text('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  // Localized names
  nameEn: text('name_en').notNull(),
  nameDe: text('name_de').notNull(),
  // Pricing
  priceModifier: integer('price_modifier').notNull().default(0), // in cents, added to base price
  // Stock (optional per-variant tracking)
  sku: text('sku'),
  stockQuantity: integer('stock_quantity'),
  // Display
  sortOrder: integer('sort_order').default(0),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  // Variant-specific attributes (e.g., weight for coffee)
  weight: text('weight'), // e.g., "250g"
  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// Product Relations
export const productsRelations = relations(products, ({ many }) => ({
  variants: many(productVariants),
}));

export const productVariantsRelations = relations(productVariants, ({ one }) => ({
  product: one(products, {
    fields: [productVariants.productId],
    references: [products.id],
  }),
}));

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
  // Referral abuse prevention - admin can override automatic flagging
  referralTrusted: integer('referral_trusted', { mode: 'boolean' }).default(false), // If true, bypass abuse checks
  referralSuspended: integer('referral_suspended', { mode: 'boolean' }).default(false), // If true, never give rewards
  referralNotes: text('referral_notes'), // Admin notes about this referrer
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
  // Refund Invoice (Credit Note / Gutschrift)
  refundInvoiceNumber: text('refund_invoice_number'),
  refundInvoiceId: text('refund_invoice_id'),
  refundInvoiceGeneratedAt: integer('refund_invoice_generated_at', { mode: 'timestamp' }),
  // Notes
  customerNotes: text('customer_notes'),
  internalNotes: text('internal_notes'),
  // Review request tracking
  reviewRequestSentAt: integer('review_request_sent_at', { mode: 'timestamp' }),
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

// Relations
export const ordersRelations = relations(orders, ({ many }) => ({
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
}));

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
  REVOKED: 'revoked',
} as const;

// Refund request status constants
export const REFUND_REQUEST_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  DENIED: 'denied',
  PROCESSED: 'processed',
} as const;

// ============================================================================
// Refund Requests Table
// ============================================================================

export const refundRequests = sqliteTable('refund_requests', {
  id: text('id').primaryKey(),
  orderId: text('order_id').notNull().references(() => orders.id),
  customerId: text('customer_id').notNull().references(() => customers.id),
  // Request details
  reason: text('reason').notNull(),
  reasonDetails: text('reason_details'),
  // Amount (in cents) - can be partial refund
  requestedAmount: integer('requested_amount').notNull(),
  approvedAmount: integer('approved_amount'),
  // Status
  status: text('status').notNull().default('pending'), // 'pending' | 'approved' | 'denied' | 'processed'
  // Admin response
  adminNotes: text('admin_notes'),
  processedBy: text('processed_by'), // Admin who processed the request
  // Stripe
  stripeRefundId: text('stripe_refund_id'),
  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  reviewedAt: integer('reviewed_at', { mode: 'timestamp' }),
  processedAt: integer('processed_at', { mode: 'timestamp' }),
});

export type RefundRequest = typeof refundRequests.$inferSelect;
export type NewRefundRequest = typeof refundRequests.$inferInsert;

// ============================================================================
// Reviews Tables
// ============================================================================

export const reviews = sqliteTable('reviews', {
  id: text('id').primaryKey(),
  productSlug: text('product_slug').notNull(),
  orderId: text('order_id').references(() => orders.id),
  customerId: text('customer_id').references(() => customers.id),
  
  // Review content
  rating: integer('rating').notNull(), // 1-5
  title: text('title'),
  content: text('content'),
  
  // Display info
  customerName: text('customer_name').notNull(), // Display name
  verifiedPurchase: integer('verified_purchase', { mode: 'boolean' }).default(false),
  
  // Status
  status: text('status').notNull().default('pending'), // 'pending' | 'approved' | 'rejected'
  
  // Admin response
  adminResponse: text('admin_response'),
  adminRespondedAt: integer('admin_responded_at', { mode: 'timestamp' }),
  
  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  approvedAt: integer('approved_at', { mode: 'timestamp' }),
});

export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;

// Review status constants
export const REVIEW_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

// ============================================================================
// Password Reset Tokens Table
// ============================================================================

export const passwordResetTokens = sqliteTable('password_reset_tokens', {
  id: text('id').primaryKey(),
  customerId: text('customer_id').notNull().references(() => customers.id),
  token: text('token').notNull().unique(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  usedAt: integer('used_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type NewPasswordResetToken = typeof passwordResetTokens.$inferInsert;

// ============================================================================
// Gift Cards Tables
// ============================================================================

export const giftCards = sqliteTable('gift_cards', {
  id: text('id').primaryKey(),
  code: text('code').notNull().unique(), // GIFT-XXXX-XXXX format
  
  // Amount tracking
  initialAmount: integer('initial_amount').notNull(), // Original value in cents
  currentBalance: integer('current_balance').notNull(), // Remaining balance in cents
  currency: text('currency').notNull().default('EUR'),
  
  // Purchase info
  purchasedByEmail: text('purchased_by_email').notNull(),
  purchasedByCustomerId: text('purchased_by_customer_id').references(() => customers.id),
  orderId: text('order_id').references(() => orders.id),
  
  // Recipient info
  recipientEmail: text('recipient_email'),
  recipientName: text('recipient_name'),
  personalMessage: text('personal_message'),
  
  // Delivery
  deliveryMethod: text('delivery_method').notNull().default('email'), // 'email' | 'download'
  sentAt: integer('sent_at', { mode: 'timestamp' }),
  
  // Status
  status: text('status').notNull().default('active'), // 'pending' | 'active' | 'used' | 'expired' | 'disabled'
  
  // Validity
  expiresAt: integer('expires_at', { mode: 'timestamp' }), // null = never expires
  
  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// Tracks every time a gift card is used
export const giftCardTransactions = sqliteTable('gift_card_transactions', {
  id: text('id').primaryKey(),
  giftCardId: text('gift_card_id').notNull().references(() => giftCards.id),
  orderId: text('order_id').references(() => orders.id),
  
  // Amount details
  amount: integer('amount').notNull(), // Amount used in this transaction (cents)
  balanceBefore: integer('balance_before').notNull(),
  balanceAfter: integer('balance_after').notNull(),
  
  // Type
  type: text('type').notNull().default('redemption'), // 'redemption' | 'refund'
  
  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export type GiftCard = typeof giftCards.$inferSelect;
export type NewGiftCard = typeof giftCards.$inferInsert;

export type GiftCardTransaction = typeof giftCardTransactions.$inferSelect;
export type NewGiftCardTransaction = typeof giftCardTransactions.$inferInsert;

// Gift card status constants
export const GIFT_CARD_STATUS = {
  PENDING: 'pending', // Created but payment not confirmed
  ACTIVE: 'active',   // Ready to use
  USED: 'used',       // Balance is 0
  EXPIRED: 'expired', // Past expiry date
  DISABLED: 'disabled', // Manually disabled by admin
} as const;

// ============================================================================
// Subscriptions Tables
// ============================================================================

export const subscriptions = sqliteTable('subscriptions', {
  id: text('id').primaryKey(),
  customerId: text('customer_id').notNull().references(() => customers.id),
  
  // Stripe subscription info
  stripeSubscriptionId: text('stripe_subscription_id').unique(),
  stripePriceId: text('stripe_price_id'),
  stripeCustomerId: text('stripe_customer_id'),
  
  // Subscription details
  productId: text('product_id').notNull(),
  variantId: text('variant_id').notNull(),
  productName: text('product_name').notNull(),
  variantName: text('variant_name').notNull(),
  
  // Frequency
  intervalCount: integer('interval_count').notNull().default(4), // Default every 4 weeks
  intervalUnit: text('interval_unit').notNull().default('week'), // 'week' | 'month'
  
  // Pricing
  unitPrice: integer('unit_price').notNull(), // Price per delivery in cents
  quantity: integer('quantity').notNull().default(1),
  
  // Shipping address
  shippingFirstName: text('shipping_first_name').notNull(),
  shippingLastName: text('shipping_last_name').notNull(),
  shippingLine1: text('shipping_line1').notNull(),
  shippingLine2: text('shipping_line2'),
  shippingCity: text('shipping_city').notNull(),
  shippingPostalCode: text('shipping_postal_code').notNull(),
  shippingCountry: text('shipping_country').notNull(),
  
  // Status
  status: text('status').notNull().default('active'), // 'active' | 'paused' | 'cancelled' | 'past_due'
  
  // Next delivery
  nextDeliveryAt: integer('next_delivery_at', { mode: 'timestamp' }),
  
  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  cancelledAt: integer('cancelled_at', { mode: 'timestamp' }),
  pausedAt: integer('paused_at', { mode: 'timestamp' }),
  pauseUntil: integer('pause_until', { mode: 'timestamp' }),
});

// Subscription order history
export const subscriptionOrders = sqliteTable('subscription_orders', {
  id: text('id').primaryKey(),
  subscriptionId: text('subscription_id').notNull().references(() => subscriptions.id),
  orderId: text('order_id').references(() => orders.id),
  
  // Status
  status: text('status').notNull().default('pending'), // 'pending' | 'paid' | 'shipped' | 'delivered' | 'failed'
  
  // Timestamps
  scheduledFor: integer('scheduled_for', { mode: 'timestamp' }).notNull(),
  paidAt: integer('paid_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;

export type SubscriptionOrder = typeof subscriptionOrders.$inferSelect;
export type NewSubscriptionOrder = typeof subscriptionOrders.$inferInsert;

// Product types
export type DbProduct = typeof products.$inferSelect;
export type NewDbProduct = typeof products.$inferInsert;
export type DbProductVariant = typeof productVariants.$inferSelect;
export type NewDbProductVariant = typeof productVariants.$inferInsert;

// Subscription status constants
export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  PAUSED: 'paused',
  CANCELLED: 'cancelled',
  PAST_DUE: 'past_due',
} as const;

