'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useBrand } from '@/hooks/useBrand';
import Navigation from '@/components/layout/Navigation';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/cart/CartDrawer';
import styles from './story.module.css';

export default function StoryPage() {
  const { brand } = useBrand();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const t = useTranslations('storyPage');

  return (
    <div className={`theme-${brand.id}`}>
      <Navigation onCartClick={() => setIsCartOpen(true)} />

      <main className={styles.main}>
        {/* Hero Section */}
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <h1>{t('title')}</h1>
            <p className={styles.subtitle}>{t('subtitle')}</p>
          </div>
        </section>

        {/* Introduction */}
        <section className={styles.section}>
          <div className={styles.container}>
            <div className={styles.intro}>
              <h2>{t('intro.title')}</h2>
              <p>{t('intro.p1')}</p>
              <p>{t('intro.p2')}</p>
              <p>{t('intro.p3')}</p>
            </div>
          </div>
        </section>

        {/* Image and Story Section */}
        <section className={styles.sectionAlt}>
          <div className={styles.container}>
            <div className={styles.storyGrid}>
              <div className={styles.imageWrapper}>
                <Image
                  src="/images/story/founder.png"
                  alt={t('imageAlt')}
                  width={500}
                  height={600}
                  className={styles.founderImage}
                />
              </div>
              <div className={styles.storyContent}>
                <h2>{t('world.title')}</h2>
                <p>{t('world.p1')}</p>
                <p>{t('world.p2')}</p>
                <p>{t('world.p3')}</p>
              </div>
            </div>
          </div>
        </section>

        {/* The Promise Section */}
        <section className={styles.section}>
          <div className={styles.container}>
            <div className={styles.centered}>
              <h2>{t('promise.title')}</h2>
              <p>{t('promise.p1')}</p>
              <p>{t('promise.p2')}</p>
              <blockquote className={styles.quote}>
                {t('promise.quote')}
              </blockquote>
            </div>
          </div>
        </section>

        {/* The Innovation Section */}
        <section className={styles.sectionAlt}>
          <div className={styles.container}>
            <h2 className={styles.sectionTitle}>{t('innovation.title')}</h2>
            <div className={styles.innovationGrid}>
              <div className={styles.innovationCard}>
                <h3>{t('innovation.roasters.title')}</h3>
                <p>{t('innovation.roasters.description')}</p>
              </div>
              <div className={styles.innovationCard}>
                <h3>{t('innovation.direct.title')}</h3>
                <p>{t('innovation.direct.description')}</p>
              </div>
              <div className={styles.innovationCard}>
                <h3>{t('innovation.noMarketing.title')}</h3>
                <p>{t('innovation.noMarketing.description')}</p>
              </div>
              <div className={styles.innovationCard}>
                <h3>{t('innovation.fairPay.title')}</h3>
                <p>{t('innovation.fairPay.description')}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Closing Section */}
        <section className={styles.section}>
          <div className={styles.container}>
            <div className={styles.closing}>
              <h2>{t('closing.title')}</h2>
              <p>{t('closing.p1')}</p>
              <p>{t('closing.p2')}</p>
              <p className={styles.signature}>{t('closing.signature')}</p>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
}
