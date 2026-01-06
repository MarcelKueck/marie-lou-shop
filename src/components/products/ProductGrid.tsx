'use client';

import { useTranslations } from 'next-intl';
import { Product } from '@/config/products/types';
import { ProductCard } from './ProductCard';
import styles from './ProductGrid.module.css';

interface ProductGridProps {
  products: Product[];
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
