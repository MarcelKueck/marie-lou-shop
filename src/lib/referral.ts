// ============================================================================
// Referral Code Generation
// ============================================================================

/**
 * Generate a unique, memorable referral code (simple version without DB check)
 * Format: MARIE-XXXXX (5 alphanumeric characters, no ambiguous ones)
 * For DB-unique code generation, use generateUniqueReferralCode from referral-server.ts
 */
export function generateReferralCodeSimple(): string {
  // Avoid ambiguous characters: 0/O, 1/I/L
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return `MARIE-${code}`;
}

/**
 * Generate share link
 */
export function generateShareLink(code: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://marieloucoffee.com';
  return `${baseUrl}/ref/${code}`;
}

/**
 * Validate referral code format
 */
export function isValidReferralCodeFormat(code: string): boolean {
  return /^MARIE-[A-HJ-NP-Z2-9]{5}$/i.test(code);
}

/**
 * Get referral link URL
 */
export function getReferralLink(code: string, baseUrl: string): string {
  return `${baseUrl}/ref/${code}`;
}

// ============================================================================
// Referral Discount Constants
// ============================================================================

export const REFERRAL_DISCOUNT_PERCENT = 20; // 20% off for referred friends
export const REFERRAL_MINIMUM_ORDER = 2500; // €25.00 minimum order (in cents)
export const REFERRAL_LINK_EXPIRY_DAYS = 90; // Links expire after 90 days
export const REFERRAL_SEPARATE_SHIPPING_COST = 495; // €4.95 to ship reward separately

// ============================================================================
// Cookie/Session Helpers
// ============================================================================

export const REFERRAL_COOKIE_NAME = 'marie_lou_ref';
export const REFERRAL_COOKIE_MAX_AGE = 90 * 24 * 60 * 60; // 90 days in seconds

/**
 * Store referral code from URL to be used at checkout
 */
export function getReferralCookieOptions() {
  return {
    name: REFERRAL_COOKIE_NAME,
    maxAge: REFERRAL_COOKIE_MAX_AGE,
    path: '/',
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
  };
}

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Check if an order meets the minimum for referral discount
 */
export function meetsReferralMinimum(subtotalCents: number): boolean {
  return subtotalCents >= REFERRAL_MINIMUM_ORDER;
}

/**
 * Calculate referral discount amount
 */
export function calculateReferralDiscount(subtotalCents: number): number {
  if (!meetsReferralMinimum(subtotalCents)) {
    return 0;
  }
  return Math.round(subtotalCents * (REFERRAL_DISCOUNT_PERCENT / 100));
}

// ============================================================================
// Share Helpers
// ============================================================================

export interface ShareLinks {
  whatsapp: string;
  email: string;
  twitter: string;
  copy: string;
}

/**
 * Generate share links for different platforms
 */
export function generateShareLinks(
  referralLink: string,
  locale: 'en' | 'de'
): ShareLinks {
  const messages = {
    en: {
      text: "I've been enjoying fresh-roasted coffee from Marie Lou Coffee. Use my link for 20% off your first order!",
      subject: "Coffee recommendation for you",
    },
    de: {
      text: "Ich genieße frisch gerösteten Kaffee von Marie Lou Coffee. Nutze meinen Link für 20% Rabatt auf deine erste Bestellung!",
      subject: "Kaffeeempfehlung für dich",
    },
  };
  
  const msg = messages[locale];
  const fullText = `${msg.text} ${referralLink}`;
  
  return {
    whatsapp: `https://wa.me/?text=${encodeURIComponent(fullText)}`,
    email: `mailto:?subject=${encodeURIComponent(msg.subject)}&body=${encodeURIComponent(fullText)}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(fullText)}`,
    copy: referralLink,
  };
}
