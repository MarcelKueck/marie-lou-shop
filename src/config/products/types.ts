export type LocalizedString = {
  en: string;
  de: string;
};

export interface ProductVariant {
  id: string;
  sku: string;
  name: LocalizedString;
  priceModifier: number; // Additional cents (can be 0 or negative)
  stripePriceId?: string;
  weight: string;
}

export interface CoffeeAttributes {
  type: 'coffee';
  roastLevel: 'light' | 'medium' | 'medium-dark' | 'dark';
  process: 'washed' | 'natural' | 'honey';
  altitude?: string;
  variety?: string;
}

export interface TeaAttributes {
  type: 'tea';
  teaType: 'green' | 'black' | 'oolong' | 'white' | 'herbal' | 'blend';
  caffeine: 'none' | 'low' | 'medium' | 'high';
  steepTime: string;
  temperature: string;
}

export type ProductAttributes = CoffeeAttributes | TeaAttributes;

export interface Product {
  id: string;
  slug: string;
  brand: 'coffee' | 'tea';
  active: boolean;

  // Localized content
  name: LocalizedString;
  origin: LocalizedString;
  notes: LocalizedString;
  description: LocalizedString;

  // Base pricing (in cents, smallest variant)
  basePrice: number;
  currency: 'EUR';

  // Available variants
  variants: ProductVariant[];

  // Metadata
  badge?: 'bestseller' | 'new' | 'limited';

  // Inventory
  stockQuantity: number;
  lowStockThreshold: number;

  // Images
  image: string;
  images?: string[];

  // Type-specific attributes
  attributes: ProductAttributes;

  // Reviews (aggregated)
  averageRating?: number;
  reviewCount?: number;

  // Stripe
  stripeProductId?: string;
}

export interface CartItem {
  productId: string;
  variantId: string;
  quantity: number;
  // For free referral rewards
  isFreeReward?: boolean;
  rewardId?: string;
}

export interface CartItemWithProduct extends CartItem {
  product: Product;
  variant: ProductVariant;
  totalPrice: number;
  // Inherited from CartItem:
  // isFreeReward?: boolean;
  // rewardId?: string;
}
