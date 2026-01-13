'use client';

import { useState, useEffect, use } from 'react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { useBrand } from '@/hooks/useBrand';
import Navigation from '@/components/layout/Navigation';
import Footer from '@/components/layout/Footer';
import styles from './subscribe.module.css';

// Subscription intervals
const SUBSCRIPTION_INTERVALS = [
  { value: 2, unit: 'week', label: { de: 'Alle 2 Wochen', en: 'Every 2 weeks' } },
  { value: 4, unit: 'week', label: { de: 'Alle 4 Wochen', en: 'Every 4 weeks' } },
  { value: 6, unit: 'week', label: { de: 'Alle 6 Wochen', en: 'Every 6 weeks' } },
  { value: 8, unit: 'week', label: { de: 'Alle 8 Wochen', en: 'Every 8 weeks' } },
];

interface Product {
  id: string;
  name: { en: string; de: string };
  image: string | null;
  basePrice: number;
  variants: { id: string; name: { en: string; de: string }; priceModifier: number }[];
}

interface ShippingAddress {
  firstName: string;
  lastName: string;
  line1: string;
  line2: string;
  city: string;
  postalCode: string;
  country: string;
}

export default function SubscribePage({ params }: { params: Promise<{ locale: string }> }) {
  use(params); // Required for Next.js dynamic params
  const { brand } = useBrand();
  const locale = useLocale() as 'de' | 'en';
  const t = useTranslations('subscriptions');
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get product info from URL params
  const productId = searchParams.get('product');
  const variantId = searchParams.get('variant');
  const initialQuantity = parseInt(searchParams.get('quantity') || '1', 10);
  const initialInterval = parseInt(searchParams.get('interval') || '4', 10);
  const initialUnit = searchParams.get('unit') || 'week';

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [quantity, setQuantity] = useState(initialQuantity);
  const [selectedInterval, setSelectedInterval] = useState(
    SUBSCRIPTION_INTERVALS.find(i => i.value === initialInterval && i.unit === initialUnit) || SUBSCRIPTION_INTERVALS[1]
  );
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    firstName: '',
    lastName: '',
    line1: '',
    line2: '',
    city: '',
    postalCode: '',
    country: 'DE',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Check auth and fetch product
  useEffect(() => {
    async function init() {
      // Check if logged in
      const authRes = await fetch('/api/auth/me');
      if (!authRes.ok) {
        router.push(`/${locale}/account/login?redirect=/${locale}/subscribe?product=${productId}&variant=${variantId}&quantity=${initialQuantity}&interval=${initialInterval}&unit=${initialUnit}`);
        return;
      }
      const authData = await authRes.json();
      setIsLoggedIn(true);

      // Pre-fill name if available
      if (authData.customer) {
        setShippingAddress(prev => ({
          ...prev,
          firstName: authData.customer.firstName || '',
          lastName: authData.customer.lastName || '',
        }));
      }

      // Fetch product
      if (productId) {
        const productRes = await fetch(`/api/products?id=${productId}`);
        if (productRes.ok) {
          const data = await productRes.json();
          setProduct(data.product);
        }
      }
      setLoading(false);
    }
    init();
  }, [productId, variantId, initialQuantity, initialInterval, initialUnit, locale, router]);

  const selectedVariant = product?.variants.find(v => v.id === variantId) || product?.variants[0];
  const unitPrice = product ? (product.basePrice + (selectedVariant?.priceModifier || 0)) : 0;
  const discountedPrice = Math.round(unitPrice * 0.9); // 10% off
  const totalPrice = discountedPrice * quantity;

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat(locale === 'de' ? 'de-DE' : 'en-US', {
      style: 'currency',
      currency: 'EUR',
    }).format(cents / 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/subscriptions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product?.id,
          variantId: selectedVariant?.id,
          quantity,
          intervalCount: selectedInterval.value,
          intervalUnit: selectedInterval.unit,
          shippingAddress,
          locale,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create subscription');
      }

      // Redirect to Stripe checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={`theme-${brand.id}`}>
        <Navigation />
        <main className={styles.main}>
          <div className={styles.container}>
            <div className={styles.loading}>{t('loading')}</div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product || !isLoggedIn) {
    return null;
  }

  return (
    <div className={`theme-${brand.id}`}>
      <Navigation />
      <main className={styles.main}>
        <div className={styles.container}>
          <h1 className={styles.title}>{t('createSubscription') || 'Create Subscription'}</h1>

          <div className={styles.grid}>
            {/* Product Summary */}
            <div className={styles.productSummary}>
              <div className={styles.productCard}>
                {product.image && (
                  <div className={styles.productImage}>
                    <Image src={product.image} alt={product.name[locale]} fill className={styles.image} />
                  </div>
                )}
                <div className={styles.productInfo}>
                  <h2>{product.name[locale]}</h2>
                  <p>{selectedVariant?.name[locale]}</p>
                  <div className={styles.priceRow}>
                    <span className={styles.originalPrice}>{formatPrice(unitPrice)}</span>
                    <span className={styles.discountedPrice}>{formatPrice(discountedPrice)}</span>
                    <span className={styles.saveBadge}>-10%</span>
                  </div>
                </div>
              </div>

              {/* Quantity & Interval */}
              <div className={styles.optionsSection}>
                <div className={styles.optionGroup}>
                  <label>{t('quantity') || 'Quantity'}</label>
                  <div className={styles.quantityControls}>
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1}>−</button>
                    <span>{quantity}</span>
                    <button onClick={() => setQuantity(quantity + 1)}>+</button>
                  </div>
                </div>

                <div className={styles.optionGroup}>
                  <label>{t('selectFrequency')}</label>
                  <div className={styles.intervalOptions}>
                    {SUBSCRIPTION_INTERVALS.map((interval) => (
                      <button
                        key={`${interval.value}-${interval.unit}`}
                        className={`${styles.intervalBtn} ${selectedInterval.value === interval.value ? styles.selected : ''}`}
                        onClick={() => setSelectedInterval(interval)}
                        type="button"
                      >
                        {interval.label[locale]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className={styles.totalSection}>
                <span>{t('perDelivery') || 'Per delivery'}:</span>
                <span className={styles.totalPrice}>{formatPrice(totalPrice)}</span>
              </div>
            </div>

            {/* Shipping Form */}
            <form onSubmit={handleSubmit} className={styles.shippingForm}>
              <h3>{t('shippingAddress') || 'Shipping Address'}</h3>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>{t('firstName') || 'First Name'} *</label>
                  <input
                    type="text"
                    required
                    value={shippingAddress.firstName}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, firstName: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>{t('lastName') || 'Last Name'} *</label>
                  <input
                    type="text"
                    required
                    value={shippingAddress.lastName}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, lastName: e.target.value })}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>{t('addressLine1') || 'Street Address'} *</label>
                <input
                  type="text"
                  required
                  value={shippingAddress.line1}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, line1: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label>{t('addressLine2') || 'Apartment, suite, etc.'}</label>
                <input
                  type="text"
                  value={shippingAddress.line2}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, line2: e.target.value })}
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>{t('postalCode') || 'Postal Code'} *</label>
                  <input
                    type="text"
                    required
                    value={shippingAddress.postalCode}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, postalCode: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>{t('city') || 'City'} *</label>
                  <input
                    type="text"
                    required
                    value={shippingAddress.city}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>{t('country') || 'Country'} *</label>
                <select
                  required
                  value={shippingAddress.country}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, country: e.target.value })}
                >
                  <option value="DE">Germany</option>
                  <option value="AT">Austria</option>
                  <option value="CH">Switzerland</option>
                  <option value="NL">Netherlands</option>
                  <option value="BE">Belgium</option>
                  <option value="FR">France</option>
                </select>
              </div>

              {error && <div className={styles.error}>{error}</div>}

              <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
                {isSubmitting ? (locale === 'de' ? 'Wird verarbeitet...' : 'Processing...') : (t('startSubscription') || 'Start Subscription')}
              </button>

              <p className={styles.benefits}>
                ✓ {t('subscriptionBenefits')}<br />
                ✓ {locale === 'de' ? 'Erste Lieferung innerhalb von 3-5 Tagen' : 'First delivery within 3-5 days'}
              </p>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
