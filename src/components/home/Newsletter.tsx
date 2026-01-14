'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useBrand } from '@/hooks/useBrand';
import styles from './Newsletter.module.css';

export function Newsletter() {
  const t = useTranslations('newsletter');
  const locale = useLocale();
  const { brand } = useBrand();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'already' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');
    setErrorMessage('');
    
    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          brand: brand.id,
          locale,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to subscribe');
      }

      if (data.alreadySubscribed) {
        setStatus('already');
      } else {
        setStatus('success');
      }
      setEmail('');
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Something went wrong');
    }
  };

  return (
    <section className={styles.newsletter} id="contact">
      <div className={styles.container}>
        <div className={styles.content}>
          <span className={styles.badge}>{t('badge')}</span>
          <h2 className={styles.title}>{t('title')}</h2>
          <p className={styles.description}>{t('description')}</p>
          
          <form onSubmit={handleSubmit} className={styles.form}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('placeholder')}
              className={styles.input}
              disabled={status === 'loading'}
              required
            />
            <button 
              type="submit" 
              className={styles.button}
              disabled={status === 'loading'}
            >
              {status === 'loading' ? '...' : t('button')}
            </button>
          </form>
          
          {status === 'success' && (
            <p className={styles.success}>{t('success')}</p>
          )}
          {status === 'already' && (
            <p className={styles.success}>{t('alreadySubscribed')}</p>
          )}
          {status === 'error' && (
            <p className={styles.error}>{errorMessage || t('error')}</p>
          )}
          
          <p className={styles.privacy}>{t('privacy')}</p>
        </div>
      </div>
    </section>
  );
}

export default Newsletter;
