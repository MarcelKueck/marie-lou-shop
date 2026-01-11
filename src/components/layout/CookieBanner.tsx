'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import styles from './CookieBanner.module.css';

interface CookieConsent {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  accepted: string;
}

export default function CookieBanner() {
  const t = useTranslations('cookies');
  const [show, setShow] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Check if consent has already been given
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      // Small delay to prevent flash on load
      const timer = setTimeout(() => setShow(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const saveConsent = (consent: CookieConsent) => {
    localStorage.setItem('cookie-consent', JSON.stringify(consent));
    setShow(false);
  };

  const acceptAll = () => {
    saveConsent({
      necessary: true,
      analytics: true,
      marketing: true,
      accepted: new Date().toISOString(),
    });
  };

  const acceptNecessary = () => {
    saveConsent({
      necessary: true,
      analytics: false,
      marketing: false,
      accepted: new Date().toISOString(),
    });
  };

  if (!show) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.banner}>
        <div className={styles.content}>
          <h3 className={styles.title}>{t('title')}</h3>
          <p className={styles.message}>{t('message')}</p>
          
          {showDetails && (
            <div className={styles.details}>
              <div className={styles.cookieType}>
                <div className={styles.cookieHeader}>
                  <span className={styles.cookieName}>{t('necessary.title')}</span>
                  <span className={styles.required}>{t('required')}</span>
                </div>
                <p className={styles.cookieDescription}>{t('necessary.description')}</p>
              </div>
              
              <div className={styles.cookieType}>
                <div className={styles.cookieHeader}>
                  <span className={styles.cookieName}>{t('analytics.title')}</span>
                </div>
                <p className={styles.cookieDescription}>{t('analytics.description')}</p>
              </div>
              
              <div className={styles.cookieType}>
                <div className={styles.cookieHeader}>
                  <span className={styles.cookieName}>{t('marketing.title')}</span>
                </div>
                <p className={styles.cookieDescription}>{t('marketing.description')}</p>
              </div>
            </div>
          )}
          
          <div className={styles.actions}>
            <button 
              onClick={() => setShowDetails(!showDetails)} 
              className={styles.detailsButton}
            >
              {showDetails ? t('hideDetails') : t('showDetails')}
            </button>
            <div className={styles.mainButtons}>
              <button onClick={acceptNecessary} className={styles.secondaryButton}>
                {t('necessaryOnly')}
              </button>
              <button onClick={acceptAll} className={styles.primaryButton}>
                {t('acceptAll')}
              </button>
            </div>
          </div>
          
          <p className={styles.privacyLink}>
            <Link href="/legal/datenschutz">{t('privacyPolicy')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
