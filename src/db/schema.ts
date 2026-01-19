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
  // B2B promo tracking (employee cross-sell)
  b2bPromoCode: text('b2b_promo_code'),
  b2bPromoDiscount: integer('b2b_promo_discount').default(0),
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

// Review Requests Table (for email-based review solicitation)
export const reviewRequests = sqliteTable('review_requests', {
  id: text('id').primaryKey(),
  orderId: text('order_id').notNull().references(() => orders.id),
  orderItemId: text('order_item_id').notNull(),
  customerId: text('customer_id').notNull().references(() => customers.id),
  productId: text('product_id').notNull(),
  
  // Token for secure access
  token: text('token').notNull().unique(),
  
  // Status
  emailSentAt: integer('email_sent_at', { mode: 'timestamp' }),
  reviewedAt: integer('reviewed_at', { mode: 'timestamp' }),
  reviewId: text('review_id').references(() => reviews.id),
  
  // Reward
  rewardCode: text('reward_code'),
  rewardClaimedAt: integer('reward_claimed_at', { mode: 'timestamp' }),
  
  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
});

export type ReviewRequest = typeof reviewRequests.$inferSelect;
export type NewReviewRequest = typeof reviewRequests.$inferInsert;

// Review reward amount in cents (€2.50 discount for each review)
export const REVIEW_REWARD_AMOUNT = 250;

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

// ============================================================================
// B2B Program Tables
// ============================================================================

// B2B Companies - the core company record
export const b2bCompanies = sqliteTable('b2b_companies', {
  id: text('id').primaryKey(),
  
  // Company information
  companyName: text('company_name').notNull(),
  vatId: text('vat_id'), // e.g., DE123456789
  industry: text('industry'), // 'tech', 'agency', 'professional', 'other'
  
  // Contact person
  contactFirstName: text('contact_first_name').notNull(),
  contactLastName: text('contact_last_name').notNull(),
  contactEmail: text('contact_email').notNull().unique(),
  contactPhone: text('contact_phone'),
  
  // Authentication (separate from D2C customers)
  passwordHash: text('password_hash'),
  
  // Tier and pricing
  tier: text('tier').notNull().default('flex'), // 'flex' | 'smart_starter' | 'smart_growth' | 'smart_scale' | 'smart_enterprise'
  employeeCount: integer('employee_count'),
  monthlyRatePerEmployee: integer('monthly_rate_per_employee'), // in cents (Smart tier only)
  
  // Volume discount tier for Flex (calculated based on order history)
  flexDiscountTier: text('flex_discount_tier').default('none'), // 'none' | '5kg' | '10kg' | '25kg' | '50kg'
  
  // Status workflow
  status: text('status').notNull().default('inquiry'), // 'inquiry' | 'pending' | 'active' | 'paused' | 'cancelled'
  
  // Promo code for employee cross-sell (e.g., MLOU-ACME)
  promoCode: text('promo_code').unique(),
  promoDiscountPercent: integer('promo_discount_percent').default(10), // Default 10% off
  
  // Stripe integration (Smart tier)
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  
  // Payment terms (Flex tier)
  paymentTermsDays: integer('payment_terms_days').default(0), // 0 = due on order, 14, 30
  
  // Addresses
  billingLine1: text('billing_line1'),
  billingLine2: text('billing_line2'),
  billingCity: text('billing_city'),
  billingPostalCode: text('billing_postal_code'),
  billingCountry: text('billing_country').default('DE'),
  
  shippingLine1: text('shipping_line1'),
  shippingLine2: text('shipping_line2'),
  shippingCity: text('shipping_city'),
  shippingPostalCode: text('shipping_postal_code'),
  shippingCountry: text('shipping_country').default('DE'),
  
  // Preferences
  preferredProducts: text('preferred_products'), // JSON array of product IDs
  preferredBrand: text('preferred_brand').default('coffee'), // 'coffee' | 'tea' | 'both'
  
  // Additional info from inquiry
  currentCoffeeSolution: text('current_coffee_solution'),
  inquiryMessage: text('inquiry_message'),
  
  // Admin notes
  internalNotes: text('internal_notes'),
  
  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  approvedAt: integer('approved_at', { mode: 'timestamp' }),
  activatedAt: integer('activated_at', { mode: 'timestamp' }),
  pausedAt: integer('paused_at', { mode: 'timestamp' }),
  cancelledAt: integer('cancelled_at', { mode: 'timestamp' }),
});

