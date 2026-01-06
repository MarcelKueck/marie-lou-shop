'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { useBrand } from '@/hooks/useBrand';
import styles from './Hero.module.css';

export default function Hero() {
  const t = useTranslations('hero');
  const { brand } = useBrand();

  const heroImage = brand.id === 'coffee' 
    ? '/images/coffee/hero/coffee-hero.png' 
    : '/images/tea/hero/tea-hero.png';

  return (
    <section className={styles.hero}>
      <div className={styles.heroImageWrapper}>
        <Image
          src={heroImage}
          alt={`${brand.name} - Premium ${brand.id}`}
          fill
          className={styles.heroImg}
          priority
          sizes="55vw"
        />
        <div className={styles.imageOverlay} />
      </div>
      
      <div className={styles.content}>
        <h1 className={styles.title}>
          {t('title')} <em>{t('titleEmphasis')}</em>
        </h1>
        
        <p className={styles.description}>{t('description')}</p>
        
        <div className={styles.cta}>
          <Link href="/shop" className="btn btn-primary">
            {t('shopCta')}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
          <Link href="/story" className="btn btn-secondary">
            {t('storyCta')}
          </Link>
        </div>
      </div>
    </section>
  );
}
