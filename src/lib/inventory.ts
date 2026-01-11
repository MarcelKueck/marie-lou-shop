import { allProducts, type Product } from '@/config/products';

// In-memory stock tracking (for config-based products)
// In production with DB-based products, this would update the database
const stockAdjustments: Map<string, number> = new Map();

/**
 * Get current stock for a product variant
 */
export function getProductStock(productId: string, variantId: string): number {
  const product = allProducts.find(p => p.id === productId);
  if (!product) return 0;
  
  const key = `${productId}:${variantId}`;
  const adjustment = stockAdjustments.get(key) || 0;
  
  return Math.max(0, product.stockQuantity + adjustment);
}

/**
 * Get total stock for a product (all variants)
 */
export function getProductTotalStock(productId: string): number {
  const product = allProducts.find(p => p.id === productId);
  if (!product) return 0;
  
  // Sum adjustments for all variants
  let totalAdjustment = 0;
  for (const variant of product.variants) {
    const key = `${productId}:${variant.id}`;
    totalAdjustment += stockAdjustments.get(key) || 0;
  }
  
  return Math.max(0, product.stockQuantity + totalAdjustment);
}

/**
 * Check if a product variant is in stock
 */
export function isInStock(productId: string, variantId: string, quantity: number = 1): boolean {
  return getProductStock(productId, variantId) >= quantity;
}

/**
 * Deduct stock when an order is placed
 */
export function deductStock(productId: string, variantId: string, quantity: number): boolean {
  const currentStock = getProductStock(productId, variantId);
  
  if (currentStock < quantity) {
    console.warn(`Insufficient stock for ${productId}:${variantId}. Have ${currentStock}, need ${quantity}`);
    return false;
  }
  
  const key = `${productId}:${variantId}`;
  const currentAdjustment = stockAdjustments.get(key) || 0;
  stockAdjustments.set(key, currentAdjustment - quantity);
  
  console.log(`Stock deducted: ${productId}:${variantId} - ${quantity} (remaining: ${currentStock - quantity})`);
  return true;
}

/**
 * Add stock back (e.g., when order is cancelled/refunded)
 */
export function restoreStock(productId: string, variantId: string, quantity: number): void {
  const key = `${productId}:${variantId}`;
  const currentAdjustment = stockAdjustments.get(key) || 0;
  stockAdjustments.set(key, currentAdjustment + quantity);
  
  console.log(`Stock restored: ${productId}:${variantId} + ${quantity}`);
}

/**
 * Check stock availability for a cart
 */
export function checkCartStock(items: Array<{ productId: string; variantId: string; quantity: number }>): {
  available: boolean;
  unavailableItems: Array<{ productId: string; variantId: string; requested: number; available: number }>;
} {
  const unavailableItems: Array<{ productId: string; variantId: string; requested: number; available: number }> = [];
  
  for (const item of items) {
    const available = getProductStock(item.productId, item.variantId);
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
export function getLowStockProducts(): Array<Product & { currentStock: number }> {
  const lowStock: Array<Product & { currentStock: number }> = [];
  
  for (const product of allProducts) {
    const currentStock = getProductTotalStock(product.id);
    if (currentStock <= product.lowStockThreshold) {
      lowStock.push({
        ...product,
        currentStock,
      });
    }
  }
  
  return lowStock;
}

/**
 * Get stock status summary
 */
export function getStockSummary(): {
  totalProducts: number;
  inStock: number;
  lowStock: number;
  outOfStock: number;
} {
  let inStock = 0;
  let lowStock = 0;
  let outOfStock = 0;
  
  for (const product of allProducts) {
    const currentStock = getProductTotalStock(product.id);
    
    if (currentStock === 0) {
      outOfStock++;
    } else if (currentStock <= product.lowStockThreshold) {
      lowStock++;
    } else {
      inStock++;
    }
  }
  
  return {
    totalProducts: allProducts.length,
    inStock,
    lowStock,
    outOfStock,
  };
}

/**
 * Process order items and deduct stock
 */
export function processOrderStock(items: Array<{ productId: string; variantId: string; quantity: number }>): {
  success: boolean;
  failedItems: Array<{ productId: string; variantId: string }>;
} {
  const failedItems: Array<{ productId: string; variantId: string }> = [];
  
  // First pass: check all items
  const stockCheck = checkCartStock(items);
  if (!stockCheck.available) {
    return {
      success: false,
      failedItems: stockCheck.unavailableItems.map(i => ({ productId: i.productId, variantId: i.variantId })),
    };
  }
  
  // Second pass: deduct stock
  for (const item of items) {
    const success = deductStock(item.productId, item.variantId, item.quantity);
    if (!success) {
      failedItems.push({ productId: item.productId, variantId: item.variantId });
    }
  }
  
  return {
    success: failedItems.length === 0,
    failedItems,
  };
}
