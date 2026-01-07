'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import Navigation from '@/components/layout/Navigation';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/cart/CartDrawer';
import styles from './login.module.css';

export default function LoginPage() {
  const t = useTranslations('auth');
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const body = isLogin 
        ? { email: formData.email, password: formData.password }
        : formData;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || t('error.generic'));
        return;
      }

      router.push('/account');
    } catch {
      setError(t('error.generic'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <>
      <Navigation onCartClick={() => setIsCartOpen(true)} />
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      <main className={styles.page}>
        <div className={styles.container}>
          <div className={styles.card}>
            <h1 className={styles.title}>
              {isLogin ? t('login.title') : t('register.title')}
            </h1>
            <p className={styles.subtitle}>
              {isLogin ? t('login.subtitle') : t('register.subtitle')}
            </p>

            {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          {!isLogin && (
            <div className={styles.nameFields}>
              <div className={styles.field}>
                <label htmlFor="firstName">{t('fields.firstName')}</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder={t('placeholders.firstName')}
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="lastName">{t('fields.lastName')}</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder={t('placeholders.lastName')}
                />
              </div>
            </div>
          )}

          <div className={styles.field}>
            <label htmlFor="email">{t('fields.email')}</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder={t('placeholders.email')}
              required
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="password">{t('fields.password')}</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder={t('placeholders.password')}
              required
              minLength={8}
            />
            {!isLogin && (
              <span className={styles.hint}>{t('hints.password')}</span>
            )}
          </div>

          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={isLoading}
          >
            {isLoading 
              ? t('loading') 
              : isLogin 
                ? t('login.submit') 
                : t('register.submit')
            }
          </button>
        </form>

        <div className={styles.toggle}>
          <p>
            {isLogin ? t('login.noAccount') : t('register.hasAccount')}{' '}
            <button 
              type="button" 
              onClick={() => setIsLogin(!isLogin)}
              className={styles.toggleButton}
            >
              {isLogin ? t('login.createAccount') : t('register.loginInstead')}
            </button>
          </p>
        </div>

        <div className={styles.backLink}>
          <Link href="/">{t('backToShop')}</Link>
        </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
