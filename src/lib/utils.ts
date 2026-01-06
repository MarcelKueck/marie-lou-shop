import { type ClassValue, clsx } from 'clsx';

/**
 * Utility to conditionally join class names
 */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

/**
 * Format price in cents to display string
 */
export function formatPrice(cents: number, locale: string = 'de-DE'): string {
  const euros = cents / 100;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
  }).format(euros);
}

/**
 * Format price without currency symbol
 */
export function formatPriceNumber(cents: number, locale: string = 'de-DE'): string {
  const euros = cents / 100;
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(euros);
}

/**
 * Generate a unique order number
 */
export function generateOrderNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  return `ML-${year}-${random}`;
}

/**
 * Generate a unique gift card code
 */
export function generateGiftCardCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed ambiguous chars
  const part1 = Array.from({ length: 4 }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length))
  ).join('');
  const part2 = Array.from({ length: 4 }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length))
  ).join('');
  return `MARIE-${part1}-${part2}`;
}

/**
 * Calculate tax amount from total (German VAT is 19%)
 */
export function calculateTax(totalWithTax: number, taxRate: number = 19): number {
  // Price includes tax, so we calculate backwards
  // totalWithTax = netPrice * (1 + taxRate/100)
  // netPrice = totalWithTax / (1 + taxRate/100)
  // tax = totalWithTax - netPrice
  const netPrice = totalWithTax / (1 + taxRate / 100);
  return Math.round(totalWithTax - netPrice);
}

/**
 * Get localized string based on locale
 */
export function getLocalizedString(
  obj: { en: string; de: string } | undefined,
  locale: string
): string {
  if (!obj) return '';
  return locale === 'de' ? obj.de : obj.en;
}

/**
 * Sleep utility for async operations
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Check if we're running on the server
 */
export const isServer = typeof window === 'undefined';

/**
 * Check if we're running on the client
 */
export const isClient = !isServer;
