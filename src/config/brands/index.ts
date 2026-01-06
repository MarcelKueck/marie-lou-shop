import { coffeeBrand } from './coffee';
import { teaBrand } from './tea';
import { BrandConfig, BrandId } from './types';

export const brands: Record<BrandId, BrandConfig> = {
  coffee: coffeeBrand,
  tea: teaBrand,
};

export function getBrand(brandId?: BrandId): BrandConfig {
  const id = brandId || (process.env.NEXT_PUBLIC_BRAND as BrandId) || 'coffee';
  return brands[id] || brands.coffee;
}

export function getBrandFromHostname(hostname: string): BrandConfig {
  if (hostname.includes('tea') || hostname.includes('tee')) {
    return brands.tea;
  }
  return brands.coffee;
}

export { coffeeBrand, teaBrand };
export type { BrandConfig, BrandId };