// B2B Sessions (separate from D2C customer sessions)
export const b2bSessions = sqliteTable('b2b_sessions', {
  id: text('id').primaryKey(), // The session token
  companyId: text('company_id').notNull().references(() => b2bCompanies.id),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// B2B Orders - links Flex orders to companies, also tracks Smart on-demand orders
export const b2bOrders = sqliteTable('b2b_orders', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull().references(() => b2bCompanies.id),
  orderId: text('order_id').references(() => orders.id), // Links to main orders table
  
  // Order type
  orderType: text('order_type').notNull().default('flex'), // 'flex' | 'smart_ondemand'
  
  // PO number (for business orders)
  poNumber: text('po_number'),
  
  // Payment tracking (for Flex invoiced orders)
  paymentDueDate: integer('payment_due_date', { mode: 'timestamp' }),
  paymentStatus: text('payment_status').notNull().default('pending'), // 'pending' | 'paid' | 'overdue'
  paidAt: integer('paid_at', { mode: 'timestamp' }),
  
  // Volume discount applied
  volumeDiscountPercent: integer('volume_discount_percent').default(0),
  volumeDiscountAmount: integer('volume_discount_amount').default(0), // in cents
  
  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  reminderSentAt: integer('reminder_sent_at', { mode: 'timestamp' }),
  reminder2SentAt: integer('reminder2_sent_at', { mode: 'timestamp' }),
  reminder3SentAt: integer('reminder3_sent_at', { mode: 'timestamp' }),
});

// B2B Promo Usage - tracks employee conversions from QR codes
export const b2bPromoUsage = sqliteTable('b2b_promo_usage', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull().references(() => b2bCompanies.id),
  promoCode: text('promo_code').notNull(),
  
  // The D2C order that used this promo code
  orderId: text('order_id').references(() => orders.id),
  customerId: text('customer_id').references(() => customers.id),
  customerEmail: text('customer_email').notNull(),
  
  // Discount applied
  discountPercent: integer('discount_percent').notNull(),
  discountAmount: integer('discount_amount').notNull(), // in cents
  
  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// SmartBoxes - the IoT containers for Smart tier
// V2: SmartBox monitors SEALED BAGS, not loose beans!
// Standard bag sizes: 250g, 500g, 750g, 1000g
// One bag ≈ one day's consumption for an office
export const smartBoxes = sqliteTable('smart_boxes', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull().references(() => b2bCompanies.id),
  
  // Device identification
  deviceId: text('device_id').notNull().unique(), // Hardware serial number
  macAddress: text('mac_address'),
  firmwareVersion: text('firmware_version'),
  
  // Box type and configuration
  size: text('size').notNull().default('medium'), // 'small' | 'medium' | 'large'
  capacityKg: real('capacity_kg').notNull(), // e.g., 1.4, 1.9, 3.3
  productType: text('product_type').notNull().default('coffee'), // 'coffee' | 'tea'
  
  // V2: Bag-based configuration (SmartBox stores sealed bags!)
  standardBagSize: integer('standard_bag_size').notNull().default(500), // grams: 250 | 500 | 750 | 1000
  bagsPerOrder: integer('bags_per_order').notNull().default(5), // bags sent per shipment
  
  // Current product in box
  currentProductId: text('current_product_id'),
  currentProductName: text('current_product_name'),
  nextProductId: text('next_product_id'), // V2: Scheduled product change for next order
  
  // Thresholds
  reorderThresholdPercent: integer('reorder_threshold_percent').default(20),
  lowBatteryThresholdPercent: integer('low_battery_threshold_percent').default(20),
  
  // Current state (updated by readings)
  currentWeightGrams: integer('current_weight_grams'),
  currentFillPercent: integer('current_fill_percent'),
  currentBatteryPercent: integer('current_battery_percent'),
  lastReadingAt: integer('last_reading_at', { mode: 'timestamp' }),
  
  // V2: Learning mode - first 2 weeks to establish consumption patterns
  learningMode: integer('learning_mode', { mode: 'boolean' }).notNull().default(true),
  learningModeEndsAt: integer('learning_mode_ends_at', { mode: 'timestamp' }),
  
  // V2: Consumption analytics
  avgDailyConsumption: integer('avg_daily_consumption'), // grams per day (≈ bags per day * bagSize)
  avgWeeklyConsumption: integer('avg_weekly_consumption'), // grams per week
  
  // Status
  status: text('status').notNull().default('pending'), // 'pending' | 'active' | 'offline' | 'retired'
  
  // Location in office (optional)
  locationDescription: text('location_description'), // e.g., "Main kitchen"
  
  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  activatedAt: integer('activated_at', { mode: 'timestamp' }),
  lastOnlineAt: integer('last_online_at', { mode: 'timestamp' }),
});

// Box Readings - time series data from SmartBoxes
export const boxReadings = sqliteTable('box_readings', {
  id: text('id').primaryKey(),
  boxId: text('box_id').notNull().references(() => smartBoxes.id),
  
  // Measurement data
  weightGrams: integer('weight_grams').notNull(),
  batteryPercent: integer('battery_percent'),
  signalStrength: integer('signal_strength'), // RSSI in dBm
  
  // Calculated fields
  fillPercent: integer('fill_percent'),
  estimatedConsumptionGrams: integer('estimated_consumption_grams'), // Since last reading
  
  // Device metadata
  firmwareVersion: text('firmware_version'),
  temperature: real('temperature'), // Celsius, if sensor available
  
  // Timestamp
  recordedAt: integer('recorded_at', { mode: 'timestamp' }).notNull(),
  receivedAt: integer('received_at', { mode: 'timestamp' }).notNull(),
});

// B2B Shipments - for Smart tier auto-triggered deliveries
export const b2bShipments = sqliteTable('b2b_shipments', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull().references(() => b2bCompanies.id),
  boxId: text('box_id').references(() => smartBoxes.id), // Which box triggered this
  
  // Trigger info
  triggerType: text('trigger_type').notNull(), // 'auto_low_stock' | 'scheduled' | 'manual'
  triggeredAt: integer('triggered_at', { mode: 'timestamp' }).notNull(),
  triggerFillPercent: integer('trigger_fill_percent'), // Fill % when triggered
  triggerReason: text('trigger_reason'), // V2: Human-readable reason for trigger
  
  // Shipment contents
  items: text('items').notNull(), // JSON array of {productId, productName, quantity, weightGrams}
  totalWeightGrams: integer('total_weight_grams').notNull(),
  
  // Shipping info
  trackingNumber: text('tracking_number'),
  trackingUrl: text('tracking_url'),
  carrier: text('carrier').default('DHL'), // 'DHL' | 'DPD' | 'other'
  
  // Status
  status: text('status').notNull().default('pending'), // 'pending' | 'preparing' | 'shipped' | 'delivered' | 'cancelled'
  
  // V2: Restock tracking - has the customer confirmed bags are in the SmartBox?
  restockedAt: integer('restocked_at', { mode: 'timestamp' }), // When customer confirmed restock
  restockRemindersSent: integer('restock_reminders_sent').notNull().default(0), // Count of reminders sent
  
  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  shippedAt: integer('shipped_at', { mode: 'timestamp' }),
  deliveredAt: integer('delivered_at', { mode: 'timestamp' }),
  cancelledAt: integer('cancelled_at', { mode: 'timestamp' }),
  
  // Notes
  internalNotes: text('internal_notes'),
});

