'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import styles from '../portal.module.css';

interface Holiday {
  id: string;
  startDate: Date;
  endDate: Date;
  reason: string | null;
  boxId: string | null;
  notes: string | null;
}

interface SmartBox {
  id: string;
  locationDescription: string | null;
  deviceId: string;
}

interface HolidayListProps {
  holidays: Holiday[];
  boxes: SmartBox[];
}

const REASON_LABELS: Record<string, string> = {
  christmas: '🎄 Christmas / New Year',
  summer_holiday: '☀️ Summer Holiday',
  easter: '🐣 Easter',
  office_closed: '🏢 Office Closed',
  other: '📝 Other',
};

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function isCurrentHoliday(startDate: Date, endDate: Date): boolean {
  const now = new Date();
  return new Date(startDate) <= now && new Date(endDate) >= now;
}

export function HolidayList({ holidays, boxes }: HolidayListProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (holidayId: string) => {
    if (!confirm('Are you sure you want to delete this holiday period?')) {
      return;
    }

    setDeletingId(holidayId);
    try {
      const response = await fetch(`/api/b2b/portal/holidays/${holidayId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete holiday');
      }

      router.refresh();
    } catch (error) {
      console.error('Failed to delete holiday:', error);
      alert('Failed to delete holiday period. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const getBoxName = (boxId: string | null): string => {
    if (!boxId) return 'All SmartBoxes';
    const box = boxes.find((b) => b.id === boxId);
    return box?.locationDescription || box?.deviceId || 'Unknown Box';
  };

  if (holidays.length === 0) {
    return (
      <div className={styles.emptyState}>
        <span className={styles.emptyIcon}>📅</span>
        <p>No holiday periods scheduled</p>
        <p className={styles.emptyHint}>
          Add a holiday period to pause automatic reordering during office closures
        </p>
      </div>
    );
  }

  return (
    <div className={styles.holidayList}>
      {holidays.map((holiday) => {
        const isCurrent = isCurrentHoliday(holiday.startDate, holiday.endDate);

        return (
          <div
            key={holiday.id}
            className={`${styles.holidayCard} ${isCurrent ? styles.currentHoliday : ''}`}
          >
            <div className={styles.holidayHeader}>
              <span className={styles.holidayReason}>
                {REASON_LABELS[holiday.reason || 'other'] || holiday.reason}
              </span>
              {isCurrent && (
                <span className={styles.currentBadge}>Active Now</span>
              )}
            </div>

            <div className={styles.holidayDates}>
              <span className={styles.dateRange}>
                {formatDate(holiday.startDate)} — {formatDate(holiday.endDate)}
              </span>
            </div>

            <div className={styles.holidayMeta}>
              <span className={styles.appliesToBadge}>
                📦 {getBoxName(holiday.boxId)}
              </span>
            </div>

            {holiday.notes && (
              <p className={styles.holidayNotes}>{holiday.notes}</p>
            )}

            <button
              className={styles.deleteButton}
              onClick={() => handleDelete(holiday.id)}
              disabled={deletingId === holiday.id}
            >
              {deletingId === holiday.id ? 'Deleting...' : '🗑️ Delete'}
            </button>
          </div>
        );
      })}
    </div>
  );
}
