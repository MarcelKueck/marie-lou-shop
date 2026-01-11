'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useBrand } from '@/hooks/useBrand';
import { Navigation, Footer } from '@/components/layout';
import styles from './page.module.css';

const GIFT_CARD_AMOUNTS = [
  { value: 2500, label: '25€' },
  { value: 5000, label: '50€' },
  { value: 7500, label: '75€' },
  { value: 10000, label: '100€' },
  { value: 15000, label: '150€' },
];

export default function GiftCardPage() {
  const t = useTranslations('giftCards');
  const { brandId } = useBrand();
  const [selectedAmount, setSelectedAmount] = useState(5000);
  const [purchaserEmail, setPurchaserEmail] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [personalMessage, setPersonalMessage] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<'email' | 'download'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/gift-cards/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: selectedAmount,
          purchaserEmail,
          recipientEmail: deliveryMethod === 'email' ? recipientEmail : undefined,
          recipientName,
          personalMessage,
          deliveryMethod,
          locale: 'de', // TODO: Get from router
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  };

  return (
    <>
      <Navigation />
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.header}>
            <h1 className={styles.title}>{t('title')}</h1>
            <p className={styles.subtitle}>{t('subtitle')}</p>
          </div>

          <div className={styles.content}>
            <div className={styles.preview}>
              <div className={styles.giftCard} data-brand={brandId}>
                <div className={styles.giftCardHeader}>
                  <span className={styles.giftCardLabel}>{t('giftCard')}</span>
                </div>
                <div className={styles.giftCardAmount}>
                  {GIFT_CARD_AMOUNTS.find(a => a.value === selectedAmount)?.label}
                </div>
                {recipientName && (
                  <div className={styles.giftCardRecipient}>
                    {t('for')} {recipientName}
                  </div>
                )}
                <div className={styles.giftCardBrand}>
                  Marie Lou {brandId === 'tea' ? 'Tea' : 'Coffee'}
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>{t('selectAmount')}</h2>
                <div className={styles.amounts}>
                  {GIFT_CARD_AMOUNTS.map((amount) => (
                    <button
                      key={amount.value}
                      type="button"
                      className={`${styles.amountButton} ${selectedAmount === amount.value ? styles.selected : ''}`}
                      onClick={() => setSelectedAmount(amount.value)}
                    >
                      {amount.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>{t('yourDetails')}</h2>
                <div className={styles.field}>
                  <label htmlFor="purchaserEmail">{t('yourEmail')} *</label>
                  <input
                    type="email"
                    id="purchaserEmail"
                    value={purchaserEmail}
                    onChange={(e) => setPurchaserEmail(e.target.value)}
                    required
                    placeholder={t('yourEmailPlaceholder')}
                  />
                </div>
              </div>

              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>{t('deliveryMethod')}</h2>
                <div className={styles.deliveryOptions}>
                  <label className={`${styles.deliveryOption} ${deliveryMethod === 'email' ? styles.selected : ''}`}>
                    <input
                      type="radio"
                      name="deliveryMethod"
                      value="email"
                      checked={deliveryMethod === 'email'}
                      onChange={() => setDeliveryMethod('email')}
                    />
                    <span className={styles.deliveryIcon}>📧</span>
                    <span className={styles.deliveryLabel}>{t('sendByEmail')}</span>
                    <span className={styles.deliveryDesc}>{t('sendByEmailDesc')}</span>
                  </label>
                  <label className={`${styles.deliveryOption} ${deliveryMethod === 'download' ? styles.selected : ''}`}>
                    <input
                      type="radio"
                      name="deliveryMethod"
                      value="download"
                      checked={deliveryMethod === 'download'}
                      onChange={() => setDeliveryMethod('download')}
                    />
                    <span className={styles.deliveryIcon}>🎁</span>
                    <span className={styles.deliveryLabel}>{t('downloadPDF')}</span>
                    <span className={styles.deliveryDesc}>{t('downloadPDFDesc')}</span>
                  </label>
                </div>
              </div>

              {deliveryMethod === 'email' && (
                <div className={styles.section}>
                  <h2 className={styles.sectionTitle}>{t('recipientDetails')}</h2>
                  <div className={styles.field}>
                    <label htmlFor="recipientName">{t('recipientName')}</label>
                    <input
                      type="text"
                      id="recipientName"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      placeholder={t('recipientNamePlaceholder')}
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="recipientEmail">{t('recipientEmail')} *</label>
                    <input
                      type="email"
                      id="recipientEmail"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      required={deliveryMethod === 'email'}
                      placeholder={t('recipientEmailPlaceholder')}
                    />
                  </div>
                </div>
              )}

              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>{t('personalMessage')}</h2>
                <div className={styles.field}>
                  <textarea
                    id="personalMessage"
                    value={personalMessage}
                    onChange={(e) => setPersonalMessage(e.target.value)}
                    placeholder={t('personalMessagePlaceholder')}
                    rows={4}
                    maxLength={500}
                  />
                  <span className={styles.charCount}>{personalMessage.length}/500</span>
                </div>
              </div>

              {error && <p className={styles.error}>{error}</p>}

              <button 
                type="submit" 
                className={styles.submitButton}
                disabled={loading}
              >
                {loading ? t('processing') : t('proceedToPayment')}
              </button>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
