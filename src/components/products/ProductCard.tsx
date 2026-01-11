'use client';

import { useLocale, useTranslations } from 'next-intl';
import Image from 'next/image';
import { Link } from '@/i18n/routing';
import { useCart } from '@/hooks/useCart';
import styles from './ProductCard.module.css';

// Flexible product interface that works with both config and DB products
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
  name: { en: string; de: string };
  origin?: { en: string | null; de: string | null };
  notes?: { en: string | null; de: string | null };
  basePrice: number;
  image?: string | null;
  badge?: string | null;
  variants: ProductVariant[];
}

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const locale = useLocale() as 'de' | 'en';
  const t = useTranslations('products');
  const { addItem } = useCart();

  const name = product.name[locale];
  const origin = product.origin?.[locale] || '';
  const defaultVariant = product.variants[0];
  const variantPrice = (product.basePrice + (defaultVariant?.priceModifier || 0)) / 100;

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      variantId: defaultVariant.id,
      quantity: 1,
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(locale === 'de' ? 'de-DE' : 'en-US', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };

  const badgeLabels: Record<string, Record<'de' | 'en', string>> = {
    bestseller: { de: 'Bestseller', en: 'Bestseller' },
    new: { de: 'Neu', en: 'New' },
    limited: { de: 'Limitiert', en: 'Limited' },
  };

  return (
    <div className={styles.card}>
      <Link href={`/shop/${product.slug}`} className={styles.imageContainer}>
        {product.image ? (
          <Image
            src={product.image}
            alt={name}
            fill
            className={styles.image}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className={styles.placeholder} />
        )}
        {product.badge && (
          <span className={styles.badge}>{badgeLabels[product.badge][locale]}</span>
        )}
      </Link>
      
      <div className={styles.content}>
        <Link href={`/shop/${product.slug}`} className={styles.nameLink}>
          <h3 className={styles.name}>{name}</h3>
        </Link>
        <p className={styles.tagline}>{origin}</p>
        
        <div className={styles.footer}>
          <div className={styles.price}>
            <span className={styles.priceValue}>{formatPrice(variantPrice)}</span>
            <span className={styles.priceUnit}>/ {defaultVariant.weight}</span>
          </div>
          
          <button 
            onClick={handleAddToCart}
            className={styles.addButton}
            aria-label={t('addToCart')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
