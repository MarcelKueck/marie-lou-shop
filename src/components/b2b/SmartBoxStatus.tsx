'use client';

import { useState, useEffect } from 'react';
import styles from './SmartBoxStatus.module.css';

interface SmartBox {
  id: string;
  deviceId: string;
  name?: string;
  location?: string;
  size: 'small' | 'medium' | 'large';
  productName?: string;
  status: 'pending' | 'active' | 'offline' | 'retired';
  fillPercent: number;
  batteryPercent?: number;
  lastReading?: string;
}

interface SmartBoxStatusProps {
  companyId: string;
  onRefill?: (boxId: string) => void;
  compact?: boolean;
}

export default function SmartBoxStatus({
  companyId,
  onRefill,
  compact = false,
}: SmartBoxStatusProps) {
  const [boxes, setBoxes] = useState<SmartBox[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBoxes = async () => {
      try {
        const res = await fetch(`/api/b2b/portal/smartboxes?companyId=${companyId}`);
        if (res.ok) {
          const data = await res.json();
          setBoxes(data.boxes || []);
        }
      } catch {
        setError('Failed to load SmartBox status');
      } finally {
        setLoading(false);
      }
    };

    fetchBoxes();
    // Refresh every 5 minutes
    const interval = setInterval(fetchBoxes, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [companyId]);

  const getFillClass = (percent: number) => {
    if (percent <= 15) return styles.critical;
    if (percent <= 30) return styles.low;
    if (percent <= 60) return styles.medium;
    return styles.full;
  };

  const getStatusIcon = (status: SmartBox['status']) => {
    switch (status) {
      case 'active': return '🟢';
      case 'offline': return '🔴';
      case 'pending': return '🟡';
      default: return '⚫';
    }
  };

  const formatLastReading = (date?: string) => {
    if (!date) return 'Never';
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return d.toLocaleDateString();
  };

  if (loading) {
    return <div className={styles.loading}>Loading SmartBox status...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  if (boxes.length === 0) {
    return (
      <div className={styles.empty}>
        <span className={styles.emptyIcon}>📦</span>
        <p>No SmartBoxes configured yet</p>
        <p className={styles.emptyHint}>
          Contact your account manager to set up SmartBox monitoring
        </p>
      </div>
    );
  }

  if (compact) {
    return (
      <div className={styles.compactGrid}>
        {boxes.map((box) => (
          <div key={box.id} className={styles.compactCard}>
            <div className={styles.compactHeader}>
              <span className={styles.statusIcon}>{getStatusIcon(box.status)}</span>
              <span className={styles.compactName}>{box.name || box.location || 'SmartBox'}</span>
            </div>
            <div className={`${styles.compactFill} ${getFillClass(box.fillPercent)}`}>
              <div 
                className={styles.compactFillBar} 
                style={{ width: `${box.fillPercent}%` }}
              />
            </div>
            <div className={styles.compactPercent}>{box.fillPercent}%</div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={styles.boxGrid}>
      {boxes.map((box) => (
        <div key={box.id} className={`${styles.boxCard} ${styles[box.status]}`}>
          <div className={styles.boxHeader}>
            <div className={styles.boxInfo}>
              <span className={styles.statusIcon}>{getStatusIcon(box.status)}</span>
              <div>
                <h4 className={styles.boxName}>{box.name || 'SmartBox'}</h4>
                {box.location && <span className={styles.boxLocation}>{box.location}</span>}
              </div>
            </div>
            <span className={`${styles.sizeBadge} ${styles[box.size]}`}>{box.size}</span>
          </div>

          <div className={styles.productInfo}>
            <span className={styles.productLabel}>Product:</span>
            <span className={styles.productName}>{box.productName || 'Not configured'}</span>
          </div>

          <div className={styles.fillContainer}>
            <div className={styles.fillLabel}>
              <span>Fill Level</span>
              <span className={`${styles.fillPercent} ${getFillClass(box.fillPercent)}`}>
                {box.fillPercent}%
              </span>
            </div>
            <div className={styles.fillTrack}>
              <div 
                className={`${styles.fillBar} ${getFillClass(box.fillPercent)}`}
                style={{ width: `${box.fillPercent}%` }}
              />
            </div>
            {box.fillPercent <= 30 && (
              <div className={styles.fillWarning}>
                {box.fillPercent <= 15 ? '⚠️ Critical - Refill needed!' : '⚠️ Low - Order soon'}
              </div>
            )}
          </div>

          <div className={styles.boxMeta}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Battery</span>
              <span className={styles.metaValue}>
                {box.batteryPercent !== undefined ? `${box.batteryPercent}%` : 'N/A'}
                {box.batteryPercent !== undefined && box.batteryPercent <= 20 && ' 🪫'}
              </span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Last Reading</span>
              <span className={styles.metaValue}>{formatLastReading(box.lastReading)}</span>
            </div>
          </div>

          {onRefill && box.fillPercent <= 30 && (
            <button 
              onClick={() => onRefill(box.id)}
              className={styles.refillButton}
            >
              Request Refill
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