// B2B Invoices - monthly billing for Smart tier
export const b2bInvoices = sqliteTable('b2b_invoices', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull().references(() => b2bCompanies.id),
  
  // Invoice details
  invoiceNumber: text('invoice_number').notNull().unique(),
  billingPeriodStart: integer('billing_period_start', { mode: 'timestamp' }).notNull(),
  billingPeriodEnd: integer('billing_period_end', { mode: 'timestamp' }).notNull(),
  
  // Charges breakdown
  employeeCount: integer('employee_count').notNull(),
  ratePerEmployee: integer('rate_per_employee').notNull(), // in cents
  baseAmount: integer('base_amount').notNull(), // employeeCount * rate
  extraShipmentsAmount: integer('extra_shipments_amount').default(0), // Additional on-demand orders
  
  // Totals
  subtotal: integer('subtotal').notNull(),
  taxRate: real('tax_rate').notNull().default(0.19), // 19% VAT
  taxAmount: integer('tax_amount').notNull(),
  total: integer('total').notNull(),
  currency: text('currency').notNull().default('EUR'),
  
  // External invoice (rechnungs-api)
  externalInvoiceId: text('external_invoice_id'),
  
  // Stripe
  stripeInvoiceId: text('stripe_invoice_id'),
  stripePaymentIntentId: text('stripe_payment_intent_id'),
  
  // Status
  status: text('status').notNull().default('draft'), // 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  
  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  sentAt: integer('sent_at', { mode: 'timestamp' }),
  dueAt: integer('due_at', { mode: 'timestamp' }),
  paidAt: integer('paid_at', { mode: 'timestamp' }),
});

