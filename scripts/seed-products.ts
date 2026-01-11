/**
 * Seed script to migrate products from config files to database
 * Run with: npx tsx scripts/seed-products.ts
 */

import { db } from '../src/db';
import { products, productVariants } from '../src/db/schema';
import { coffeeProducts, teaProducts } from '../src/config/products';
import { eq } from 'drizzle-orm';

async function seedProducts() {
  console.log('🌱 Starting product seeding...\n');

  const allConfigProducts = [...coffeeProducts, ...teaProducts];
  
  for (const configProduct of allConfigProducts) {
    // Check if product already exists
    const existing = await db.query.products.findFirst({
      where: eq(products.id, configProduct.id),
    });

    if (existing) {
      console.log(`⏭️  Skipping ${configProduct.id} (already exists)`);
      continue;
    }

    const now = new Date();

    // Insert product
    await db.insert(products).values({
      id: configProduct.id,
      slug: configProduct.slug,
      brand: configProduct.brand,
      active: configProduct.active,
      nameEn: configProduct.name.en,
      nameDe: configProduct.name.de,
      originEn: configProduct.origin?.en || null,
      originDe: configProduct.origin?.de || null,
      notesEn: configProduct.notes?.en || null,
      notesDe: configProduct.notes?.de || null,
      descriptionEn: configProduct.description?.en || null,
      descriptionDe: configProduct.description?.de || null,
      basePrice: configProduct.basePrice,
      currency: configProduct.currency,
      stockQuantity: configProduct.stockQuantity || 100,
      lowStockThreshold: configProduct.lowStockThreshold || 10,
      trackInventory: true,
      image: configProduct.image || null,
      badge: configProduct.badge || null,
      sortOrder: 0,
      attributes: configProduct.attributes ? JSON.stringify(configProduct.attributes) : null,
      averageRating: configProduct.averageRating || 0,
      reviewCount: configProduct.reviewCount || 0,
      createdAt: now,
      updatedAt: now,
    });

    console.log(`✅ Inserted product: ${configProduct.name.en}`);

    // Insert variants
    for (let i = 0; i < configProduct.variants.length; i++) {
      const variant = configProduct.variants[i];
      const variantId = `${configProduct.id}-${variant.id}`;

      await db.insert(productVariants).values({
        id: variantId,
        productId: configProduct.id,
        nameEn: variant.name.en,
        nameDe: variant.name.de,
        priceModifier: variant.priceModifier,
        sku: variant.sku || null,
        stockQuantity: null, // Use product-level stock
        sortOrder: i,
        active: true,
        weight: variant.weight || null,
        createdAt: now,
        updatedAt: now,
      });

      console.log(`   └─ Variant: ${variant.name.en}`);
    }
  }

  console.log('\n✨ Product seeding complete!');
  process.exit(0);
}

seedProducts().catch((error) => {
  console.error('❌ Seeding failed:', error);
  process.exit(1);
});
