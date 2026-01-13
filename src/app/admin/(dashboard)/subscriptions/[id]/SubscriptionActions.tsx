'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../subscriptions.module.css';

interface SubscriptionActionsProps {
  subscriptionId: string;
  currentStatus: string;
}

export default function SubscriptionActions({ subscriptionId, currentStatus }: SubscriptionActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAction = async (action: 'pause' | 'resume' | 'cancel') => {
    if (action === 'cancel' && !confirm('Are you sure you want to cancel this subscription? This cannot be undone.')) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/subscriptions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId, action }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Action failed');
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {error && (
        <div style={{ color: '#dc2626', marginBottom: '1rem', padding: '0.75rem', background: '#fee2e2', borderRadius: '6px' }}>
          {error}
        </div>
      )}
      
      <div className={styles.actionButtons}>
        {currentStatus === 'active' && (
          <>
            <button
              onClick={() => handleAction('pause')}
              disabled={loading}
              className={`${styles.actionButton} ${styles.pauseButton}`}
            >
              {loading ? 'Processing...' : 'Pause Subscription'}
            </button>
            <button
              onClick={() => handleAction('cancel')}
              disabled={loading}
              className={`${styles.actionButton} ${styles.cancelButton}`}
            >
              {loading ? 'Processing...' : 'Cancel Subscription'}
            </button>
          </>
        )}
        
        {currentStatus === 'paused' && (
          <>
            <button
              onClick={() => handleAction('resume')}
              disabled={loading}
              className={`${styles.actionButton} ${styles.resumeButton}`}
            >
              {loading ? 'Processing...' : 'Resume Subscription'}
            </button>
            <button
              onClick={() => handleAction('cancel')}
              disabled={loading}
              className={`${styles.actionButton} ${styles.cancelButton}`}
            >
              {loading ? 'Processing...' : 'Cancel Subscription'}
            </button>
          </>
        )}
        
        {currentStatus === 'cancelled' && (
          <p style={{ color: '#6b7280', fontStyle: 'italic' }}>
            This subscription has been cancelled and cannot be modified.
          </p>
        )}
      </div>
    </div>
  );
}