// B2B Sustainability Stats - cumulative metrics per company
export const b2bSustainabilityStats = sqliteTable('b2b_sustainability_stats', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull().references(() => b2bCompanies.id).unique(),
  
  // Cumulative consumption
  totalCoffeeKg: real('total_coffee_kg').default(0),
  totalTeaKg: real('total_tea_kg').default(0),
  totalCupsServed: integer('total_cups_served').default(0), // Estimated
  
  // Sustainability impact (calculated)
  farmerPremiumPaidCents: integer('farmer_premium_paid_cents').default(0), // Our premium above market price
  
  // Packaging
  recyclablePackagingCount: integer('recyclable_packaging_count').default(0),
  
  // Timestamps
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// V2: B2B Holiday Periods - pause automatic reordering during holidays
export const b2bHolidayPeriods = sqliteTable('b2b_holiday_periods', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull().references(() => b2bCompanies.id),
  boxId: text('box_id').references(() => smartBoxes.id), // null = all boxes for company
  
  // Holiday period
  startDate: integer('start_date', { mode: 'timestamp' }).notNull(),
  endDate: integer('end_date', { mode: 'timestamp' }).notNull(),
  
  // Details
  reason: text('reason'), // 'christmas', 'summer_holiday', 'office_closed', 'other'
  notes: text('notes'),
  
  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  createdBy: text('created_by'), // User who created it
});

// V2: B2B Alerts - system alerts for SmartBox issues
export const b2bAlerts = sqliteTable('b2b_alerts', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull().references(() => b2bCompanies.id),
  boxId: text('box_id').references(() => smartBoxes.id), // null = company-level alert
  
  // Alert details
  type: text('type').notNull(), // 'low_stock' | 'offline' | 'low_battery' | 'anomaly' | 'restock_reminder' | 'consumption_change'
  severity: text('severity').notNull().default('info'), // 'info' | 'warning' | 'critical'
  title: text('title').notNull(),
  message: text('message').notNull(),
  
  // Alert data (JSON with context-specific data)
  data: text('data'), // JSON: {fillPercent, expectedDays, oldConsumption, newConsumption, etc}
  
  // Resolution
  resolved: integer('resolved', { mode: 'boolean' }).notNull().default(false),
  resolvedAt: integer('resolved_at', { mode: 'timestamp' }),
  resolvedBy: text('resolved_by'), // User who resolved it
  resolutionNotes: text('resolution_notes'),
  
  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// B2B Waitlist Leads - for pre-launch validation
export const b2bWaitlistLeads = sqliteTable('b2b_waitlist_leads', {
  id: text('id').primaryKey(),
  
  // Company info
  companyName: text('company_name').notNull(),
  contactName: text('contact_name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  
  // Qualification data
  teamSize: text('team_size').notNull(), // '5-10', '10-20', '20-35', '35-50', '50+'
  currentSolution: text('current_solution').notNull(), // 'none', 'supermarket', 'local_roaster', 'big_supplier', 'other'
  interestLevel: text('interest_level').notNull(), // 'flex', 'smart', 'unsure'
  preferredStart: text('preferred_start'), // 'asap', '1month', '3months', 'exploring'
  message: text('message'),
  
  // Admin tracking
  status: text('status').notNull().default('new'), // 'new' | 'contacted' | 'converted' | 'not_interested'
  notes: text('notes'),
  
  // Conversion tracking
  convertedToCompanyId: text('converted_to_company_id').references(() => b2bCompanies.id),
  
  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  contactedAt: integer('contacted_at', { mode: 'timestamp' }),
  convertedAt: integer('converted_at', { mode: 'timestamp' }),
});

// B2B Communication Log - track all interactions with companies
export const b2bCommunicationLog = sqliteTable('b2b_communication_log', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull().references(() => b2bCompanies.id),
  
  // Communication details
  type: text('type').notNull(), // 'email' | 'call' | 'meeting' | 'note'
  subject: text('subject'),
  content: text('content'),
  
  // For emails
  emailTemplate: text('email_template'),
  emailStatus: text('email_status'), // 'sent' | 'delivered' | 'opened' | 'bounced'
  
  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  createdBy: text('created_by'), // Admin who created the entry
});

// ============================================================================
// B2B Type Exports
// ============================================================================

export type B2BCompany = typeof b2bCompanies.$inferSelect;
export type NewB2BCompany = typeof b2bCompanies.$inferInsert;

export type B2BSession = typeof b2bSessions.$inferSelect;
export type NewB2BSession = typeof b2bSessions.$inferInsert;

export type B2BOrder = typeof b2bOrders.$inferSelect;
export type NewB2BOrder = typeof b2bOrders.$inferInsert;

export type B2BPromoUsage = typeof b2bPromoUsage.$inferSelect;
export type NewB2BPromoUsage = typeof b2bPromoUsage.$inferInsert;

export type SmartBox = typeof smartBoxes.$inferSelect;
export type NewSmartBox = typeof smartBoxes.$inferInsert;

export type BoxReading = typeof boxReadings.$inferSelect;
export type NewBoxReading = typeof boxReadings.$inferInsert;

export type B2BShipment = typeof b2bShipments.$inferSelect;
export type NewB2BShipment = typeof b2bShipments.$inferInsert;

export type B2BInvoice = typeof b2bInvoices.$inferSelect;
export type NewB2BInvoice = typeof b2bInvoices.$inferInsert;

export type B2BSustainabilityStats = typeof b2bSustainabilityStats.$inferSelect;
export type NewB2BSustainabilityStats = typeof b2bSustainabilityStats.$inferInsert;

export type B2BHolidayPeriod = typeof b2bHolidayPeriods.$inferSelect;
export type NewB2BHolidayPeriod = typeof b2bHolidayPeriods.$inferInsert;

export type B2BAlert = typeof b2bAlerts.$inferSelect;
export type NewB2BAlert = typeof b2bAlerts.$inferInsert;

export type B2BWaitlistLead = typeof b2bWaitlistLeads.$inferSelect;
export type NewB2BWaitlistLead = typeof b2bWaitlistLeads.$inferInsert;

export type B2BCommunicationLog = typeof b2bCommunicationLog.$inferSelect;
export type NewB2BCommunicationLog = typeof b2bCommunicationLog.$inferInsert;

// ============================================================================
// B2B Status Constants
// ============================================================================

export const B2B_COMPANY_STATUS = {
  INQUIRY: 'inquiry',
  PENDING: 'pending',
  ACTIVE: 'active',
  PAUSED: 'paused',
  CANCELLED: 'cancelled',
} as const;

export const B2B_TIER = {
  FLEX: 'flex',
  SMART_STARTER: 'smart_starter',
  SMART_GROWTH: 'smart_growth',
  SMART_SCALE: 'smart_scale',
  SMART_ENTERPRISE: 'smart_enterprise',
} as const;

export const B2B_ORDER_PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  OVERDUE: 'overdue',
} as const;

