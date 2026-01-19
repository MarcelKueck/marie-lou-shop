'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../portal.module.css';

interface SmartBox {
  id: string;
  locationDescription: string | null;
  deviceId: string;
}

interface HolidayFormProps {
  companyId: string;
  boxes: SmartBox[];
}

const HOLIDAY_REASONS = [
  { value: 'christmas', label: '🎄 Christmas / New Year' },
  { value: 'summer_holiday', label: '☀️ Summer Holiday' },
  { value: 'easter', label: '🐣 Easter' },
  { value: 'office_closed', label: '🏢 Office Closed' },
  { value: 'other', label: '📝 Other' },
];

export function HolidayForm({ companyId, boxes }: HolidayFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    reason: 'office_closed',
    boxId: '', // Empty = all boxes
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/b2b/portal/holidays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          startDate: formData.startDate,
          endDate: formData.endDate,
          reason: formData.reason,
          boxId: formData.boxId || null,
          notes: formData.notes || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create holiday period');
      }

      setSuccess(true);
      setFormData({
        startDate: '',
        endDate: '',
        reason: 'office_closed',
        boxId: '',
        notes: '',
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // Calculate minimum date (today)
  const today = new Date().toISOString().split('T')[0];

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      {error && (
        <div className={styles.errorMessage}>
          <span>⚠️</span> {error}
        </div>
      )}

      {success && (
        <div className={styles.successMessage}>
          <span>✅</span> Holiday period created successfully!
        </div>
      )}

      <div className={styles.formGroup}>
        <label className={styles.formLabel}>Start Date *</label>
        <input
          type="date"
          className={styles.formInput}
          value={formData.startDate}
          onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
          min={today}
          required
        />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.formLabel}>End Date *</label>
        <input
          type="date"
          className={styles.formInput}
          value={formData.endDate}
          onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
          min={formData.startDate || today}
          required
        />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.formLabel}>Reason</label>
        <select
          className={styles.formSelect}
          value={formData.reason}
          onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
        >
          {HOLIDAY_REASONS.map((reason) => (
            <option key={reason.value} value={reason.value}>
              {reason.label}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.formGroup}>
        <label className={styles.formLabel}>Apply To</label>
        <select
          className={styles.formSelect}
          value={formData.boxId}
          onChange={(e) => setFormData({ ...formData, boxId: e.target.value })}
        >
          <option value="">All SmartBoxes</option>
          {boxes.map((box) => (
            <option key={box.id} value={box.id}>
              {box.locationDescription || box.deviceId}
            </option>
          ))}
        </select>
        <p className={styles.formHint}>
          Leave as &quot;All SmartBoxes&quot; to pause ordering for your entire office
        </p>
      </div>

      <div className={styles.formGroup}>
        <label className={styles.formLabel}>Notes (optional)</label>
        <textarea
          className={styles.formTextarea}
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Any additional notes..."
          rows={2}
        />
      </div>

      <button
        type="submit"
        className={styles.primaryButton}
        disabled={loading}
      >
        {loading ? 'Creating...' : '📅 Add Holiday Period'}
      </button>
    </form>
  );
}
