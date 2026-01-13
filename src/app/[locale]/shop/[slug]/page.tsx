'use client';

import { useState, useEffect, use } from 'react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { notFound, useRouter } from 'next/navigation';
import { useBrand } from '@/hooks/useBrand';
import { useCart } from '@/hooks/useCart';
import Navigation from '@/components/layout/Navigation';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/cart/CartDrawer';
import { ReviewList } from '@/components/reviews';
import styles from './product.module.css';

// Subscription intervals (mirrored from lib/subscriptions.ts for client use)
const SUBSCRIPTION_INTERVALS = [
  { value: 2, unit: 'week', label: { de: 'Alle 2 Wochen', en: 'Every 2 weeks' } },
  { value: 4, unit: 'week', label: { de: 'Alle 4 Wochen', en: 'Every 4 weeks' } },
  { value: 6, unit: 'week', label: { de: 'Alle 6 Wochen', en: 'Every 6 weeks' } },
  { value: 8, unit: 'week', label: { de: 'Alle 8 Wochen', en: 'Every 8 weeks' } },
];

const SUBSCRIPTION_DISCOUNT_PERCENT = 10;

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
  image: string | null;
  badge: string | null;
  attributes: Record<string, unknown> | null;
  variants: ProductVariant[];
}

interface ProductPageProps {
  params: Promise<{ slug: string; locale: string }>;
}

