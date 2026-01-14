/**
 * B2B Program Types
 * 
 * These types complement the database schema types with additional
 * business logic types and API interfaces.
 */

import type {
  B2BCompany,
  B2BOrder,
  SmartBox,
  BoxReading,
  B2BShipment,
  B2BInvoice,
  B2BSustainabilityStats,
  B2BPromoUsage,
  B2BCommunicationLog,
} from '@/db/schema';

// ============================================================================
// Tier Types
// ============================================================================

export type B2BTier = 
  | 'flex' 
  | 'smart_starter' 
  | 'smart_growth' 
  | 'smart_scale' 
  | 'smart_enterprise';

export type B2BCompanyStatus = 
  | 'inquiry' 
  | 'pending' 
  | 'active' 
  | 'paused' 
  | 'cancelled';

export type B2BOrderPaymentStatus = 
  | 'pending' 
  | 'paid' 
  | 'overdue';

export type B2BShipmentStatus = 
  | 'pending' 
  | 'preparing' 
  | 'shipped' 
  | 'delivered' 
  | 'cancelled';

export type B2BInvoiceStatus = 
  | 'draft' 
  | 'sent' 
  | 'paid' 
  | 'overdue' 
  | 'cancelled';

export type SmartBoxStatus = 
  | 'pending' 
  | 'active' 
  | 'offline' 
  | 'retired';

export type SmartBoxSize = 
  | 'small' 
  | 'medium' 
  | 'large';

export type B2BWaitlistStatus = 
  | 'new' 
  | 'contacted' 
  | 'converted' 
  | 'not_interested';

// ============================================================================
// API Request/Response Types
// ============================================================================

// Inquiry form data
export interface B2BInquiryData {
  companyName: string;
  contactFirstName: string;
  contactLastName: string;
  contactEmail: string;
  contactPhone?: string;
  employeeCount: number;
  preferredTier: 'flex' | 'smart';
  preferredBrand: 'coffee' | 'tea' | 'both';
  currentCoffeeSolution?: string;
  message?: string;
}

// Waitlist form data
export interface B2BWaitlistData {
  companyName: string;
  contactName: string;
  email: string;
  phone?: string;
  teamSize: '5-10' | '10-20' | '20-35' | '35-50' | '50+';
  currentSolution: 'none' | 'supermarket' | 'local_roaster' | 'big_supplier' | 'other';
  interestLevel: 'flex' | 'smart' | 'unsure';
  preferredStart?: 'asap' | '1month' | '3months' | 'exploring';
  message?: string;
}

// Consumption estimate request
export interface ConsumptionEstimateRequest {
  employeeCount: number;
  cupsPerEmployeePerDay?: number;
  workDaysPerWeek?: number;
  preferredBrand: 'coffee' | 'tea' | 'both';
}

// Consumption estimate response
export interface ConsumptionEstimateResponse {
  monthlyConsumptionKg: number;
  weeklyConsumptionKg: number;
  recommendedTier: B2BTier;
  flexCost: {
    monthly: number;
    perKg: number;
    discountPercent: number;
  };
  smartCost: {
    monthly: number;
    perEmployee: number;
    includes: string[];
  };
  savings: {
    smartVsFlex: number;
    breakEvenMonths: number;
  };
  recommendedBoxSize: SmartBoxSize;
}

// Promo code validation response
export interface PromoValidationResponse {
  valid: boolean;
  code?: string;
  companyName?: string;
  discountPercent?: number;
  error?: string;
}

// ============================================================================
// Portal Types
// ============================================================================

// Dashboard data for B2B portal
export interface B2BPortalDashboard {
  company: B2BCompany;
  recentOrders: B2BOrder[];
  // Smart tier specific
  smartBoxes?: SmartBox[];
  nextShipment?: B2BShipment;
  sustainabilityStats?: B2BSustainabilityStats;
  // Flex tier specific
  upgradeRecommendation?: {
    show: boolean;
    potentialSavings: number;
    recommendedTier: B2BTier;
  };
}

// Cart item for B2B orders
export interface B2BCartItem {
  productId: string;
  variantId: string;
  productName: string;
  variantName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  weight: string;
}

// B2B cart state
export interface B2BCart {
  items: B2BCartItem[];
  subtotal: number;
  volumeDiscount: {
    percent: number;
    amount: number;
    tier: string;
  };
  shipping: number;
  tax: number;
  total: number;
}

// Checkout data
export interface B2BCheckoutData {
  items: B2BCartItem[];
  shippingAddressId?: string;
  poNumber?: string;
  paymentMethod: 'invoice' | 'card';
  notes?: string;
}

// ============================================================================
// Admin Types
// ============================================================================

// Company detail view with all related data
export interface B2BCompanyDetail extends B2BCompany {
  orders: B2BOrder[];
  smartBoxes: SmartBox[];
  shipments: B2BShipment[];
  invoices: B2BInvoice[];
  sustainabilityStats?: B2BSustainabilityStats;
  promoUsage: B2BPromoUsage[];
  communicationLog: B2BCommunicationLog[];
}

