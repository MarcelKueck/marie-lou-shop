'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { useParams } from 'next/navigation';
import styles from './welcome.module.css';

interface CompanyInfo {
  companyName: string;
  promoCode: string;
  discount: number;
  tier: string;
  brandPreference: string;
}

export default function B2BWelcomePage() {
  const t = useTranslations('b2b');
  const params = useParams();
  const code = params.code as string;
  
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    async function validateCode() {
      try {
        const response = await fetch(`/api/b2b/promo/validate?code=${encodeURIComponent(code)}`);
        const data = await response.json();
        
        if (!response.ok || !data.valid) {
          setError(data.error || 'Invalid promo code');
          setLoading(false);
          return;
        }
        
        setCompanyInfo({
          companyName: data.companyName,
          promoCode: data.promoCode,
          discount: data.discount,
          tier: data.tier,
          brandPreference: data.brandPreference,
        });
      } catch {
        setError('Failed to validate code');
      } finally {
        setLoading(false);
      }
    }
    
    if (code) {
      validateCode();
    }
  }, [code]);
  
  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.loading}>Loading...</div>
        </div>
      </div>
    );
  }
  
  if (error || !companyInfo) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.errorCard}>
            <h1 className={styles.errorTitle}>{t('welcome.invalidCode')}</h1>
            <p className={styles.errorMessage}>{error}</p>
            <Link href="/" className={styles.homeLink}>
              {t('welcome.visitShop')}
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  const brandPath = companyInfo.brandPreference === 'tea' ? '/tea' : '/coffee';
  
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.welcomeCard}>
          <div className={styles.header}>
            <div className={styles.badge}>{t('welcome.employeeBenefit')}</div>
            <h1 className={styles.title}>
              {t('welcome.title', { company: companyInfo.companyName })}
            </h1>
            <p className={styles.subtitle}>
              {t('welcome.subtitle')}
            </p>
          </div>
          
          <div className={styles.benefitBox}>
            <div className={styles.discountDisplay}>
              <span className={styles.discountPercent}>{companyInfo.discount}%</span>
              <span className={styles.discountLabel}>{t('welcome.discount')}</span>
            </div>
            <p className={styles.benefitText}>
              {t('welcome.benefitDescription')}
            </p>
          </div>
          
          <div className={styles.promoSection}>
            <p className={styles.promoLabel}>{t('welcome.yourCode')}</p>
            <div className={styles.promoCode}>{companyInfo.promoCode}</div>
            <p className={styles.promoHint}>{t('welcome.promoHint')}</p>
          </div>
          
          <div className={styles.actions}>
            <Link href={brandPath} className={styles.shopButton}>
              {t('welcome.startShopping')}
            </Link>
            <Link href="/" className={styles.browseLink}>
              {t('welcome.browseCatalog')}
            </Link>
          </div>
          
          <div className={styles.features}>
            <div className={styles.feature}>
              <span className={styles.featureIcon}>🚚</span>
              <span>{t('welcome.freeShipping')}</span>
            </div>
            <div className={styles.feature}>
              <span className={styles.featureIcon}>♻️</span>
              <span>{t('welcome.sustainable')}</span>
            </div>
            <div className={styles.feature}>
              <span className={styles.featureIcon}>⭐</span>
              <span>{t('welcome.premium')}</span>
            </div>
          </div>
        </div>
        
        <div className={styles.infoCard}>
          <h2 className={styles.infoTitle}>{t('welcome.howItWorks')}</h2>
          <ol className={styles.stepsList}>
            <li className={styles.step}>
              <span className={styles.stepNumber}>1</span>
              <span>{t('welcome.step1')}</span>
            </li>
            <li className={styles.step}>
              <span className={styles.stepNumber}>2</span>
              <span>{t('welcome.step2')}</span>
            </li>
            <li className={styles.step}>
              <span className={styles.stepNumber}>3</span>
              <span>{t('welcome.step3')}</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
