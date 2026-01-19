'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../../admin.module.css';

interface Alert {
  alert: {
    id: string;
    type: string;
    severity: string;
    title: string;
    message: string;
    data: string | null;
    resolved: boolean;
    resolvedAt: Date | null;
    resolvedBy: string | null;
    resolutionNotes: string | null;
    createdAt: Date;
  };
  company: {
    id: string;
    companyName: string;
  } | null;
  box: {
    id: string;
    locationDescription: string | null;
    deviceId: string;
  } | null;
}

interface AlertsListProps {
  alerts: Alert[];
}

const SEVERITY_STYLES: Record<string, string> = {
  critical: styles.severityCritical,
  warning: styles.severityWarning,
  info: styles.severityInfo,
};

const TYPE_ICONS: Record<string, string> = {
  low_stock: '📦',
  offline: '📡',
  low_battery: '🔋',
  anomaly: '⚠️',
  restock_reminder: '📬',
  consumption_change: '📊',
};

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function AlertsList({ alerts }: AlertsListProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<'all' | 'unresolved' | 'resolved'>('unresolved');
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  const filteredAlerts = alerts.filter((a) => {
    if (filter === 'unresolved') return !a.alert.resolved;
    if (filter === 'resolved') return a.alert.resolved;
    return true;
  });

  const handleResolve = async (alertId: string) => {
    try {
      const response = await fetch(`/api/admin/b2b/alerts/${alertId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: resolutionNotes }),
      });

      if (!response.ok) {
        throw new Error('Failed to resolve alert');
      }

      setResolvingId(null);
      setResolutionNotes('');
      router.refresh();
    } catch (error) {
      console.error('Failed to resolve alert:', error);
      alert('Failed to resolve alert');
    }
  };

  return (
    <div className={styles.alertsContainer}>
      {/* Filter Tabs */}
      <div className={styles.filterTabs}>
        <button
          className={`${styles.filterTab} ${filter === 'unresolved' ? styles.active : ''}`}
          onClick={() => setFilter('unresolved')}
        >
          Unresolved ({alerts.filter((a) => !a.alert.resolved).length})
        </button>
        <button
          className={`${styles.filterTab} ${filter === 'resolved' ? styles.active : ''}`}
          onClick={() => setFilter('resolved')}
        >
          Resolved ({alerts.filter((a) => a.alert.resolved).length})
        </button>
        <button
          className={`${styles.filterTab} ${filter === 'all' ? styles.active : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({alerts.length})
        </button>
      </div>

      {/* Alerts List */}
      {filteredAlerts.length === 0 ? (
        <div className={styles.emptyState}>
          <span>✨</span>
          <p>No {filter} alerts</p>
        </div>
      ) : (
        <div className={styles.alertsList}>
          {filteredAlerts.map(({ alert, company, box }) => (
            <div
              key={alert.id}
              className={`${styles.alertCard} ${alert.resolved ? styles.resolved : ''} ${
                SEVERITY_STYLES[alert.severity] || ''
              }`}
            >
              <div className={styles.alertHeader}>
                <span className={styles.alertIcon}>{TYPE_ICONS[alert.type] || '🔔'}</span>
                <div className={styles.alertTitleArea}>
                  <h3 className={styles.alertTitle}>{alert.title}</h3>
                  <span className={`${styles.severityBadge} ${SEVERITY_STYLES[alert.severity]}`}>
                    {alert.severity}
                  </span>
                </div>
                {!alert.resolved && (
                  <button
                    className={styles.resolveButton}
                    onClick={() => setResolvingId(resolvingId === alert.id ? null : alert.id)}
                  >
                    {resolvingId === alert.id ? 'Cancel' : 'Resolve'}
                  </button>
                )}
              </div>

              <p className={styles.alertMessage}>{alert.message}</p>

              <div className={styles.alertMeta}>
                <span className={styles.alertCompany}>
                  🏢 {company?.companyName || 'Unknown'}
                </span>
                {box && (
                  <span className={styles.alertBox}>
                    📦 {box.locationDescription || box.deviceId}
                  </span>
                )}
                <span className={styles.alertTime}>{formatDate(alert.createdAt)}</span>
              </div>

              {alert.data && (
                <details className={styles.alertData}>
                  <summary>View Data</summary>
                  <pre>{JSON.stringify(JSON.parse(alert.data), null, 2)}</pre>
                </details>
              )}

              {alert.resolved && (
                <div className={styles.resolutionInfo}>
                  <span>✅ Resolved by {alert.resolvedBy || 'System'}</span>
                  {alert.resolvedAt && (
                    <span className={styles.resolvedTime}>
                      {formatDate(alert.resolvedAt)}
                    </span>
                  )}
                  {alert.resolutionNotes && (
                    <p className={styles.resolutionNotes}>{alert.resolutionNotes}</p>
                  )}
                </div>
              )}

              {resolvingId === alert.id && (
                <div className={styles.resolveForm}>
                  <textarea
                    placeholder="Resolution notes (optional)"
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    rows={2}
                    className={styles.resolveInput}
                  />
                  <button
                    className={styles.confirmResolveButton}
                    onClick={() => handleResolve(alert.id)}
                  >
                    Confirm Resolution
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
