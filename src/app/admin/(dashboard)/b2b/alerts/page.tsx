import { db } from '@/db';
import { b2bAlerts, b2bCompanies, smartBoxes } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import styles from '../../admin.module.css';
import { AlertsList } from './AlertsList';

export const metadata = {
  title: 'SmartBox Alerts | B2B Admin',
  description: 'Manage SmartBox alerts and notifications',
};

export default async function AlertsPage() {
  // Get all alerts with company and box info
  const alerts = await db
    .select({
      alert: b2bAlerts,
      company: b2bCompanies,
      box: smartBoxes,
    })
    .from(b2bAlerts)
    .leftJoin(b2bCompanies, eq(b2bAlerts.companyId, b2bCompanies.id))
    .leftJoin(smartBoxes, eq(b2bAlerts.boxId, smartBoxes.id))
    .orderBy(desc(b2bAlerts.createdAt))
    .limit(100);

  // Count by type and severity
  const unresolvedAlerts = alerts.filter(a => !a.alert.resolved);
  const criticalCount = unresolvedAlerts.filter(a => a.alert.severity === 'critical').length;
  const warningCount = unresolvedAlerts.filter(a => a.alert.severity === 'warning').length;
  const infoCount = unresolvedAlerts.filter(a => a.alert.severity === 'info').length;

  const alertsByType: Record<string, number> = {};
  unresolvedAlerts.forEach(a => {
    alertsByType[a.alert.type] = (alertsByType[a.alert.type] || 0) + 1;
  });

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1>SmartBox Alerts</h1>
        <p className={styles.pageDescription}>
          Monitor and manage alerts from all SmartBox devices
        </p>
      </div>

      {/* Stats Overview */}
      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${criticalCount > 0 ? styles.critical : ''}`}>
          <span className={styles.statValue}>{criticalCount}</span>
          <span className={styles.statLabel}>Critical</span>
        </div>
        <div className={`${styles.statCard} ${warningCount > 0 ? styles.warning : ''}`}>
          <span className={styles.statValue}>{warningCount}</span>
          <span className={styles.statLabel}>Warnings</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{infoCount}</span>
          <span className={styles.statLabel}>Info</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{alerts.filter(a => a.alert.resolved).length}</span>
          <span className={styles.statLabel}>Resolved Today</span>
        </div>
      </div>

      {/* Alert Types Breakdown */}
      {Object.keys(alertsByType).length > 0 && (
        <div className={styles.section}>
          <h2>Unresolved by Type</h2>
          <div className={styles.alertTypesGrid}>
            {Object.entries(alertsByType).map(([type, count]) => (
              <div key={type} className={styles.alertTypeCard}>
                <span className={styles.alertTypeIcon}>{getAlertTypeIcon(type)}</span>
                <span className={styles.alertTypeCount}>{count}</span>
                <span className={styles.alertTypeName}>{formatAlertType(type)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alerts List */}
      <div className={styles.section}>
        <h2>Recent Alerts</h2>
        <AlertsList alerts={alerts} />
      </div>
    </div>
  );
}

function getAlertTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    low_stock: '📦',
    offline: '📡',
    low_battery: '🔋',
    anomaly: '⚠️',
    restock_reminder: '📬',
    consumption_change: '📊',
  };
  return icons[type] || '🔔';
}

function formatAlertType(type: string): string {
  const names: Record<string, string> = {
    low_stock: 'Low Stock',
    offline: 'Offline',
    low_battery: 'Low Battery',
    anomaly: 'Anomaly',
    restock_reminder: 'Restock Reminder',
    consumption_change: 'Consumption Change',
  };
  return names[type] || type;
}
