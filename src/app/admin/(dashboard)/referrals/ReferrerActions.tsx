'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface ReferrerActionsProps {
  customerId: string;
  isTrusted: boolean;
  isSuspended: boolean;
}

export default function ReferrerActions({ customerId, isTrusted, isSuspended }: ReferrerActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleAction = async (action: 'trust' | 'untrust' | 'suspend' | 'unsuspend') => {
    if (loading) return;
    
    const notes = action === 'suspend' 
      ? prompt('Add a note about why this referrer is being suspended (optional):')
      : action === 'trust'
      ? prompt('Add a note about why this referrer is being trusted (optional):')
      : undefined;

    setLoading(true);
    try {
      const response = await fetch('/api/admin/referrers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId, action, notes }),
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.error || 'Failed to update referrer status');
        return;
      }

      router.refresh();
    } catch (error) {
      console.error('Error updating referrer:', error);
      alert('Failed to update referrer status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
      {isSuspended ? (
        <button
          onClick={() => handleAction('unsuspend')}
          disabled={loading}
          style={{
            padding: '0.25rem 0.5rem',
            fontSize: '0.75rem',
            background: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'wait' : 'pointer',
            opacity: loading ? 0.5 : 1,
          }}
        >
          Unsuspend
        </button>
      ) : isTrusted ? (
        <button
          onClick={() => handleAction('untrust')}
          disabled={loading}
          style={{
            padding: '0.25rem 0.5rem',
            fontSize: '0.75rem',
            background: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'wait' : 'pointer',
            opacity: loading ? 0.5 : 1,
          }}
        >
          Remove Trust
        </button>
      ) : (
        <>
          <button
            onClick={() => handleAction('trust')}
            disabled={loading}
            style={{
              padding: '0.25rem 0.5rem',
              fontSize: '0.75rem',
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'wait' : 'pointer',
              opacity: loading ? 0.5 : 1,
            }}
          >
            Trust
          </button>
          <button
            onClick={() => handleAction('suspend')}
            disabled={loading}
            style={{
              padding: '0.25rem 0.5rem',
              fontSize: '0.75rem',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'wait' : 'pointer',
              opacity: loading ? 0.5 : 1,
            }}
          >
            Suspend
          </button>
        </>
      )}
    </div>
  );
}
