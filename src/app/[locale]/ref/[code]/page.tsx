'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { useBrand } from '@/hooks/useBrand';
import { REFERRAL_COOKIE_NAME, REFERRAL_COOKIE_MAX_AGE, isValidReferralCodeFormat } from '@/lib/referral';
import Navigation from '@/components/layout/Navigation';
import Footer from '@/components/layout/Footer';
import styles from './referral-landing.module.css';

interface ReferralLandingPageProps {
  params: Promise<{ code: string; locale: string }>;
}

export default function ReferralLandingPage({ params }: ReferralLandingPageProps) {
  const { brand } = useBrand();
  const locale = useLocale();
  const t = useTranslations('referralLanding');
  const [isValidCode, setIsValidCode] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Validate and store the referral code
  useEffect(() => {
    const validateAndStoreCode = async () => {
      const { code } = await params;
      
      // First check format
      if (!isValidReferralCodeFormat(code)) {
        setIsValidCode(false);
        setIsLoading(false);
        return;
      }
      
      // Validate against database
      try {
        const response = await fetch(`/api/referral/validate?code=${encodeURIComponent(code)}`);
        const data = await response.json();
        
        if (data.valid) {
          // Store valid code in cookie
          document.cookie = `${REFERRAL_COOKIE_NAME}=${code.toUpperCase()}; max-age=${REFERRAL_COOKIE_MAX_AGE}; path=/; samesite=lax`;
          setIsValidCode(true);
        } else {
          setIsValidCode(false);
        }
      } catch {
        // On error, still store the code - backend will validate at checkout
        document.cookie = `${REFERRAL_COOKIE_NAME}=${code.toUpperCase()}; max-age=${REFERRAL_COOKIE_MAX_AGE}; path=/; samesite=lax`;
        setIsValidCode(true);
      }
      
      setIsLoading(false);
    };
    validateAndStoreCode();
  }, [params]);

  // Show loading state
  if (isLoading) {
    return (
      <div className={`theme-${brand.id}`}>
        <Navigation />
        <main className={styles.main}>
          <div className={styles.loading}>
            {locale === 'de' ? 'Code wird überprüft...' : 'Validating code...'}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Show invalid code message
  if (isValidCode === false) {
    return (
      <div className={`theme-${brand.id}`}>
        <Navigation />
        <main className={styles.main}>
          <section className={styles.hero}>
            <div className={styles.heroContent}>
              <h1 className={styles.title}>
                {locale === 'de' ? 'Ungültiger Empfehlungscode' : 'Invalid Referral Code'}
              </h1>
              <p className={styles.subtitle}>
                {locale === 'de' 
                  ? 'Dieser Empfehlungscode ist leider nicht gültig oder abgelaufen.' 
                  : 'This referral code is not valid or has expired.'}
              </p>
              <Link href="/shop" className={styles.ctaButton}>
                {locale === 'de' ? 'Zum Shop' : 'Go to Shop'}
              </Link>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className={`theme-${brand.id}`}>
      <Navigation />

      <main className={styles.main}>
        {/* Hero Section */}
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <p className={styles.eyebrow}>{t('eyebrow')}</p>
            <h1 className={styles.title}>{t('title')}</h1>
            <p className={styles.subtitle}>{t('subtitle')}</p>
          </div>
        </section>

        {/* Discount Banner */}
        <section className={styles.discountBanner}>
          <div className={styles.bannerContent}>
            <div className={styles.giftIcon}>🎁</div>
            <h2 className={styles.bannerTitle}>{t('bannerTitle')}</h2>
            <p className={styles.bannerText}>{t('bannerText')}</p>
            <Link href="/shop" className={styles.ctaButton}>
              {t('shopNow')}
            </Link>
          </div>
        </section>

        {/* Brand Promise */}
        <section className={styles.promise}>
          <div className={styles.promiseContent}>
            <h2 className={styles.promiseTitle}>{t('promiseTitle')}</h2>
            <div className={styles.promiseGrid}>
              <div className={styles.promiseItem}>
                <span className={styles.promiseIcon}>☕</span>
                <h3>{t('promiseItem1Title')}</h3>
                <p>{t('promiseItem1Text')}</p>
              </div>
              <div className={styles.promiseItem}>
                <span className={styles.promiseIcon}>🌍</span>
                <h3>{t('promiseItem2Title')}</h3>
                <p>{t('promiseItem2Text')}</p>
              </div>
              <div className={styles.promiseItem}>
                <span className={styles.promiseIcon}>💚</span>
                <h3>{t('promiseItem3Title')}</h3>
                <p>{t('promiseItem3Text')}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Story Teaser */}
        <section className={styles.story}>
          <div className={styles.storyContent}>
            <div className={styles.storyImage}>
              {brand.id === 'coffee' ? (
                <Image
                  src="/images/story/founder.png"
                  alt="Marie Lou"
                  width={400}
                  height={400}
                  className={styles.storyPhoto}
                />
              ) : (
                <div className={styles.storyPlaceholder} />
              )}
            </div>
            <div className={styles.storyText}>
              <blockquote className={styles.quote}>
                &ldquo;{t('quote')}&rdquo;
              </blockquote>
              <Link href="/story" className={styles.storyLink}>
                {t('readStory')} →
              </Link>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className={styles.finalCta}>
          <div className={styles.finalCtaContent}>
            <h2 className={styles.finalCtaTitle}>{t('finalCtaTitle')}</h2>
            <p className={styles.finalCtaText}>{t('finalCtaText')}</p>
            <Link href="/shop" className={styles.ctaButton}>
              {t('startShopping')}
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
