'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import styles from './Newsletter.module.css';

export function Newsletter() {
  const t = useTranslations('newsletter');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');
    
    // TODO: Implement newsletter signup API
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setStatus('success');
      setEmail('');
    } catch {
      setStatus('error');
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
          {status === 'error' && (
            <p className={styles.error}>{t('error')}</p>
          )}
          
          <p className={styles.privacy}>{t('privacy')}</p>
        </div>
      </div>
    </section>
  );
}

export default Newsletter;
