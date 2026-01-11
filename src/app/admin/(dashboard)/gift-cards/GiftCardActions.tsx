'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface GiftCardActionsProps {
  giftCardId: string;
  status: string;
}

export function GiftCardActions({ giftCardId, status }: GiftCardActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleAction = async (action: 'enable' | 'disable') => {
    if (loading) return;
    setLoading(true);

    try {
      const response = await fetch(`/api/admin/gift-cards/${giftCardId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.error || 'Action failed');
      } else {
        router.refresh();
      }
    } catch {
      alert('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const buttonStyle: React.CSSProperties = {
    padding: '6px 12px',
    border: 'none',
    borderRadius: '4px',
    cursor: loading ? 'wait' : 'pointer',
    fontSize: '12px',
    fontWeight: 500,
    opacity: loading ? 0.6 : 1,
  };

  if (status === 'disabled') {
    return (
      <button
        onClick={() => handleAction('enable')}
        disabled={loading}
        style={{
          ...buttonStyle,
          background: '#d1fae5',
          color: '#065f46',
        }}
      >
        Aktivieren
      </button>
    );
  }

  if (status === 'active') {
    return (
      <button
        onClick={() => handleAction('disable')}
        disabled={loading}
        style={{
          ...buttonStyle,
          background: '#fee2e2',
          color: '#991b1b',
        }}
      >
        Deaktivieren
      </button>
    );
  }

  return <span style={{ color: '#9ca3af', fontSize: '12px' }}>—</span>;
}
