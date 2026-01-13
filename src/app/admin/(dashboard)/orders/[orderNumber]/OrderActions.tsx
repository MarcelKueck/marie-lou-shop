'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './order-detail.module.css';

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  invoiceUrl: string | null;
}

interface Props {
  order: Order;
}

export default function OrderActions({ order }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const updateStatus = async (newStatus: string) => {
    setLoading(newStatus);
    setError(null);
    
    try {
      const response = await fetch(`/api/admin/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update status');
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(null);
    }
  };

  const generateInvoice = async () => {
    setLoading('invoice');
    setError(null);
    
    try {
      const response = await fetch(`/api/admin/orders/${order.id}/invoice`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate invoice');
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(null);
    }
  };

  const statusFlow: Record<string, string> = {
    paid: 'processing',
    processing: 'shipped',
    shipped: 'delivered',
  };

  const statusLabels: Record<string, string> = {
    processing: 'Mark as Roasted',
    shipped: 'Mark as Shipped',
    delivered: 'Mark as Delivered',
  };

  const nextStatus = statusFlow[order.status];

  return (
    <div className={styles.actions}>
      {error && <p className={styles.error}>{error}</p>}
      
      {nextStatus && (
        <button
          onClick={() => updateStatus(nextStatus)}
          disabled={loading !== null}
          className={styles.primaryButton}
        >
          {loading === nextStatus ? 'Updating...' : statusLabels[nextStatus]}
        </button>
      )}

      {!order.invoiceUrl && order.status !== 'pending' && (
        <button
          onClick={generateInvoice}
          disabled={loading !== null}
          className={styles.secondaryButton}
        >
          {loading === 'invoice' ? 'Generating...' : 'Generate Invoice'}
        </button>
      )}

      {order.invoiceUrl && (
        <a
          href={order.invoiceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.secondaryButton}
        >
          View Invoice
        </a>
      )}
    </div>
  );
}
