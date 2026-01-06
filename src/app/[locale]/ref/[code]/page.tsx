'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { useBrand } from '@/hooks/useBrand';
import { REFERRAL_COOKIE_NAME, REFERRAL_COOKIE_MAX_AGE } from '@/lib/referral';
import Navigation from '@/components/layout/Navigation';
import Footer from '@/components/layout/Footer';
import styles from './referral-landing.module.css';

interface ReferralLandingPageProps {
  params: Promise<{ code: string; locale: string }>;
}

export default function ReferralLandingPage({ params }: ReferralLandingPageProps) {
  const { brand } = useBrand();
  useLocale(); // Needed for locale detection
  const t = useTranslations('referralLanding');
  
  // Store the referral code in a cookie for later use at checkout
  useEffect(() => {
    const storeReferralCode = async () => {
      const { code } = await params;
      document.cookie = `${REFERRAL_COOKIE_NAME}=${code}; max-age=${REFERRAL_COOKIE_MAX_AGE}; path=/; samesite=lax`;
    };
    storeReferralCode();
  }, [params]);

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
