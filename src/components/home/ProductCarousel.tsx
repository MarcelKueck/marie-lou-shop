'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { ProductCard } from '@/components/products/ProductCard';
import styles from './ProductCarousel.module.css';

interface ProductVariant {
  id: string;
  name: { en: string; de: string };
  priceModifier: number;
  weight?: string | null;
}

interface Product {
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
  variants: ProductVariant[];
}

interface ProductCarouselProps {
  products: Product[];
  isLoading?: boolean;
}

export function ProductCarousel({ products, isLoading = false }: ProductCarouselProps) {
  const t = useTranslations('products');
  const carouselRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [showNavigation, setShowNavigation] = useState(false);

  // Check scroll position to update navigation buttons
  const checkScrollPosition = () => {
    if (!carouselRef.current) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    setShowNavigation(scrollWidth > clientWidth);
  };

  useEffect(() => {
    checkScrollPosition();
    window.addEventListener('resize', checkScrollPosition);
    return () => window.removeEventListener('resize', checkScrollPosition);
  }, [products]);

  useEffect(() => {
    const carousel = carouselRef.current;
    if (carousel) {
      carousel.addEventListener('scroll', checkScrollPosition);
      // Initial check after products load
      setTimeout(checkScrollPosition, 100);
      return () => carousel.removeEventListener('scroll', checkScrollPosition);
    }
  }, [products]);

  const scroll = (direction: 'left' | 'right') => {
    if (!carouselRef.current) return;
    
    const cardWidth = 360; // Approximate card width + gap
    const scrollAmount = direction === 'left' ? -cardWidth : cardWidth;
    
    carouselRef.current.scrollBy({
      left: scrollAmount,
      behavior: 'smooth',
    });
  };

  if (isLoading) {
    return (
      <section className={styles.productCarousel}>
        <div className={styles.container}>
          <span className={styles.badge}>{t('badge')}</span>
          <h2 className={styles.title}>{t('title')}</h2>
          <p className={styles.subtitle}>{t('subtitle')}</p>
          
          <div className={styles.loadingGrid}>
            {[1, 2, 3].map((i) => (
              <div key={i} className={styles.loadingCard}>
                <div className={styles.loadingImage} />
                <div className={styles.loadingText} />
                <div className={styles.loadingTextShort} />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <section className={styles.productCarousel}>
      <div className={styles.container}>
        <span className={styles.badge}>{t('badge')}</span>
        <h2 className={styles.title}>{t('title')}</h2>
        <p className={styles.subtitle}>{t('subtitle')}</p>

        <div className={styles.carouselWrapper}>
          {/* Navigation Buttons */}
          {showNavigation && (
            <>
              <button
                className={`${styles.navButton} ${styles.navButtonLeft} ${!canScrollLeft ? styles.hidden : ''}`}
                onClick={() => scroll('left')}
                aria-label="Previous products"
                disabled={!canScrollLeft}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              
              <button
                className={`${styles.navButton} ${styles.navButtonRight} ${!canScrollRight ? styles.hidden : ''}`}
                onClick={() => scroll('right')}
                aria-label="Next products"
                disabled={!canScrollRight}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </>
          )}

          {/* Carousel Track */}
          <div 
            ref={carouselRef}
            className={styles.carousel}
          >
            {products.map((product) => (
              <div key={product.id} className={styles.carouselItem}>
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>

        {/* Scroll Indicator (dots) for mobile */}
        {products.length > 1 && (
          <div className={styles.scrollIndicator}>
            <span className={styles.scrollHint}>
              {t('swipeToSeeMore') || 'Swipe to see more'}
            </span>
          </div>
        )}
      </div>
    </section>
  );
}

export default ProductCarousel;
