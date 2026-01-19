'use client';

import styles from '../portal.module.css';

interface SmartBox {
  id: string;
  locationDescription: string | null;
  deviceId: string;
  status: string;
  learningMode: boolean | null;
  learningModeEndsAt: Date | null;
  avgDailyConsumption: number | null;
  avgWeeklyConsumption: number | null;
  standardBagSize: number;
  currentFillPercent: number | null;
  productType: string;
}

interface ConsumptionStatsProps {
  box: SmartBox;
}

export function ConsumptionStats({ box }: ConsumptionStatsProps) {
  const isLearning = box.learningMode;
  const bagSize = box.standardBagSize || 500;
  
  // Calculate bags per day
  const bagsPerDay = box.avgDailyConsumption 
    ? (box.avgDailyConsumption / bagSize).toFixed(1)
    : '-';
  
  // Calculate days remaining in learning mode
  const now = new Date();
  const learningDaysRemaining = box.learningModeEndsAt
    ? Math.max(0, Math.ceil((new Date(box.learningModeEndsAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <div className={`${styles.boxStatCard} ${isLearning ? styles.learningMode : ''}`}>
      <div className={styles.boxStatHeader}>
        <h3 className={styles.boxStatName}>
          {box.locationDescription || box.deviceId}
        </h3>
        <span className={`${styles.statusBadge} ${styles[box.status]}`}>
          {box.status}
        </span>
      </div>

      {isLearning ? (
        <div className={styles.learningInfo}>
          <span className={styles.learningIcon}>🎓</span>
          <div>
            <p className={styles.learningTitle}>Learning Mode Active</p>
            <p className={styles.learningSubtitle}>
              {learningDaysRemaining > 0 
                ? `${learningDaysRemaining} days remaining`
                : 'Finalizing patterns...'}
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className={styles.consumptionGrid}>
            <div className={styles.consumptionItem}>
              <span className={styles.consumptionValue}>
                {box.avgDailyConsumption ? `${Math.round(box.avgDailyConsumption)}g` : '-'}
              </span>
              <span className={styles.consumptionLabel}>Daily</span>
            </div>
            <div className={styles.consumptionItem}>
              <span className={styles.consumptionValue}>
                {box.avgWeeklyConsumption ? `${(box.avgWeeklyConsumption / 1000).toFixed(1)}kg` : '-'}
              </span>
              <span className={styles.consumptionLabel}>Weekly</span>
            </div>
            <div className={styles.consumptionItem}>
              <span className={styles.consumptionValue}>~{bagsPerDay}</span>
              <span className={styles.consumptionLabel}>Bags/Day</span>
            </div>
          </div>

          <div className={styles.fillIndicator}>
            <div className={styles.fillHeader}>
              <span>Current Stock</span>
              <span>{box.currentFillPercent ?? 0}%</span>
            </div>
            <div className={styles.fillBar}>
              <div 
                className={styles.fillProgress} 
                style={{ 
                  width: `${box.currentFillPercent ?? 0}%`,
                  backgroundColor: (box.currentFillPercent ?? 0) <= 20 ? '#ef4444' : 
                    (box.currentFillPercent ?? 0) <= 40 ? '#f59e0b' : '#22c55e'
                }}
              />
            </div>
          </div>
        </>
      )}

      <div className={styles.boxStatMeta}>
        <span className={styles.productType}>
          {box.productType === 'coffee' ? '☕' : '🍵'} {box.productType}
        </span>
        <span className={styles.bagSize}>
          {bagSize}g bags
        </span>
      </div>
    </div>
  );
}
