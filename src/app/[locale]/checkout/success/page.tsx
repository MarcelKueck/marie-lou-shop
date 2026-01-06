'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { useBrand } from '@/hooks/useBrand';
import { useCart } from '@/hooks/useCart';
import Navigation from '@/components/layout/Navigation';
import Footer from '@/components/layout/Footer';
import styles from './success.module.css';

export default function CheckoutSuccessPage() {
  const { brand } = useBrand();
  const t = useTranslations('checkoutSuccess');
  const { clearCart } = useCart();

  // Clear cart after successful checkout
  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return (
    <div className={`theme-${brand.id}`}>
      <Navigation />

      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.successCard}>
            <div className={styles.iconWrapper}>
              <svg
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>

            <h1 className={styles.title}>{t('title')}</h1>
            <p className={styles.message}>{t('message')}</p>

            <div className={styles.details}>
              <div className={styles.detailItem}>
                <span className={styles.detailIcon}>📧</span>
                <p>{t('emailConfirmation')}</p>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailIcon}>☕</span>
                <p>{t('roastingInfo')}</p>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailIcon}>📦</span>
                <p>{t('shippingInfo')}</p>
              </div>
            </div>

            <div className={styles.actions}>
              <Link href="/shop" className={styles.primaryButton}>
                {t('continueShopping')}
              </Link>
              <Link href="/" className={styles.secondaryButton}>
                {t('backToHome')}
              </Link>
            </div>

            <p className={styles.signature}>{t('signature')}</p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
