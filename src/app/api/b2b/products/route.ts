import { NextResponse } from 'next/server';
import { requireB2BAuth } from '@/lib/b2b-auth';
import { db } from '@/db';
import { products, productVariants } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET() {
  try {
    // Verify B2B authentication
    const company = await requireB2BAuth();
    
    if (!company) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get products based on company's brand preference
    let brandFilter: 'coffee' | 'tea' | undefined;
    if (company.preferredBrand === 'coffee') {
      brandFilter = 'coffee';
    } else if (company.preferredBrand === 'tea') {
      brandFilter = 'tea';
    }
    // 'both' or null means show all products
    
    // Fetch all active products
    const productList = await db
      .select()
      .from(products)
      .where(
        brandFilter 
          ? and(eq(products.brand, brandFilter), eq(products.active, true))
          : eq(products.active, true)
      );
    
    // Fetch all variants
    const variantList = await db.select().from(productVariants);
    const variantsByProduct = new Map<string, typeof variantList>();
    for (const variant of variantList) {
      const existing = variantsByProduct.get(variant.productId) || [];
      existing.push(variant);
      variantsByProduct.set(variant.productId, existing);
    }
    
    // Transform products for the response
    const formattedProducts = productList.map(p => {
      const variants = variantsByProduct.get(p.id) || [];
      // Use the first variant for default price
      const defaultVariant = variants[0];
      const price = p.basePrice + (defaultVariant?.priceModifier || 0);
      const weightGrams = parseInt(defaultVariant?.weight || '250') || 250;
      
      return {
        id: p.id,
        name: p.nameEn,
        slug: p.slug,
        description: p.descriptionEn || '',
        price,
        weightGrams,
        brand: p.brand,
        imageUrl: p.image || '',
        available: (p.stockQuantity ?? 0) > 0,
        variants: variants.map(v => ({
          id: v.id,
          name: v.nameEn,
          weight: v.weight,
          priceModifier: v.priceModifier,
        })),
      };
    });
    
    return NextResponse.json({ products: formattedProducts });
    
  } catch (error) {
    console.error('Error fetching B2B products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
