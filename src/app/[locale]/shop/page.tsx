'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useBrand } from '@/hooks/useBrand';
import Navigation from '@/components/layout/Navigation';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/cart/CartDrawer';
import ProductGrid from '@/components/products/ProductGrid';
import styles from './shop.module.css';

// Product type for API response
interface ProductVariant {
  id: string;
  name: { en: string; de: string };
  priceModifier: number;
  weight: string | null;
}

interface Product {
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
  image: string | null;
  badge: string | null;
  averageRating: number | null;
  reviewCount: number | null;
  attributes: Record<string, unknown> | null;
  variants: ProductVariant[];
}

export default function ShopPage() {
  const { brand } = useBrand();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const t = useTranslations('shopPage');
  
  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch(`/api/products?brand=${brand.id}`);
        if (res.ok) {
          const data = await res.json();
          setProducts(data.products);
        }
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchProducts();
  }, [brand.id]);

  return (
    <div className={`theme-${brand.id}`}>
      <Navigation onCartClick={() => setIsCartOpen(true)} />

      <main className={styles.main}>
        {/* Hero Section */}
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <h1>{t('title')}</h1>
            <p className={styles.subtitle}>{t('subtitle')}</p>
          </div>
        </section>

        {/* Products Section */}
        <section className={styles.productsSection}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#666' }}>
              Loading products...
            </div>
          ) : (
            <ProductGrid products={products} showBadge={false} />
          )}
        </section>
      </main>

      <Footer />

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
}
