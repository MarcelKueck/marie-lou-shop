import { headers } from 'next/headers';
import { BrandConfig, BrandId, getBrand, getBrandFromHostname } from '@/config/brands';

/**
 * Get brand configuration in a server component
 * Uses the x-brand header set by middleware or falls back to environment variable
 */
export async function getServerBrand(): Promise<BrandConfig> {
  const headersList = await headers();
  const brandHeader = headersList.get('x-brand') as BrandId | null;
  
  if (brandHeader) {
    return getBrand(brandHeader);
  }
  
  // Fallback to hostname detection
  const host = headersList.get('host') || '';
  return getBrandFromHostname(host);
}

/**
 * Get brand ID in a server component
 */
export async function getServerBrandId(): Promise<BrandId> {
  const brand = await getServerBrand();
  return brand.id;
}
