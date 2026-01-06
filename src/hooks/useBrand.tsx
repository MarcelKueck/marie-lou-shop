'use client';

import { createContext, useContext, ReactNode } from 'react';
import { BrandConfig, BrandId, getBrand } from '@/config/brands';

interface BrandContextValue {
  brand: BrandConfig;
  brandId: BrandId;
}

const BrandContext = createContext<BrandContextValue | null>(null);

interface BrandProviderProps {
  children: ReactNode;
  brandId?: BrandId;
}

export function BrandProvider({ children, brandId }: BrandProviderProps) {
  const brand = getBrand(brandId);
  
  return (
    <BrandContext.Provider value={{ brand, brandId: brand.id }}>
      {children}
    </BrandContext.Provider>
  );
}

export function useBrand(): BrandContextValue {
  const context = useContext(BrandContext);
  if (!context) {
    throw new Error('useBrand must be used within a BrandProvider');
  }
  return context;
}