export const B2B_SHIPMENT_STATUS = {
  PENDING: 'pending',
  PREPARING: 'preparing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
} as const;

export const B2B_INVOICE_STATUS = {
  DRAFT: 'draft',
  SENT: 'sent',
  PAID: 'paid',
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled',
} as const;

export const SMART_BOX_STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active',
  OFFLINE: 'offline',
  RETIRED: 'retired',
} as const;

export const B2B_WAITLIST_STATUS = {
  NEW: 'new',
  CONTACTED: 'contacted',
  CONVERTED: 'converted',
  NOT_INTERESTED: 'not_interested',
} as const;

// ============================================================================
// B2B Pricing Constants
// ============================================================================

// Smart tier monthly rates per employee (in cents)
export const B2B_SMART_RATES = {
  smart_starter: 1500, // €15/employee/month (5-15 employees)
  smart_growth: 1200, // €12/employee/month (16-50 employees)
  smart_scale: 1000, // €10/employee/month (51-200 employees)
  smart_enterprise: 0, // Custom pricing
} as const;

// Flex volume discount tiers
export const B2B_FLEX_DISCOUNTS = {
  none: { minKg: 0, discount: 0, paymentDays: 0 },
  '5kg': { minKg: 5, discount: 5, paymentDays: 14 },
  '10kg': { minKg: 10, discount: 10, paymentDays: 14 },
  '25kg': { minKg: 25, discount: 15, paymentDays: 30 },
  '50kg': { minKg: 50, discount: 20, paymentDays: 30 },
} as const;

// SmartBox sizes
export const SMART_BOX_SIZES = {
  small: { capacityKg: 1.4, suitableEmployees: '5-12' },
  medium: { capacityKg: 1.9, suitableEmployees: '10-18' },
  large: { capacityKg: 3.3, suitableEmployees: '18-30' },
} as const;

// Consumption estimates
export const B2B_CONSUMPTION = {
  gramsPerCup: 10,
  cupsPerEmployeePerDay: 2.5,
  workDaysPerWeek: 5,
} as const;

