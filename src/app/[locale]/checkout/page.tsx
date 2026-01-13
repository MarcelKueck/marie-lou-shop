'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Link } from '@/i18n/routing';
import { useBrand } from '@/hooks/useBrand';
import { useCart } from '@/hooks/useCart';
import { REFERRAL_COOKIE_NAME, REFERRAL_DISCOUNT_PERCENT, REFERRAL_MINIMUM_ORDER } from '@/lib/referral';
import Navigation from '@/components/layout/Navigation';
import Footer from '@/components/layout/Footer';
import styles from './checkout.module.css';

// Helper to get cookie value
function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

export default function CheckoutPage() {
  const { brand } = useBrand();
  const locale = useLocale() as 'de' | 'en';
  const t = useTranslations('checkoutPage');
  const tCart = useTranslations('cart');
  const router = useRouter();
  const { items, itemsWithProducts, subtotal } = useCart();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  
  // Gift card state
  const [giftCardCode, setGiftCardCode] = useState('');
  const [giftCardError, setGiftCardError] = useState<string | null>(null);
  const [giftCardLoading, setGiftCardLoading] = useState(false);
  const [appliedGiftCard, setAppliedGiftCard] = useState<{
    id: string;
    code: string;
    balance: number;
    currency: string;
  } | null>(null);

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat(locale === 'de' ? 'de-DE' : 'en-US', {
      style: 'currency',
      currency: 'EUR',
    }).format(cents / 100);
  };

  // Check for referral code cookie
  useEffect(() => {
    const code = getCookie(REFERRAL_COOKIE_NAME);
    if (code) {
      setReferralCode(code);
    }
  }, []);

  // Check if user is logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setIsLoggedIn(!!data.customer);
        }
      } catch {
        setIsLoggedIn(false);
      } finally {
        setCheckingAuth(false);
      }
    };
    checkAuth();
  }, []);

  // Redirect to cart if empty
  useEffect(() => {
    if (items.length === 0) {
      router.push(`/${locale}/cart`);
    }
  }, [items.length, locale, router]);

  // Calculate referral discount - only if logged in AND has referral code
  const hasReferralCode = !!referralCode && subtotal >= REFERRAL_MINIMUM_ORDER;
  const canApplyReferralDiscount = hasReferralCode && isLoggedIn;
  const referralDiscount = canApplyReferralDiscount 
    ? Math.round(subtotal * (REFERRAL_DISCOUNT_PERCENT / 100)) 
    : 0;

  // Calculate gift card discount
  const giftCardDiscount = appliedGiftCard 
    ? Math.min(appliedGiftCard.balance, subtotal - referralDiscount)
    : 0;

  // Apply gift card
  const handleApplyGiftCard = async () => {
    if (!giftCardCode.trim()) {
      setGiftCardError(t('giftCard.enterCode'));
      return;
    }

    setGiftCardLoading(true);
    setGiftCardError(null);

    try {
      const response = await fetch('/api/gift-cards/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: giftCardCode.trim() }),
      });

      const data = await response.json();

      if (!data.valid) {
        setGiftCardError(data.error || t('giftCard.invalid'));
        return;
      }

      setAppliedGiftCard(data.giftCard);
      setGiftCardCode('');
    } catch {
      setGiftCardError(t('giftCard.error'));
    } finally {
      setGiftCardLoading(false);
    }
  };

  const handleRemoveGiftCard = () => {
    setAppliedGiftCard(null);
    setGiftCardError(null);
  };

  const handleCheckout = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items,
          locale,
          referralCode: referralCode || undefined,
          giftCardId: appliedGiftCard?.id,
          giftCardAmount: giftCardDiscount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Checkout failed');
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsLoading(false);
    }
  };

  if (items.length === 0) {
    return null; // Will redirect
  }

  return (
    <div className={`theme-${brand.id}`}>
      <Navigation />

      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.header}>
            <Link href="/cart" className={styles.backLink}>
              ← {t('backToCart')}
            </Link>
            <h1 className={styles.title}>{t('title')}</h1>
          </div>

          <div className={styles.checkoutGrid}>
            {/* Order Summary */}
            <div className={styles.summarySection}>
              <h2 className={styles.sectionTitle}>{t('orderSummary')}</h2>
              
              <div className={styles.itemsList}>
                {itemsWithProducts.map((item) => {
                  // Use rewardId for unique key if it's a free reward
                  const itemKey = item.isFreeReward && item.rewardId 
                    ? `reward-${item.rewardId}` 
                    : `${item.productId}-${item.variantId}`;
                  
                  return (
                  <div key={itemKey} className={`${styles.summaryItem} ${item.isFreeReward ? styles.freeItem : ''}`}>
                    <div className={styles.itemImage}>
                      {item.product.image ? (
                        <Image
                          src={item.product.image}
                          alt={item.product.name[locale]}
                          fill
                          className={styles.image}
                        />
                      ) : (
                        <div className={styles.imagePlaceholder} />
                      )}
                      {item.isFreeReward && (
                        <span className={styles.freeBadge}>🎁</span>
                      )}
                    </div>
                    <div className={styles.itemInfo}>
                      <h3>{item.product.name[locale]}</h3>
                      <p>{item.variant.name[locale]}</p>
                      <p className={styles.itemQuantity}>× {item.quantity}</p>
                    </div>
                    <p className={styles.itemTotal}>
                      {item.isFreeReward ? (
                        <span className={styles.freePrice}>{locale === 'de' ? 'Gratis' : 'Free'}</span>
                      ) : (
                        formatPrice(item.totalPrice)
                      )}
                    </p>
                  </div>
                  );
                })}
              </div>

              <div className={styles.totalsSection}>
                <div className={styles.totalRow}>
                  <span>{tCart('subtotal')}</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                {canApplyReferralDiscount && (
                  <div className={`${styles.totalRow} ${styles.discountRow}`}>
                    <span>🎁 {t('referralDiscount')}</span>
                    <span>-{formatPrice(referralDiscount)}</span>
                  </div>
                )}
                
                {/* Gift Card Section */}
                <div className={styles.giftCardSection}>
                  {appliedGiftCard ? (
                    <div className={styles.appliedGiftCard}>
                      <div className={styles.giftCardInfo}>
                        <span className={styles.giftCardLabel}>🎁 {t('giftCard.applied')}</span>
                        <span className={styles.giftCardCode}>{appliedGiftCard.code}</span>
                        <span className={styles.giftCardBalance}>
                          {t('giftCard.balance')}: {formatPrice(appliedGiftCard.balance)}
                        </span>
                      </div>
                      <div className={styles.giftCardActions}>
                        <span className={styles.giftCardDiscount}>-{formatPrice(giftCardDiscount)}</span>
                        <button 
                          className={styles.removeGiftCard}
                          onClick={handleRemoveGiftCard}
                          type="button"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.giftCardInput}>
                      <div className={styles.giftCardInputRow}>
                        <input
                          type="text"
                          value={giftCardCode}
                          onChange={(e) => setGiftCardCode(e.target.value.toUpperCase())}
                          placeholder={t('giftCard.placeholder')}
                          className={styles.giftCardField}
                        />
                        <button
                          onClick={handleApplyGiftCard}
                          disabled={giftCardLoading}
                          className={styles.applyGiftCardBtn}
                          type="button"
                        >
                          {giftCardLoading ? '...' : t('giftCard.apply')}
                        </button>
                      </div>
                      {giftCardError && (
                        <p className={styles.giftCardError}>{giftCardError}</p>
                      )}
                    </div>
                  )}
                </div>
                
                <div className={styles.totalRow}>
                  <span>{tCart('shipping')}</span>
                  <span className={styles.shippingNote}>{tCart('calculatedAtCheckout')}</span>
                </div>
                <div className={styles.grandTotal}>
                  <span>{tCart('total')}</span>
                  <span>{formatPrice(subtotal - referralDiscount - giftCardDiscount)}</span>
                </div>
                {canApplyReferralDiscount && (
                  <div className={styles.referralBanner}>
                    🎉 {t('referralApplied')}
                  </div>
                )}
                {hasReferralCode && !isLoggedIn && !checkingAuth && (
                  <div className={styles.referralLoginBanner}>
                    🎁 {t('referralLoginRequired')}
                    <Link href="/account/login" className={styles.referralLoginLink}>
                      {t('loginOrRegister')}
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Checkout Action */}
            <div className={styles.actionSection}>
              <div className={styles.actionCard}>
                <h2 className={styles.sectionTitle}>{t('secureCheckout')}</h2>
                
                <p className={styles.checkoutDescription}>
                  {t('checkoutDescription')}
                </p>

                <div className={styles.paymentMethods}>
                  <span className={styles.paymentLabel}>{t('acceptedPayments')}</span>
                  <div className={styles.paymentIcons}>
                    <span>💳 Card</span>
                    <span>🏦 SEPA</span>
                    <span>Klarna</span>
                  </div>
                </div>

                {error && (
                  <div className={styles.errorMessage}>
                    {error}
                  </div>
                )}

                <button
                  className={styles.checkoutButton}
                  onClick={handleCheckout}
                  disabled={isLoading}
                >
                  {isLoading ? t('processing') : t('proceedToPayment')}
                </button>

                <p className={styles.securityNote}>
                  🔒 {t('securityNote')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
