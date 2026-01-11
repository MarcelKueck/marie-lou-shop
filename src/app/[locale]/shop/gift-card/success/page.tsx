'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Navigation, Footer } from '@/components/layout';
import styles from './page.module.css';

function GiftCardSuccessContent() {
  const t = useTranslations('giftCards');
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [giftCardCode, setGiftCardCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real implementation, you'd fetch the gift card details using the session ID
    // For now, we'll just show a success message
    setLoading(false);
  }, [sessionId]);

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p>{t('loading')}</p>
      </div>
    );
  }

  return (
    <div className={styles.success}>
      <div className={styles.icon}>🎉</div>
      <h1 className={styles.title}>{t('successTitle')}</h1>
      <p className={styles.message}>{t('successMessage')}</p>
      
      {giftCardCode && (
        <div className={styles.codeBox}>
          <span className={styles.codeLabel}>{t('giftCardCode')}</span>
          <span className={styles.code}>{giftCardCode}</span>
        </div>
      )}
      
      <div className={styles.info}>
        <p>{t('emailSent')}</p>
      </div>
      
      <div className={styles.actions}>
        <Link href="/shop" className={styles.primaryButton}>
          {t('continueShopping')}
        </Link>
        <Link href="/shop/gift-card" className={styles.secondaryButton}>
          {t('buyAnother')}
        </Link>
      </div>
    </div>
  );
}

export default function GiftCardSuccessPage() {
  return (
    <>
      <Navigation />
      <main className={styles.main}>
        <div className={styles.container}>
          <Suspense fallback={
            <div className={styles.loading}>
              <div className={styles.spinner} />
            </div>
          }>
            <GiftCardSuccessContent />
          </Suspense>
        </div>
      </main>
      <Footer />
    </>
  );
}
