'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { useBrand } from '@/hooks/useBrand';
import styles from './Footer.module.css';

export default function Footer() {
  const t = useTranslations('footer');
  const { brand } = useBrand();
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.grid}>
        <div className={styles.brand}>
          <Image
            src={brand.logo}
            alt={`${brand.name} Logo`}
            width={240}
            height={240}
            className={styles.logo}
          />
          <p>{t('tagline')}</p>
        </div>

        <div className={styles.column}>
          <h4>{t('shop')}</h4>
          <ul>
            <li><Link href="/shop">{t('allCoffee')}</Link></li>
            <li><Link href="/shop?category=single-origin">{t('singleOrigins')}</Link></li>
            <li><Link href="/shop?category=blend">{t('blends')}</Link></li>
            <li><Link href="/shop/gift-card">{t('giftCards')}</Link></li>
            <li><Link href="/subscribe">{t('subscriptions')}</Link></li>
          </ul>
        </div>

        <div className={styles.column}>
          <h4>{t('learn')}</h4>
          <ul>
            <li><Link href="/story">{t('ourStory')}</Link></li>
            <li><Link href="/referral">{t('referralProgram')}</Link></li>
            <li><Link href="/faq">{t('faq')}</Link></li>
          </ul>
        </div>

        <div className={styles.column}>
          <h4>{t('connect')}</h4>
          <ul>
            <li>
              <a 
                href={`https://instagram.com/${brand.social.instagram}`} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                {t('instagram')}
              </a>
            </li>
            <li><Link href="/contact">{t('contactUs')}</Link></li>
            <li><Link href="/wholesale">{t('wholesale')}</Link></li>
            <li><Link href="/press">{t('press')}</Link></li>
          </ul>
        </div>
      </div>

      <div className={styles.bottom}>
        <p>© {currentYear} {brand.name}. {t('copyright').replace('© 2026 Marie Lou Coffee. ', '')}</p>
        <p className={styles.dedication}>{t('forYouOma')}</p>
      </div>
    </footer>
  );
}
