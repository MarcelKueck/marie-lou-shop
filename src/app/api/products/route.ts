import { NextRequest, NextResponse } from 'next/server';
import { getAllProducts, getProductsByBrand, getProductBySlug, getProductById } from '@/lib/products';

// GET - Public products API
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const brand = searchParams.get('brand') as 'coffee' | 'tea' | null;
    const slug = searchParams.get('slug');
    const id = searchParams.get('id');

    // Get single product by slug
    if (slug) {
      const product = await getProductBySlug(slug);
      if (!product) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
      }
      return NextResponse.json({ product });
    }

    // Get single product by ID
    if (id) {
      const product = await getProductById(id);
      if (!product) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
      }
      return NextResponse.json({ product });
    }

    // Get products by brand or all products
    let products;
    if (brand && (brand === 'coffee' || brand === 'tea')) {
      products = await getProductsByBrand(brand);
    } else {
      products = await getAllProducts();
    }

    return NextResponse.json({ 
      products,
      total: products.length,
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}
