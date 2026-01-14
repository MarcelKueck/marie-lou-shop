'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Link } from '@/i18n/routing';
import { B2BLayout } from '@/components/b2b';
import styles from './login.module.css';

export default function B2BLoginPage() {
  const t = useTranslations('b2b');
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/b2b/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        router.push('/b2b/portal');
      } else {
        setError(data.error || t('login.error'));
      }
    } catch {
      setError(t('login.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <B2BLayout>
      <div className={styles.container}>
        <div className={styles.card}>
          <h1 className={styles.title}>{t('login.title')}</h1>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <label htmlFor="email" className={styles.label}>
                {t('login.email')}
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className={styles.input}
                autoComplete="email"
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="password" className={styles.label}>
                {t('login.password')}
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className={styles.input}
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className={styles.error}>{error}</div>
            )}

            <button
              type="submit"
              className={styles.submitButton}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Loading...' : t('login.submit')}
            </button>
          </form>

          <div className={styles.links}>
            <Link href="/b2b/forgot-password" className={styles.link}>
              {t('login.forgotPassword')}
            </Link>
          </div>

          <div className={styles.divider} />

          <p className={styles.noAccount}>
            {t('login.noAccount')}{' '}
            <Link href="/b2b/inquiry" className={styles.inquiryLink}>
              {t('login.inquiry')}
            </Link>
          </p>
        </div>
      </div>
    </B2BLayout>
  );
}
