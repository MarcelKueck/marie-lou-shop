/**
 * Product service - Database-driven product management
 * Provides functions to fetch products from database for shop pages
 */

import { db } from '@/db';
import { products, productVariants, DbProduct, DbProductVariant } from '@/db/schema';
import { eq, and, asc, desc } from 'drizzle-orm';

// Type for transformed product matching the old config format
export interface Product {
  id: string;
  slug: string;
  brand: 'coffee' | 'tea';
  active: boolean;
  name: { en: string; de: string };
  origin?: { en: string | null; de: string | null };
  notes?: { en: string | null; de: string | null };
  description?: { en: string | null; de: string | null };
  basePrice: number;
  currency: string;
  stockQuantity: number | null;
  lowStockThreshold: number | null;
  trackInventory: boolean | null;
  image: string | null;
  badge: string | null;
  sortOrder: number | null;
  attributes: Record<string, unknown> | null;
  averageRating: number | null;
  reviewCount: number | null;
  variants: ProductVariant[];
}

export interface ProductVariant {
  id: string;
  name: { en: string; de: string };
  priceModifier: number;
  sku: string | null;
  stockQuantity: number | null;
  sortOrder: number | null;
  active: boolean;
  weight: string | null;
}

// Transform DB product to unified format
function transformDbProduct(product: DbProduct & { variants: DbProductVariant[] }): Product {
  return {
    id: product.id,
    slug: product.slug,
    brand: product.brand as 'coffee' | 'tea',
    active: product.active,
    name: { en: product.nameEn, de: product.nameDe },
    origin: { en: product.originEn, de: product.originDe },
    notes: { en: product.notesEn, de: product.notesDe },
    description: { en: product.descriptionEn, de: product.descriptionDe },
    basePrice: product.basePrice,
    currency: product.currency,
    stockQuantity: product.stockQuantity,
    lowStockThreshold: product.lowStockThreshold,
    trackInventory: product.trackInventory,
    image: product.image,
    badge: product.badge,
    sortOrder: product.sortOrder,
    attributes: product.attributes ? JSON.parse(product.attributes) : null,
    averageRating: product.averageRating,
    reviewCount: product.reviewCount,
    variants: product.variants
      .filter(v => v.active)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
      .map(v => ({
        id: v.id,
        name: { en: v.nameEn, de: v.nameDe },
        priceModifier: v.priceModifier,
        sku: v.sku,
        stockQuantity: v.stockQuantity,
        sortOrder: v.sortOrder,
        active: v.active,
        weight: v.weight,
      })),
  };
}

/**
 * Get all active products
 */
export async function getAllProducts(): Promise<Product[]> {
  const dbProducts = await db.query.products.findMany({
    where: eq(products.active, true),
    with: { variants: true },
    orderBy: [asc(products.sortOrder), desc(products.createdAt)],
  });

  return dbProducts.map(transformDbProduct);
}

/**
 * Get products by brand
 */
export async function getProductsByBrand(brand: 'coffee' | 'tea'): Promise<Product[]> {
  const dbProducts = await db.query.products.findMany({
    where: and(eq(products.brand, brand), eq(products.active, true)),
    with: { variants: true },
    orderBy: [asc(products.sortOrder), desc(products.createdAt)],
  });

  return dbProducts.map(transformDbProduct);
}

/**
 * Get product by slug
 */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  const product = await db.query.products.findFirst({
    where: and(eq(products.slug, slug), eq(products.active, true)),
    with: { variants: true },
  });

  return product ? transformDbProduct(product) : null;
}

/**
 * Get product by ID
 */
export async function getProductById(id: string): Promise<Product | null> {
  const product = await db.query.products.findFirst({
    where: eq(products.id, id),
    with: { variants: true },
  });

  return product ? transformDbProduct(product) : null;
}

/**
 * Get product variant by ID
 */
export async function getVariantById(variantId: string): Promise<(ProductVariant & { product: Product }) | null> {
  const variant = await db.query.productVariants.findFirst({
    where: eq(productVariants.id, variantId),
    with: { product: true },
  });

  if (!variant || !variant.product) return null;

  // Get full product with all variants
  const fullProduct = await db.query.products.findFirst({
    where: eq(products.id, variant.productId),
    with: { variants: true },
  });

  if (!fullProduct) return null;

  return {
    id: variant.id,
    name: { en: variant.nameEn, de: variant.nameDe },
    priceModifier: variant.priceModifier,
    sku: variant.sku,
    stockQuantity: variant.stockQuantity,
    sortOrder: variant.sortOrder,
    active: variant.active,
    weight: variant.weight,
    product: transformDbProduct(fullProduct),
  };
}

/**
 * Update product stock
 */
export async function updateProductStock(productId: string, quantity: number): Promise<void> {
  await db.update(products)
    .set({
      stockQuantity: quantity,
      updatedAt: new Date(),
    })
    .where(eq(products.id, productId));
}

/**
 * Decrement product stock
 */
export async function decrementProductStock(productId: string, amount: number): Promise<void> {
  const product = await db.query.products.findFirst({
    where: eq(products.id, productId),
  });

  if (product && product.stockQuantity !== null) {
    const newQuantity = Math.max(0, product.stockQuantity - amount);
    await updateProductStock(productId, newQuantity);
  }
}

/**
 * Increment product stock (e.g., for refunds)
 */
export async function incrementProductStock(productId: string, amount: number): Promise<void> {
  const product = await db.query.products.findFirst({
    where: eq(products.id, productId),
  });

  if (product && product.stockQuantity !== null) {
    await updateProductStock(productId, product.stockQuantity + amount);
  }
}

/**
 * Get low stock products
 */
export async function getLowStockProducts(): Promise<Product[]> {
  const allProducts = await getAllProducts();
  
  return allProducts.filter(p => 
    p.trackInventory && 
    p.stockQuantity !== null && 
    p.lowStockThreshold !== null &&
    p.stockQuantity <= p.lowStockThreshold
  );
}
