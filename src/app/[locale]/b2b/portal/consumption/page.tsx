import { redirect } from 'next/navigation';
import { getCurrentB2BCompany } from '@/lib/b2b-auth';
import { db } from '@/db';
import { smartBoxes, boxReadings } from '@/db/schema';
import { eq, and, gte, desc } from 'drizzle-orm';
import styles from '../portal.module.css';
import { ConsumptionChart } from './ConsumptionChart';
import { ConsumptionStats } from './ConsumptionStats';

export const metadata = {
  title: 'Consumption Analytics | B2B Portal',
  description: 'View coffee consumption patterns and analytics',
};

export default async function ConsumptionPage() {
  const company = await getCurrentB2BCompany();
  if (!company) {
    redirect('/b2b/login');
  }

  // Get company's SmartBoxes with consumption data
  const boxes = await db.query.smartBoxes.findMany({
    where: eq(smartBoxes.companyId, company.id),
    orderBy: [smartBoxes.locationDescription],
  });

  // Get readings from the last 30 days for all boxes
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentReadings = await db
    .select()
    .from(boxReadings)
    .where(
      and(
        gte(boxReadings.recordedAt, thirtyDaysAgo)
      )
    )
    .orderBy(desc(boxReadings.recordedAt));

  // Filter to only this company's boxes
  const companyBoxIds = boxes.map(b => b.id);
  const readings = recentReadings.filter(r => companyBoxIds.includes(r.boxId));

  // Calculate total consumption stats
  const totalStats = {
    totalConsumptionKg: boxes.reduce((sum, box) => {
      const weeklyKg = (box.avgWeeklyConsumption || 0) / 1000;
      return sum + weeklyKg * 4; // Monthly estimate
    }, 0),
    avgDailyConsumption: boxes.reduce((sum, box) => sum + (box.avgDailyConsumption || 0), 0),
    activeBoses: boxes.filter(b => b.status === 'active').length,
    boxesInLearning: boxes.filter(b => b.learningMode).length,
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Consumption Analytics</h1>
        <p className={styles.pageSubtitle}>
          Track coffee consumption patterns across your SmartBoxes
        </p>
      </div>

      {/* Overview Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>☕</span>
          <div className={styles.statContent}>
            <span className={styles.statValue}>
              {totalStats.avgDailyConsumption.toLocaleString()}g
            </span>
            <span className={styles.statLabel}>Daily Consumption</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>📦</span>
          <div className={styles.statContent}>
            <span className={styles.statValue}>
              {totalStats.totalConsumptionKg.toFixed(1)}kg
            </span>
            <span className={styles.statLabel}>Monthly Estimate</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>📊</span>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{totalStats.activeBoses}</span>
            <span className={styles.statLabel}>Active SmartBoxes</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>🎓</span>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{totalStats.boxesInLearning}</span>
            <span className={styles.statLabel}>In Learning Mode</span>
          </div>
        </div>
      </div>

      {/* Per-Box Stats */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>SmartBox Breakdown</h2>
        </div>
        
        {boxes.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>📊</span>
            <p>No SmartBoxes found</p>
            <p className={styles.emptyHint}>
              Contact us to set up SmartBoxes for automatic consumption tracking
            </p>
          </div>
        ) : (
          <div className={styles.boxStatsGrid}>
            {boxes.map((box) => (
              <ConsumptionStats key={box.id} box={box} />
            ))}
          </div>
        )}
      </div>

      {/* Consumption Chart */}
      {readings.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>30-Day Consumption Trend</h2>
          </div>
          <ConsumptionChart readings={readings} boxes={boxes} />
        </div>
      )}

      {/* Understanding Your Data */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Understanding Your Data</h2>
        </div>
        <div className={styles.infoCard}>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span className={styles.infoIcon}>🎓</span>
              <div>
                <h4>Learning Mode</h4>
                <p>New SmartBoxes spend 2 weeks learning your consumption patterns for accurate predictions</p>
              </div>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoIcon}>📈</span>
              <div>
                <h4>Daily Average</h4>
                <p>Calculated from the past 2 weeks of readings. One bag ≈ one day&apos;s consumption</p>
              </div>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoIcon}>🔔</span>
              <div>
                <h4>Change Alerts</h4>
                <p>We&apos;ll notify you if consumption changes significantly (±30% or more)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