export default function ProductPage({ params }: ProductPageProps) {
  const { slug } = use(params);
  const { brand } = useBrand();
  const locale = useLocale() as 'de' | 'en';
  const t = useTranslations('productPage');
  const tSub = useTranslations('subscriptions');
  const tCommon = useTranslations('products');
  const router = useRouter();
  const { addItem } = useCart();
  
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Subscription state
  const [purchaseMode, setPurchaseMode] = useState<'one-time' | 'subscription'>('one-time');
  const [selectedInterval, setSelectedInterval] = useState(SUBSCRIPTION_INTERVALS[1]); // Default: 4 weeks
  const [isSubscribing, setIsSubscribing] = useState(false);

  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await fetch(`/api/products?slug=${slug}`);
        if (res.ok) {
          const data = await res.json();
          setProduct(data.product);
        }
      } catch (error) {
        console.error('Failed to fetch product:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchProduct();
  }, [slug]);

  if (loading) {
    return (
      <div className={`theme-${brand.id}`}>
        <Navigation onCartClick={() => setIsCartOpen(true)} />
        <main className={styles.main}>
          <div style={{ textAlign: 'center', padding: '100px 20px', color: '#666' }}>
            Loading...
          </div>
        </main>
        <Footer />
        <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      </div>
    );
  }

  if (!product) {
    notFound();
  }

  const selectedVariant = product.variants.find(v => v.id === selectedVariantId) || product.variants[0];
  const basePrice = (product.basePrice + (selectedVariant?.priceModifier || 0)) / 100;
  const subscriptionPrice = basePrice * (1 - SUBSCRIPTION_DISCOUNT_PERCENT / 100);
  const price = purchaseMode === 'subscription' ? subscriptionPrice : basePrice;
  const totalPrice = price * quantity;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(locale === 'de' ? 'de-DE' : 'en-US', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      variantId: selectedVariant.id,
      quantity,
    });
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const handleSubscribe = async () => {
    setIsSubscribing(true);
    try {
      // Check if user is logged in first
      const authRes = await fetch('/api/auth/me');
      if (!authRes.ok) {
        // Redirect to login, then back to subscribe page
        const subscribeUrl = `/${locale}/subscribe?product=${product.id}&variant=${selectedVariant.id}&quantity=${quantity}&interval=${selectedInterval.value}&unit=${selectedInterval.unit}`;
        router.push(`/${locale}/account/login?redirect=${encodeURIComponent(subscribeUrl)}`);
        return;
      }

      // Redirect to subscription creation page
      router.push(`/${locale}/subscribe?product=${product.id}&variant=${selectedVariant.id}&quantity=${quantity}&interval=${selectedInterval.value}&unit=${selectedInterval.unit}`);
    } catch (error) {
      console.error('Subscription error:', error);
    } finally {
      setIsSubscribing(false);
    }
  };

  const badgeLabels: Record<string, Record<'de' | 'en', string>> = {
    bestseller: { de: 'Bestseller', en: 'Bestseller' },
    new: { de: 'Neu', en: 'New' },
    limited: { de: 'Limitiert', en: 'Limited' },
  };

  const roastLevelLabels: Record<string, Record<'de' | 'en', string>> = {
    light: { de: 'Hell', en: 'Light' },
    medium: { de: 'Mittel', en: 'Medium' },
    'medium-dark': { de: 'Mittel-Dunkel', en: 'Medium-Dark' },
    dark: { de: 'Dunkel', en: 'Dark' },
  };

  const processLabels: Record<string, Record<'de' | 'en', string>> = {
    washed: { de: 'Gewaschen', en: 'Washed' },
    natural: { de: 'Natural', en: 'Natural' },
    honey: { de: 'Honey', en: 'Honey' },
  };

  return (
    <div className={`theme-${brand.id}`}>
      <Navigation onCartClick={() => setIsCartOpen(true)} />

      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.productGrid}>
            {/* Product Image */}
            <div className={styles.imageSection}>
              <div className={styles.imageWrapper}>
                {product.image ? (
                  <Image
                    src={product.image}
                    alt={product.name[locale]}
                    fill
                    className={styles.image}
                    sizes="(max-width: 768px) 100vw, 50vw"
                    priority
                  />
                ) : (
                  <div className={styles.placeholder} />
                )}
                {product.badge && (
                  <span className={styles.badge}>{badgeLabels[product.badge][locale]}</span>
                )}
              </div>
            </div>

            {/* Product Info */}
            <div className={styles.infoSection}>
              <div className={styles.header}>
                <p className={styles.origin}>{product.origin?.[locale] || ''}</p>
                <h1 className={styles.name}>{product.name[locale]}</h1>
                <p className={styles.notes}>{product.notes?.[locale] || ''}</p>
              </div>

              <div className={styles.priceSection}>
                <span className={styles.price}>{formatPrice(price)}</span>
                <span className={styles.priceUnit}>/ {selectedVariant?.weight || '250g'}</span>
              </div>

              <p className={styles.description}>{product.description?.[locale] || ''}</p>

              {/* Variant Selector */}
              <div className={styles.variantSection}>
                <label className={styles.variantLabel}>{t('selectVariant')}</label>
                <div className={styles.variantGrid}>
                  {product.variants.map((variant) => (
                    <button
                      key={variant.id}
                      className={`${styles.variantButton} ${
                        (selectedVariantId || product.variants[0].id) === variant.id
                          ? styles.variantSelected
                          : ''
                      }`}
                      onClick={() => setSelectedVariantId(variant.id)}
                    >
                      {variant.name[locale]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity Selector */}
              <div className={styles.quantitySection}>
                <label className={styles.quantityLabel}>{t('quantity')}</label>
                <div className={styles.quantityControls}>
                  <button
                    className={styles.quantityButton}
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    −
                  </button>
                  <span className={styles.quantityValue}>{quantity}</span>
                  <button
                    className={styles.quantityButton}
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Purchase Mode Toggle */}
              <div className={styles.purchaseModeSection}>
                <div className={styles.purchaseModeToggle}>
                  <button
                    className={`${styles.modeButton} ${purchaseMode === 'one-time' ? styles.modeActive : ''}`}
                    onClick={() => setPurchaseMode('one-time')}
                  >
                    {tSub('oneTimePurchase') || (locale === 'de' ? 'Einmalkauf' : 'One-time purchase')}
                  </button>
                  <button
                    className={`${styles.modeButton} ${styles.subscribeMode} ${purchaseMode === 'subscription' ? styles.modeActive : ''}`}
                    onClick={() => setPurchaseMode('subscription')}
                  >
                    <span className={styles.saveBadge}>-{SUBSCRIPTION_DISCOUNT_PERCENT}%</span>
                    {tSub('subscribeAndSave')}
                  </button>
                </div>

                {purchaseMode === 'subscription' && (
                  <div className={styles.subscriptionOptions}>
                    <label className={styles.intervalLabel}>{tSub('selectFrequency')}</label>
                    <div className={styles.intervalGrid}>
                      {SUBSCRIPTION_INTERVALS.map((interval) => (
                        <button
                          key={`${interval.value}-${interval.unit}`}
                          className={`${styles.intervalButton} ${
                            selectedInterval.value === interval.value ? styles.intervalSelected : ''
                          }`}
                          onClick={() => setSelectedInterval(interval)}
                        >
                          {interval.label[locale]}
                        </button>
                      ))}
                    </div>
                    <p className={styles.subscriptionBenefits}>
                      ✓ {tSub('subscriptionBenefits')}
                    </p>
                  </div>
                )}
              </div>

              {/* Add to Cart / Subscribe */}
              <div className={styles.addToCartSection}>
                {purchaseMode === 'one-time' ? (
                  <button
                    className={`${styles.addToCartButton} ${isAdded ? styles.added : ''}`}
                    onClick={handleAddToCart}
                  >
                    {isAdded ? tCommon('added') : `${tCommon('addToCart')} — ${formatPrice(totalPrice)}`}
                  </button>
                ) : (
                  <button
                    className={`${styles.addToCartButton} ${styles.subscribeButton}`}
                    onClick={handleSubscribe}
                    disabled={isSubscribing}
                  >
                    {isSubscribing 
                      ? (locale === 'de' ? 'Wird geladen...' : 'Loading...') 
                      : `${tSub('subscribeAndSave')} — ${formatPrice(totalPrice)}`}
                  </button>
                )}
              </div>

              {/* Product Attributes */}
              {product.attributes && (product.attributes as Record<string, unknown>).type === 'coffee' && (
                <div className={styles.attributes}>
                  <h3 className={styles.attributesTitle}>{t('details')}</h3>
                  <dl className={styles.attributesList}>
                    {(product.attributes as Record<string, string>).roastLevel && (
                      <div className={styles.attributeItem}>
                        <dt>{t('roastLevel')}</dt>
                        <dd>{roastLevelLabels[(product.attributes as Record<string, string>).roastLevel]?.[locale] || (product.attributes as Record<string, string>).roastLevel}</dd>
                      </div>
                    )}
                    {(product.attributes as Record<string, string>).process && (
                      <div className={styles.attributeItem}>
                        <dt>{t('process')}</dt>
                        <dd>{processLabels[(product.attributes as Record<string, string>).process]?.[locale] || (product.attributes as Record<string, string>).process}</dd>
                      </div>
                    )}
                    {(product.attributes as Record<string, string>).altitude && (
                      <div className={styles.attributeItem}>
                        <dt>{t('altitude')}</dt>
                        <dd>{(product.attributes as Record<string, string>).altitude}</dd>
                      </div>
                    )}
                    {(product.attributes as Record<string, string>).variety && (
                      <div className={styles.attributeItem}>
                        <dt>{t('variety')}</dt>
                        <dd>{(product.attributes as Record<string, string>).variety}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              )}

              {product.attributes && (product.attributes as Record<string, unknown>).type === 'tea' && (
                <div className={styles.attributes}>
                  <h3 className={styles.attributesTitle}>{t('details')}</h3>
                  <dl className={styles.attributesList}>
                    {(product.attributes as Record<string, string>).teaType && (
                      <div className={styles.attributeItem}>
                        <dt>{t('teaType')}</dt>
                        <dd>{(product.attributes as Record<string, string>).teaType}</dd>
                      </div>
                    )}
                    {(product.attributes as Record<string, string>).caffeine && (
                      <div className={styles.attributeItem}>
                        <dt>{t('caffeine')}</dt>
                        <dd>{(product.attributes as Record<string, string>).caffeine}</dd>
                      </div>
                    )}
                    {(product.attributes as Record<string, string>).steepTime && (
                      <div className={styles.attributeItem}>
                        <dt>{t('steepTime')}</dt>
                        <dd>{(product.attributes as Record<string, string>).steepTime}</dd>
                      </div>
                    )}
                    {(product.attributes as Record<string, string>).temperature && (
                      <div className={styles.attributeItem}>
                        <dt>{t('temperature')}</dt>
                        <dd>{(product.attributes as Record<string, string>).temperature}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className={styles.reviewsSection}>
          <div className={styles.container}>
            <ReviewList productSlug={product.id} />
          </div>
        </div>
      </main>

      <Footer />

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
}
