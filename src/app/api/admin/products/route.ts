import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { products, productVariants, DbProduct, DbProductVariant } from '@/db/schema';
import { eq, desc, asc } from 'drizzle-orm';
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

// GET - List all products
export async function GET(request: NextRequest) {
  const isAdmin = await isAdminAuthenticated();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const brand = searchParams.get('brand');
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const allProducts = await db.query.products.findMany({
      with: { variants: true },
      orderBy: [asc(products.sortOrder), desc(products.createdAt)],
    });

    let filtered = allProducts;
    
    if (brand) {
      filtered = filtered.filter(p => p.brand === brand);
    }
    
    if (!includeInactive) {
      filtered = filtered.filter(p => p.active);
    }

    return NextResponse.json({
      products: filtered.map(transformProduct),
      total: filtered.length,
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

// POST - Create new product
export async function POST(request: NextRequest) {
  const isAdmin = await isAdminAuthenticated();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      slug,
      brand,
      active = true,
      name,
      origin,
      notes,
      description,
      basePrice,
      currency = 'EUR',
      stockQuantity = 100,
      lowStockThreshold = 10,
      trackInventory = true,
      image,
      badge,
      sortOrder = 0,
      attributes,
      variants = [],
    } = body;

    // Validate required fields
    if (!slug || !brand || !name?.en || !name?.de || basePrice === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: slug, brand, name.en, name.de, basePrice' },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const existingProduct = await db.query.products.findFirst({
      where: eq(products.slug, slug),
    });

    if (existingProduct) {
      return NextResponse.json({ error: 'Product with this slug already exists' }, { status: 409 });
    }

    const now = new Date();
    const productId = slug; // Use slug as ID for simplicity

    // Insert product
    await db.insert(products).values({
      id: productId,
      slug,
      brand,
      active,
      nameEn: name.en,
      nameDe: name.de,
      originEn: origin?.en || null,
      originDe: origin?.de || null,
      notesEn: notes?.en || null,
      notesDe: notes?.de || null,
      descriptionEn: description?.en || null,
      descriptionDe: description?.de || null,
      basePrice,
      currency,
      stockQuantity,
      lowStockThreshold,
      trackInventory,
      image: image || null,
      badge: badge || null,
      sortOrder,
      attributes: attributes ? JSON.stringify(attributes) : null,
      averageRating: 0,
      reviewCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    // Insert variants
    for (let i = 0; i < variants.length; i++) {
      const v = variants[i];
      await db.insert(productVariants).values({
        id: `${productId}-${v.id || randomUUID().slice(0, 8)}`,
        productId,
        nameEn: v.name?.en || v.nameEn,
        nameDe: v.name?.de || v.nameDe,
        priceModifier: v.priceModifier || 0,
        sku: v.sku || null,
        stockQuantity: v.stockQuantity || null,
        sortOrder: i,
        active: v.active !== false,
        weight: v.weight || null,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Fetch created product with variants
    const createdProduct = await db.query.products.findFirst({
      where: eq(products.id, productId),
      with: { variants: true },
    });

    return NextResponse.json({ product: transformProduct(createdProduct!) }, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
