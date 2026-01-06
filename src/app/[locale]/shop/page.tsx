'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useBrand } from '@/hooks/useBrand';
import { getProductsByBrand } from '@/config/products';
import Navigation from '@/components/layout/Navigation';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/cart/CartDrawer';
import ProductGrid from '@/components/products/ProductGrid';
import styles from './shop.module.css';

export default function ShopPage() {
  const { brand } = useBrand();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const t = useTranslations('shopPage');
  
  const products = getProductsByBrand(brand.id);

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
          <ProductGrid products={products} showBadge={false} />
        </section>
      </main>

      <Footer />

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
}
