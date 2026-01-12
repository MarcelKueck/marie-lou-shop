'use client';

import { useTranslations } from 'next-intl';
import { ProductCard } from './ProductCard';
import styles from './ProductGrid.module.css';
import type { Product } from '@/lib/products';

// For variants from DB which might have slightly different structure
interface ProductVariant {
  id: string;
  name: { en: string; de: string };
  priceModifier: number;
  weight?: string | null;
}

// Flexible product type that accepts config Product or DB products
type FlexibleProduct = Product | {
  id: string;
  slug: string;
  brand: 'coffee' | 'tea';
  active?: boolean;
  name: { en: string; de: string };
  origin?: { en: string | null; de: string | null };
  notes?: { en: string | null; de: string | null };
  description?: { en: string | null; de: string | null };
  basePrice: number;
  currency?: string;
  image?: string | null;
  badge?: string | null;
  averageRating?: number | null;
  reviewCount?: number | null;
  stockQuantity?: number | null;
  lowStockThreshold?: number | null;
  attributes?: unknown;
  variants: ProductVariant[];
};

interface ProductGridProps {
  products: FlexibleProduct[];
  title?: string;
  showBadge?: boolean;
}

export function ProductGrid({ products, title, showBadge = true }: ProductGridProps) {
  const t = useTranslations('products');

  if (products.length === 0) {
    return null;
  }

  return (
    <section className={styles.productGrid}>
      <div className={styles.container}>
        {showBadge && <span className={styles.badge}>{t('badge')}</span>}
        {title && <h2 className={styles.title}>{title}</h2>}
        {!title && <h2 className={styles.title}>{t('title')}</h2>}
        <p className={styles.subtitle}>{t('subtitle')}</p>

        <div className={styles.grid}>
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default ProductGrid;
