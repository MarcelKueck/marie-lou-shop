'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { useBrand } from '@/hooks/useBrand';
import Navigation from '@/components/layout/Navigation';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/cart/CartDrawer';
import styles from './referral.module.css';

export default function ReferralProgramPage() {
  const { brand } = useBrand();
  useLocale(); // For locale detection
  const t = useTranslations('referralProgram');
  const [isCartOpen, setIsCartOpen] = useState(false);

  const steps = [
    { number: '1', icon: '🔗', titleKey: 'step1Title', textKey: 'step1Text' },
    { number: '2', icon: '🎁', titleKey: 'step2Title', textKey: 'step2Text' },
    { number: '3', icon: '☕', titleKey: 'step3Title', textKey: 'step3Text' },
  ] as const;

  const referrerBenefits = [
    'referrerBenefit1',
    'referrerBenefit2',
    'referrerBenefit3',
    'referrerBenefit4',
  ] as const;

  const friendBenefits = [
    'friendBenefit1',
    'friendBenefit2',
    'friendBenefit3',
  ] as const;

  return (
    <div className={`theme-${brand.id}`}>
      <Navigation onCartClick={() => setIsCartOpen(true)} />

      <main className={styles.main}>
        {/* Hero Section */}
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <h1 className={styles.title}>{t('title')}</h1>
            <p className={styles.subtitle}>{t('subtitle')}</p>
          </div>
        </section>

        {/* Intro Section */}
        <section className={styles.intro}>
          <div className={styles.introContent}>
            <p className={styles.introText}>{t('introText1')}</p>
            <p className={styles.introText}>{t('introText2')}</p>
          </div>
        </section>

        {/* How It Works */}
        <section className={styles.howItWorks}>
          <div className={styles.container}>
            <h2 className={styles.sectionTitle}>{t('howItWorks')}</h2>
            <div className={styles.stepsGrid}>
              {steps.map((step) => (
                <div key={step.number} className={styles.step}>
                  <div className={styles.stepIcon}>{step.icon}</div>
                  <div className={styles.stepNumber}>{step.number}</div>
                  <h3 className={styles.stepTitle}>{t(step.titleKey)}</h3>
                  <p className={styles.stepText}>{t(step.textKey)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Grid */}
        <section className={styles.benefits}>
          <div className={styles.container}>
            <h2 className={styles.sectionTitle}>{t('detailsTitle')}</h2>
            <div className={styles.benefitsGrid}>
              {/* For Referrer */}
              <div className={styles.benefitCard}>
                <h3 className={styles.benefitCardTitle}>{t('forYouTitle')}</h3>
                <ul className={styles.benefitList}>
                  {referrerBenefits.map((key) => (
                    <li key={key}>{t(key)}</li>
                  ))}
                </ul>
              </div>

              {/* For Friend */}
              <div className={styles.benefitCard}>
                <h3 className={styles.benefitCardTitle}>{t('forFriendTitle')}</h3>
                <ul className={styles.benefitList}>
                  {friendBenefits.map((key) => (
                    <li key={key}>{t(key)}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Why Random Bag */}
        <section className={styles.whyRandom}>
          <div className={styles.container}>
            <h2 className={styles.sectionTitle}>{t('whyRandomTitle')}</h2>
            <div className={styles.randomContent}>
              <p>{t('whyRandomText1')}</p>
              <p>{t('whyRandomText2')}</p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className={styles.cta}>
          <div className={styles.ctaContent}>
            <h2 className={styles.ctaTitle}>{t('ctaTitle')}</h2>
            <p className={styles.ctaText}>{t('ctaText')}</p>
            <div className={styles.ctaButtons}>
              <Link href="/shop" className={styles.ctaButtonPrimary}>
                {t('ctaShopNow')}
              </Link>
            </div>
            <p className={styles.ctaNote}>{t('ctaNote')}</p>
          </div>
        </section>

        {/* Closing */}
        <section className={styles.closing}>
          <p className={styles.closingText}>
            <em>{t('closingText')}</em>
          </p>
        </section>
      </main>

      <Footer />

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
}
