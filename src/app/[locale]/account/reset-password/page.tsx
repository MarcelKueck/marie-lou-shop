'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import Navigation from '@/components/layout/Navigation';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/cart/CartDrawer';
import styles from '../login/login.module.css';

export default function ResetPasswordPage() {
  const t = useTranslations('auth');
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    if (!token) {
      setError(t('resetPassword.invalidToken'));
    }
  }, [token, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError(t('resetPassword.passwordsDoNotMatch'));
      setIsLoading(false);
      return;
    }

    if (password.length < 8) {
      setError(t('resetPassword.passwordTooShort'));
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || t('error.generic'));
        return;
      }

      setSuccess(true);
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/account/login');
      }, 3000);
    } catch {
      setError(t('error.generic'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Navigation onCartClick={() => setIsCartOpen(true)} />
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      <main className={styles.page}>
        <div className={styles.container}>
          <div className={styles.card}>
            <h1 className={styles.title}>{t('resetPassword.title')}</h1>
            
            {success ? (
              <div className={styles.success}>
                <p>{t('resetPassword.success')}</p>
                <p>{t('resetPassword.redirecting')}</p>
                <Link href="/account/login" className={styles.backLink}>
                  {t('resetPassword.loginNow')}
                </Link>
              </div>
            ) : !token ? (
              <div className={styles.error}>
                <p>{t('resetPassword.invalidToken')}</p>
                <Link href="/account/forgot-password" className={styles.backLink}>
                  {t('resetPassword.requestNewLink')}
                </Link>
              </div>
            ) : (
              <>
                <p className={styles.subtitle}>{t('resetPassword.subtitle')}</p>

                {error && <div className={styles.error}>{error}</div>}

                <form onSubmit={handleSubmit} className={styles.form}>
                  <div className={styles.field}>
                    <label htmlFor="password">{t('resetPassword.newPassword')}</label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t('placeholders.password')}
                      required
                      minLength={8}
                    />
                    <span className={styles.hint}>{t('hints.password')}</span>
                  </div>

                  <div className={styles.field}>
                    <label htmlFor="confirmPassword">{t('resetPassword.confirmPassword')}</label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={t('placeholders.password')}
                      required
                      minLength={8}
                    />
                  </div>

                  <button
                    type="submit"
                    className={styles.submitButton}
                    disabled={isLoading}
                  >
                    {isLoading ? t('loading') : t('resetPassword.submit')}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
