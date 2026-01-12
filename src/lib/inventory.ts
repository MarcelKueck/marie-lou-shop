import { db } from '@/db';
import { products, productVariants } from '@/db/schema';
import { eq, and, lte, sql } from 'drizzle-orm';

/**
 * Get current stock for a product variant from database
 */
export async function getProductStock(productId: string, variantId: string): Promise<number> {
  const variant = await db.query.productVariants.findFirst({
    where: and(
      eq(productVariants.productId, productId),
      eq(productVariants.id, variantId)
    ),
  });
  
  return variant?.stockQuantity ?? 0;
}

/**
 * Get total stock for a product (sum of all variants)
 */
export async function getProductTotalStock(productId: string): Promise<number> {
  const result = await db.select({
    totalStock: sql<number>`coalesce(sum(${productVariants.stockQuantity}), 0)`,
  })
  .from(productVariants)
  .where(eq(productVariants.productId, productId));
  
  return result[0]?.totalStock ?? 0;
}

/**
 * Check if a product variant is in stock
 */
export async function isInStock(productId: string, variantId: string, quantity: number = 1): Promise<boolean> {
  const stock = await getProductStock(productId, variantId);
  return stock >= quantity;
}

/**
 * Deduct stock when an order is placed
 */
export async function deductStock(productId: string, variantId: string, quantity: number): Promise<boolean> {
  const currentStock = await getProductStock(productId, variantId);
  
  if (currentStock < quantity) {
    console.warn(`Insufficient stock for ${productId}:${variantId}. Have ${currentStock}, need ${quantity}`);
    return false;
  }
  
  await db.update(productVariants)
    .set({
      stockQuantity: sql`${productVariants.stockQuantity} - ${quantity}`,
    })
    .where(eq(productVariants.id, variantId));
  
  console.log(`Stock deducted: ${productId}:${variantId} - ${quantity} (remaining: ${currentStock - quantity})`);
  return true;
}

/**
 * Add stock back (e.g., when order is cancelled/refunded)
 */
export async function restoreStock(productId: string, variantId: string, quantity: number): Promise<void> {
  await db.update(productVariants)
    .set({
      stockQuantity: sql`${productVariants.stockQuantity} + ${quantity}`,
    })
    .where(eq(productVariants.id, variantId));
  
  console.log(`Stock restored: ${productId}:${variantId} + ${quantity}`);
}

/**
 * Check stock availability for a cart
 */
export async function checkCartStock(items: Array<{ productId: string; variantId: string; quantity: number }>): Promise<{
  available: boolean;
  unavailableItems: Array<{ productId: string; variantId: string; requested: number; available: number }>;
}> {
  const unavailableItems: Array<{ productId: string; variantId: string; requested: number; available: number }> = [];
  
  for (const item of items) {
    const available = await getProductStock(item.productId, item.variantId);
    if (available < item.quantity) {
      unavailableItems.push({
        productId: item.productId,
        variantId: item.variantId,
        requested: item.quantity,
        available,
      });
    }
  }
  
  return {
    available: unavailableItems.length === 0,
    unavailableItems,
  };
}

/**
 * Get all products with low stock
 */
export async function getLowStockProducts(): Promise<Array<{
  id: string;
  name: string;
  currentStock: number;
  lowStockThreshold: number;
}>> {
  const lowStockProducts = await db.query.products.findMany({
    where: lte(products.stockQuantity, sql`${products.lowStockThreshold}`),
  });
  
  return lowStockProducts.map(product => ({
    id: product.id,
    name: product.nameEn,
    currentStock: product.stockQuantity ?? 0,
    lowStockThreshold: product.lowStockThreshold ?? 5,
  }));
}

/**
 * Get stock status summary
 */
export async function getStockSummary(): Promise<{
  totalProducts: number;
  inStock: number;
  lowStock: number;
  outOfStock: number;
}> {
  const allProductsList = await db.query.products.findMany();
  
  let inStock = 0;
  let lowStock = 0;
  let outOfStock = 0;
  
  for (const product of allProductsList) {
    const stock = product.stockQuantity ?? 0;
    const threshold = product.lowStockThreshold ?? 5;
    
    if (stock === 0) {
      outOfStock++;
    } else if (stock <= threshold) {
      lowStock++;
    } else {
      inStock++;
    }
  }
  
  return {
    totalProducts: allProductsList.length,
    inStock,
    lowStock,
    outOfStock,
  };
}

/**
 * Process order items and deduct stock
 */
export async function processOrderStock(items: Array<{ productId: string; variantId: string; quantity: number }>): Promise<{
  success: boolean;
  failedItems: Array<{ productId: string; variantId: string }>;
}> {
  const failedItems: Array<{ productId: string; variantId: string }> = [];
  
  // First pass: check all items
  const stockCheck = await checkCartStock(items);
  if (!stockCheck.available) {
    return {
      success: false,
      failedItems: stockCheck.unavailableItems.map(i => ({ productId: i.productId, variantId: i.variantId })),
    };
  }
  
  // Second pass: deduct stock
  for (const item of items) {
    const success = await deductStock(item.productId, item.variantId, item.quantity);
    if (!success) {
      failedItems.push({ productId: item.productId, variantId: item.variantId });
    }
  }
  
  return {
    success: failedItems.length === 0,
    failedItems,
  };
}
