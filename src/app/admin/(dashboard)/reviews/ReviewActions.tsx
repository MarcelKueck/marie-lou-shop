'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface ReviewActionsProps {
  reviewId: string;
  currentStatus: string;
}

export default function ReviewActions({ reviewId, currentStatus }: ReviewActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const handleStatusChange = async (newStatus: 'approved' | 'rejected') => {
    if (loading) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update review');
      }
      
      router.refresh();
    } catch (error) {
      console.error('Error updating review:', error);
      alert('Fehler beim Aktualisieren der Bewertung');
    } finally {
      setLoading(false);
    }
  };
  
  if (currentStatus === 'approved') {
    return (
      <button
        onClick={() => handleStatusChange('rejected')}
        disabled={loading}
        style={{
          padding: '0.25rem 0.5rem',
          fontSize: '0.75rem',
          backgroundColor: '#fee2e2',
          color: '#991b1b',
          border: 'none',
          borderRadius: '4px',
          cursor: loading ? 'wait' : 'pointer',
        }}
      >
        {loading ? '...' : 'Ablehnen'}
      </button>
    );
  }
  
  if (currentStatus === 'rejected') {
    return (
      <button
        onClick={() => handleStatusChange('approved')}
        disabled={loading}
        style={{
          padding: '0.25rem 0.5rem',
          fontSize: '0.75rem',
          backgroundColor: '#dcfce7',
          color: '#166534',
          border: 'none',
          borderRadius: '4px',
          cursor: loading ? 'wait' : 'pointer',
        }}
      >
        {loading ? '...' : 'Genehmigen'}
      </button>
    );
  }
  
  return (
    <div style={{ display: 'flex', gap: '0.5rem' }}>
      <button
        onClick={() => handleStatusChange('approved')}
        disabled={loading}
        style={{
          padding: '0.25rem 0.5rem',
          fontSize: '0.75rem',
          backgroundColor: '#dcfce7',
          color: '#166534',
          border: 'none',
          borderRadius: '4px',
          cursor: loading ? 'wait' : 'pointer',
        }}
      >
        {loading ? '...' : '✓'}
      </button>
      <button
        onClick={() => handleStatusChange('rejected')}
        disabled={loading}
        style={{
          padding: '0.25rem 0.5rem',
          fontSize: '0.75rem',
          backgroundColor: '#fee2e2',
          color: '#991b1b',
          border: 'none',
          borderRadius: '4px',
          cursor: loading ? 'wait' : 'pointer',
        }}
      >
        {loading ? '...' : '✗'}
      </button>
    </div>
  );
}