// Admin dashboard metrics
export interface B2BAdminMetrics {
  totalCompanies: {
    all: number;
    byStatus: Record<B2BCompanyStatus, number>;
    byTier: Record<B2BTier, number>;
  };
  revenue: {
    mrr: number; // Monthly recurring revenue (Smart tier)
    flexRevenue30Days: number;
    totalRevenue30Days: number;
  };
  conversions: {
    employeeConversions30Days: number;
    totalEmployeeConversions: number;
    topCompanyConversions: Array<{
      companyId: string;
      companyName: string;
      conversionCount: number;
    }>;
  };
  alerts: {
    lowStockBoxes: number;
    offlineBoxes: number;
    overduePayments: number;
    pendingInquiries: number;
  };
  waitlist: {
    total: number;
    byStatus: Record<B2BWaitlistStatus, number>;
    byTeamSize: Record<string, number>;
  };
}

// SmartBox monitoring data
export interface SmartBoxMonitoringData extends SmartBox {
  company: Pick<B2BCompany, 'id' | 'companyName'>;
  recentReadings: BoxReading[];
  consumptionTrend: 'increasing' | 'stable' | 'decreasing';
  estimatedDaysUntilEmpty: number;
  alerts: SmartBoxAlert[];
}

export interface SmartBoxAlert {
  type: 'low_stock' | 'offline' | 'low_battery' | 'high_consumption';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: Date;
}

// ============================================================================
// Device API Types
// ============================================================================

// Reading from SmartBox device
export interface DeviceReadingPayload {
  deviceId: string;
  weightGrams: number;
  batteryPercent?: number;
  signalStrength?: number;
  firmwareVersion?: string;
  temperature?: number;
  timestamp: string; // ISO string
}

// Config response for SmartBox device
export interface DeviceConfigResponse {
  deviceId: string;
  reportingIntervalHours: number;
  reorderThresholdPercent: number;
  lowBatteryThresholdPercent: number;
  serverTime: string;
  firmwareUpdateAvailable?: {
    version: string;
    url: string;
  };
}

// ============================================================================
// Shipment Types
// ============================================================================

export interface ShipmentItem {
  productId: string;
  productName: string;
  quantity: number;
  weightGrams: number;
}

export interface CreateShipmentData {
  companyId: string;
  boxId?: string;
  triggerType: 'auto_low_stock' | 'scheduled' | 'manual';
  items: ShipmentItem[];
}

// ============================================================================
// Invoice Types
// ============================================================================

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface CreateInvoiceData {
  companyId: string;
  billingPeriodStart: Date;
  billingPeriodEnd: Date;
  employeeCount: number;
  ratePerEmployee: number;
  extraShipmentsAmount?: number;
}

// ============================================================================
// Email Template Data Types
// ============================================================================

export interface B2BEmailData {
  company: B2BCompany;
  locale: 'de' | 'en';
}

export interface B2BWelcomeEmailData extends B2BEmailData {
  loginUrl: string;
  temporaryPassword?: string;
}

export interface B2BOrderConfirmationEmailData extends B2BEmailData {
  order: B2BOrder;
  items: B2BCartItem[];
  invoiceNumber: string;
}

export interface B2BShipmentEmailData extends B2BEmailData {
  shipment: B2BShipment;
  trackingUrl?: string;
}

export interface B2BInvoiceEmailData extends B2BEmailData {
  invoice: B2BInvoice;
  invoicePdf?: Buffer;
}

export interface B2BPaymentReminderEmailData extends B2BEmailData {
  invoice: B2BInvoice;
  daysOverdue: number;
  reminderNumber: 1 | 2 | 3;
}

// ============================================================================
// Utility Types
// ============================================================================

// Type guard helpers
export function isSmartTier(tier: B2BTier): tier is 'smart_starter' | 'smart_growth' | 'smart_scale' | 'smart_enterprise' {
  return tier.startsWith('smart_');
}

export function isFlexTier(tier: B2BTier): tier is 'flex' {
  return tier === 'flex';
}

// Tier display names
export const B2B_TIER_NAMES: Record<B2BTier, { en: string; de: string }> = {
  flex: { en: 'B2B Flex', de: 'B2B Flex' },
  smart_starter: { en: 'Smart Starter', de: 'Smart Starter' },
  smart_growth: { en: 'Smart Growth', de: 'Smart Growth' },
  smart_scale: { en: 'Smart Scale', de: 'Smart Scale' },
  smart_enterprise: { en: 'Smart Enterprise', de: 'Smart Enterprise' },
};

// Status display names
export const B2B_STATUS_NAMES: Record<B2BCompanyStatus, { en: string; de: string }> = {
  inquiry: { en: 'Inquiry', de: 'Anfrage' },
  pending: { en: 'Pending', de: 'Ausstehend' },
  active: { en: 'Active', de: 'Aktiv' },
  paused: { en: 'Paused', de: 'Pausiert' },
  cancelled: { en: 'Cancelled', de: 'Gekündigt' },
};

// Box size display names
export const SMART_BOX_SIZE_NAMES: Record<SmartBoxSize, { en: string; de: string }> = {
  small: { en: 'SmartBox S', de: 'SmartBox S' },
  medium: { en: 'SmartBox M', de: 'SmartBox M' },
  large: { en: 'SmartBox L', de: 'SmartBox L' },
};
