import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { products, productVariants, DbProduct, DbProductVariant } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { randomUUID } from 'crypto';

// Transform DB product to API format
function transformProduct(product: DbProduct & { variants?: DbProductVariant[] }) {
  return {
    id: product.id,
    slug: product.slug,
    brand: product.brand,
    active: product.active,
    name: { en: product.nameEn, de: product.nameDe },
    origin: product.originEn || product.originDe ? { en: product.originEn, de: product.originDe } : null,
    notes: product.notesEn || product.notesDe ? { en: product.notesEn, de: product.notesDe } : null,
    description: product.descriptionEn || product.descriptionDe ? { en: product.descriptionEn, de: product.descriptionDe } : null,
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
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
    variants: product.variants?.map(v => ({
      id: v.id,
      nameEn: v.nameEn,
      nameDe: v.nameDe,
      name: { en: v.nameEn, de: v.nameDe },
      priceModifier: v.priceModifier,
      sku: v.sku,
      stockQuantity: v.stockQuantity,
      sortOrder: v.sortOrder,
      active: v.active,
      weight: v.weight,
    })) || [],
  };
}

// GET - Get single product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAdmin = await isAdminAuthenticated();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    
    const product = await db.query.products.findFirst({
      where: eq(products.id, id),
      with: { variants: true },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ product: transformProduct(product) });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}

// PUT - Update product
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAdmin = await isAdminAuthenticated();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();

    // Check if product exists
    const existingProduct = await db.query.products.findFirst({
      where: eq(products.id, id),
    });

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const {
      slug,
      brand,
      active,
      name,
      origin,
      notes,
      description,
      basePrice,
      currency,
      stockQuantity,
      lowStockThreshold,
      trackInventory,
      image,
      badge,
      sortOrder,
      attributes,
      variants,
    } = body;

    const now = new Date();

    // Update product
    await db.update(products)
      .set({
        slug: slug ?? existingProduct.slug,
        brand: brand ?? existingProduct.brand,
        active: active ?? existingProduct.active,
        nameEn: name?.en ?? existingProduct.nameEn,
        nameDe: name?.de ?? existingProduct.nameDe,
        originEn: origin?.en ?? existingProduct.originEn,
        originDe: origin?.de ?? existingProduct.originDe,
        notesEn: notes?.en ?? existingProduct.notesEn,
        notesDe: notes?.de ?? existingProduct.notesDe,
        descriptionEn: description?.en ?? existingProduct.descriptionEn,
        descriptionDe: description?.de ?? existingProduct.descriptionDe,
        basePrice: basePrice ?? existingProduct.basePrice,
        currency: currency ?? existingProduct.currency,
        stockQuantity: stockQuantity ?? existingProduct.stockQuantity,
        lowStockThreshold: lowStockThreshold ?? existingProduct.lowStockThreshold,
        trackInventory: trackInventory ?? existingProduct.trackInventory,
        image: image !== undefined ? image : existingProduct.image,
        badge: badge !== undefined ? badge : existingProduct.badge,
        sortOrder: sortOrder ?? existingProduct.sortOrder,
        attributes: attributes !== undefined ? (attributes ? JSON.stringify(attributes) : null) : existingProduct.attributes,
        updatedAt: now,
      })
      .where(eq(products.id, id));

    // Update variants if provided
    if (variants && Array.isArray(variants)) {
      // Get existing variants
      const existingVariants = await db.query.productVariants.findMany({
        where: eq(productVariants.productId, id),
      });

      const existingVariantIds = new Set(existingVariants.map(v => v.id));
      const newVariantIds = new Set(variants.map((v: { id?: string }) => v.id).filter(Boolean));

      // Delete variants that are no longer present
      for (const existingVariant of existingVariants) {
        if (!newVariantIds.has(existingVariant.id)) {
          await db.delete(productVariants).where(eq(productVariants.id, existingVariant.id));
        }
      }

      // Update or insert variants
      for (let i = 0; i < variants.length; i++) {
        const v = variants[i];
        const variantId = v.id || `${id}-${randomUUID().slice(0, 8)}`;

        if (existingVariantIds.has(variantId)) {
          // Update existing variant
          await db.update(productVariants)
            .set({
              nameEn: v.name?.en ?? v.nameEn,
              nameDe: v.name?.de ?? v.nameDe,
              priceModifier: v.priceModifier ?? 0,
              sku: v.sku ?? null,
              stockQuantity: v.stockQuantity ?? null,
              sortOrder: i,
              active: v.active !== false,
              weight: v.weight ?? null,
              updatedAt: now,
            })
            .where(eq(productVariants.id, variantId));
        } else {
          // Insert new variant
          await db.insert(productVariants).values({
            id: variantId,
            productId: id,
            nameEn: v.name?.en ?? v.nameEn,
            nameDe: v.name?.de ?? v.nameDe,
            priceModifier: v.priceModifier ?? 0,
            sku: v.sku ?? null,
            stockQuantity: v.stockQuantity ?? null,
            sortOrder: i,
            active: v.active !== false,
            weight: v.weight ?? null,
            createdAt: now,
            updatedAt: now,
          });
        }
      }
    }

    // Fetch updated product with variants
    const updatedProduct = await db.query.products.findFirst({
      where: eq(products.id, id),
      with: { variants: true },
    });

    return NextResponse.json({ product: transformProduct(updatedProduct!) });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

// DELETE - Delete product
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAdmin = await isAdminAuthenticated();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;

    // Check if product exists
    const existingProduct = await db.query.products.findFirst({
      where: eq(products.id, id),
    });

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Delete variants first (cascade should handle this, but being explicit)
    await db.delete(productVariants).where(eq(productVariants.productId, id));

    // Delete product
    await db.delete(products).where(eq(products.id, id));

    return NextResponse.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
