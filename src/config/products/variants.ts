import { ProductVariant } from './types';

// Coffee grind options
export const coffeeGrindVariants: ProductVariant[] = [
  {
    id: 'whole-bean',
    sku: 'WB',
    name: { en: 'Whole Bean', de: 'Ganze Bohne' },
    priceModifier: 0,
    weight: '250g',
  },
  {
    id: 'filter',
    sku: 'FI',
    name: { en: 'Ground for Filter', de: 'Gemahlen für Filter' },
    priceModifier: 0,
    weight: '250g',
  },
  {
    id: 'espresso',
    sku: 'ES',
    name: { en: 'Ground for Espresso', de: 'Gemahlen für Espresso' },
    priceModifier: 0,
    weight: '250g',
  },
  {
    id: 'french-press',
    sku: 'FP',
    name: { en: 'Ground for French Press', de: 'Gemahlen für French Press' },
    priceModifier: 0,
    weight: '250g',
  },
  {
    id: 'moka',
    sku: 'MK',
    name: { en: 'Ground for Moka Pot', de: 'Gemahlen für Mokka' },
    priceModifier: 0,
    weight: '250g',
  },
];

// Size variants (optional, for different sizes)
export const sizeVariants: ProductVariant[] = [
  { id: '250g', sku: '250', name: { en: '250g', de: '250g' }, priceModifier: 0, weight: '250g' },
  { id: '500g', sku: '500', name: { en: '500g', de: '500g' }, priceModifier: 850, weight: '500g' },
  { id: '1kg', sku: '1000', name: { en: '1kg', de: '1kg' }, priceModifier: 1500, weight: '1kg' },
];

// Tea formats
export const teaFormatVariants: ProductVariant[] = [
  {
    id: 'loose-leaf',
    sku: 'LL',
    name: { en: 'Loose Leaf', de: 'Loser Tee' },
    priceModifier: 0,
    weight: '100g',
  },
  {
    id: 'tea-bags',
    sku: 'TB',
    name: { en: 'Tea Bags (15 pcs)', de: 'Teebeutel (15 Stk)' },
    priceModifier: 200,
    weight: '15 bags',
  },
];

// Helper to get variants by product type
export function getVariantsForProductType(type: 'coffee' | 'tea'): ProductVariant[] {
  return type === 'coffee' ? coffeeGrindVariants : teaFormatVariants;
}
