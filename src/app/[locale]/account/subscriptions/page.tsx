'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Navigation, Footer } from '@/components/layout';
import styles from '../account.module.css';

interface Subscription {
  id: string;
  productName: string;
  variantName: string;
  quantity: number;
  unitPrice: number;
  intervalCount: number;
  intervalUnit: string;
  status: string;
  nextDeliveryAt: string | null;
  shippingFirstName: string;
  shippingLastName: string;
  shippingLine1: string;
  shippingCity: string;
  shippingPostalCode: string;
  shippingCountry: string;
}

export default function SubscriptionsPage() {
  const t = useTranslations('subscriptions');
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const response = await fetch('/api/subscriptions');
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setSubscriptions(data.subscriptions || []);
    } catch {
      setError('Could not load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (subscriptionId: string, action: string, data?: object) => {
    setActionLoading(subscriptionId);
    setError('');

    try {
      const response = await fetch('/api/subscriptions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId, action, ...data }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Action failed');
      }

      await fetchSubscriptions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setActionLoading(null);
    }
  };

  const formatPrice = (cents: number) => `€${(cents / 100).toFixed(2)}`;
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('de-DE');
  };

  const getIntervalLabel = (count: number, unit: string) => {
    if (unit === 'week') {
      return count === 1 ? t('everyWeek') : t('everyNWeeks', { n: count });
    }
    return count === 1 ? t('everyMonth') : t('everyNMonths', { n: count });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { className: string; label: string }> = {
      active: { className: styles.statusActive, label: t('statusActive') },
      paused: { className: styles.statusPaused, label: t('statusPaused') },
      cancelled: { className: styles.statusCancelled, label: t('statusCancelled') },
      past_due: { className: styles.statusWarning, label: t('statusPastDue') },
    };
    const config = statusConfig[status] || statusConfig.active;
    return <span className={config.className}>{config.label}</span>;
  };

  if (loading) {
    return (
      <>
        <Navigation />
        <main className={styles.main}>
          <div className={styles.container}>
            <div className={styles.loading}>{t('loading')}</div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navigation />
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.header}>
            <h1>{t('title')}</h1>
            <Link href="/account" className={styles.backLink}>
              ← {t('backToAccount')}
            </Link>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          {subscriptions.length === 0 ? (
            <div className={styles.emptyState}>
              <h2>{t('noSubscriptions')}</h2>
              <p>{t('noSubscriptionsDesc')}</p>
              <Link href="/shop" className={styles.primaryButton}>
                {t('browseProducts')}
              </Link>
            </div>
          ) : (
            <div className={styles.subscriptionsList}>
              {subscriptions.map((sub) => (
                <div key={sub.id} className={styles.subscriptionCard}>
                  <div className={styles.subscriptionHeader}>
                    <div>
                      <h2 className={styles.productName}>{sub.productName}</h2>
                      <p className={styles.variantName}>{sub.variantName} × {sub.quantity}</p>
                    </div>
                    {getStatusBadge(sub.status)}
                  </div>

                  <div className={styles.subscriptionDetails}>
                    <div className={styles.detailRow}>
                      <span>{t('price')}</span>
                      <span>{formatPrice(sub.unitPrice * sub.quantity)}</span>
                    </div>
                    <div className={styles.detailRow}>
                      <span>{t('frequency')}</span>
                      <span>{getIntervalLabel(sub.intervalCount, sub.intervalUnit)}</span>
                    </div>
                    <div className={styles.detailRow}>
                      <span>{t('nextDelivery')}</span>
                      <span>{formatDate(sub.nextDeliveryAt)}</span>
                    </div>
                    <div className={styles.detailRow}>
                      <span>{t('shippingTo')}</span>
                      <span>
                        {sub.shippingFirstName} {sub.shippingLastName}, {sub.shippingCity}
                      </span>
                    </div>
                  </div>

                  <div className={styles.subscriptionActions}>
                    {sub.status === 'active' && (
                      <>
                        <button
                          onClick={() => handleAction(sub.id, 'pause')}
                          disabled={actionLoading === sub.id}
                          className={styles.secondaryButton}
                        >
                          {t('pause')}
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(t('confirmCancel'))) {
                              handleAction(sub.id, 'cancel');
                            }
                          }}
                          disabled={actionLoading === sub.id}
                          className={styles.dangerButton}
                        >
                          {t('cancel')}
                        </button>
                      </>
                    )}
                    {sub.status === 'paused' && (
                      <button
                        onClick={() => handleAction(sub.id, 'resume')}
                        disabled={actionLoading === sub.id}
                        className={styles.primaryButton}
                      >
                        {t('resume')}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
