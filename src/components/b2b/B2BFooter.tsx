'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import styles from './B2BFooter.module.css';

export default function B2BFooter() {
  const t = useTranslations('b2b');
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.grid}>
        <div className={styles.brand}>
          <Image
            src="/images/logos/marieloucoffee.svg"
            alt="Marie Lou Coffee"
            width={180}
            height={120}
            className={styles.logo}
          />
          <p>{t('footer.tagline')}</p>
        </div>

        <div className={styles.column}>
          <h4>{t('footer.program')}</h4>
          <ul>
            <li><Link href="/b2b">{t('footer.overview')}</Link></li>
            <li><Link href="/b2b/pricing">{t('footer.pricing')}</Link></li>
            <li><Link href="/b2b/waitlist">{t('footer.smartbox')}</Link></li>
            <li><Link href="/b2b/inquiry">{t('footer.getStarted')}</Link></li>
          </ul>
        </div>

        <div className={styles.column}>
          <h4>{t('footer.resources')}</h4>
          <ul>
            <li><Link href="/story">{t('footer.ourStory')}</Link></li>
            <li><Link href="/shop">{t('footer.shopCoffee')}</Link></li>
            <li><Link href="/faq">{t('footer.faq')}</Link></li>
            <li>
              <a href="mailto:b2b@marieloucoffee.com">
                {t('footer.contact')}
              </a>
            </li>
          </ul>
        </div>

        <div className={styles.column}>
          <h4>{t('footer.legal')}</h4>
          <ul>
            <li><Link href="/legal/imprint">{t('footer.imprint')}</Link></li>
            <li><Link href="/legal/privacy">{t('footer.privacy')}</Link></li>
            <li><Link href="/legal/terms">{t('footer.terms')}</Link></li>
          </ul>
        </div>
      </div>

      <div className={styles.bottom}>
        <p>© {currentYear} Marie Lou Coffee. {t('footer.copyright')}</p>
        <div className={styles.backToConsumer}>
          <Link href="/">
            {t('footer.backToShop')} →
          </Link>
        </div>
      </div>
    </footer>
  );
}
