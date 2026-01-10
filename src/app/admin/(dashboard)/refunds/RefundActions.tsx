'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './refunds.module.css';

interface RefundActionsProps {
  requestId: string;
  requestedAmount: number;
}

export default function RefundActions({ requestId, requestedAmount }: RefundActionsProps) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDenyForm, setShowDenyForm] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleApprove = async () => {
    if (isProcessing) return;
    
    if (!confirm(`Are you sure you want to approve and process this refund of €${(requestedAmount / 100).toFixed(2)}? This will immediately refund the customer through Stripe.`)) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/refunds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refundRequestId: requestId,
          action: 'approve',
          approvedAmount: requestedAmount,
          adminNotes: adminNotes || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process refund');
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process refund');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeny = async () => {
    if (isProcessing) return;
    
    if (!adminNotes.trim()) {
      setError('Please provide a reason for denying the request');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/refunds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refundRequestId: requestId,
          action: 'deny',
          adminNotes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to deny request');
      }

      setShowDenyForm(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to deny request');
    } finally {
      setIsProcessing(false);
    }
  };

  if (showDenyForm) {
    return (
      <div className={styles.denyForm}>
        <label htmlFor="adminNotes">Reason for denial:</label>
        <textarea
          id="adminNotes"
          value={adminNotes}
          onChange={(e) => setAdminNotes(e.target.value)}
          placeholder="Please explain why the refund request is being denied..."
          rows={3}
          className={styles.textarea}
        />
        {error && <p className={styles.error}>{error}</p>}
        <div className={styles.formActions}>
          <button 
            onClick={() => { setShowDenyForm(false); setError(null); }}
            className={styles.cancelButton}
            disabled={isProcessing}
          >
            Cancel
          </button>
          <button 
            onClick={handleDeny}
            className={styles.denyButton}
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Confirm Deny'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.actions}>
      {error && <p className={styles.error}>{error}</p>}
      <button 
        onClick={() => setShowDenyForm(true)}
        className={styles.denyButton}
        disabled={isProcessing}
      >
        Deny
      </button>
      <button 
        onClick={handleApprove}
        className={styles.approveButton}
        disabled={isProcessing}
      >
        {isProcessing ? 'Processing...' : 'Approve & Refund'}
      </button>
    </div>
  );
}
