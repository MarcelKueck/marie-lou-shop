'use client';

import { useState, useEffect } from 'react';
import styles from './ConsumptionEstimator.module.css';

interface EstimateResult {
  tier: string;
  smartTier?: string;
  employeeCount: number;
  consumption: {
    level: string;
    monthlyKg: number;
    monthlyUnits: number;
    unlimited?: boolean;
  };
  pricing: {
    baseMonthly?: number;
    discountTier?: string;
    discountPercent?: number;
    finalMonthly?: number;
    perEmployee?: number;
    perCup?: number;
    ratePerEmployee?: number;
    monthlySubscription?: number;
    comparedToFlex?: {
      flexCost: number;
      savings: number;
      savingsPercent: number;
    };
  };
  features?: string[];
  recommendation?: string;
  smartBoxes?: {
    recommended: number;
    included: number;
    extra: number;
    depositIfExtra: number;
  };
}

interface ConsumptionEstimatorProps {
  defaultEmployees?: number;
  defaultTier?: 'flex' | 'smart';
  showTierSelector?: boolean;
  onEstimateChange?: (estimate: EstimateResult | null) => void;
}

export default function ConsumptionEstimator({
  defaultEmployees = 20,
  defaultTier = 'flex',
  showTierSelector = true,
  onEstimateChange,
}: ConsumptionEstimatorProps) {
  const [employeeCount, setEmployeeCount] = useState(defaultEmployees);
  const [tier, setTier] = useState<'flex' | 'smart'>(defaultTier);
  const [consumption, setConsumption] = useState<'low' | 'medium' | 'high'>('medium');
  const [estimate, setEstimate] = useState<EstimateResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchEstimate = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          employees: String(employeeCount),
          tier,
          consumption,
        });
        const res = await fetch(`/api/b2b/estimate?${params}`);
        if (res.ok) {
          const data = await res.json();
          setEstimate(data);
          onEstimateChange?.(data);
        }
      } catch (error) {
        console.error('Failed to fetch estimate:', error);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchEstimate, 300);
    return () => clearTimeout(timeoutId);
  }, [employeeCount, tier, consumption, onEstimateChange]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  return (
    <div className={styles.estimator}>
      <div className={styles.controls}>
        {/* Employee Count */}
        <div className={styles.controlGroup}>
          <label className={styles.label}>Number of Employees</label>
          <div className={styles.sliderRow}>
            <input
              type="range"
              min="1"
              max="500"
              value={employeeCount}
              onChange={(e) => setEmployeeCount(parseInt(e.target.value))}
              className={styles.slider}
            />
            <input
              type="number"
              value={employeeCount}
              onChange={(e) => setEmployeeCount(Math.max(1, Math.min(500, parseInt(e.target.value) || 1)))}
              className={styles.numberInput}
              min="1"
              max="500"
            />
          </div>
        </div>

        {/* Consumption Level */}
        <div className={styles.controlGroup}>
          <label className={styles.label}>Coffee Consumption</label>
          <div className={styles.buttonGroup}>
            {(['low', 'medium', 'high'] as const).map((level) => (
              <button
                key={level}
                onClick={() => setConsumption(level)}
                className={`${styles.optionButton} ${consumption === level ? styles.optionButtonActive : ''}`}
              >
                <span className={styles.optionIcon}>
                  {level === 'low' ? '☕' : level === 'medium' ? '☕☕' : '☕☕☕'}
                </span>
                <span className={styles.optionLabel}>
                  {level === 'low' ? 'Light' : level === 'medium' ? 'Regular' : 'Heavy'}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Tier Selector */}
        {showTierSelector && (
          <div className={styles.controlGroup}>
            <label className={styles.label}>Plan Type</label>
            <div className={styles.tierToggle}>
              <button
                onClick={() => setTier('flex')}
                className={`${styles.tierButton} ${tier === 'flex' ? styles.tierButtonActive : ''}`}
              >
                Flex
                <span className={styles.tierDesc}>Pay per order</span>
              </button>
              <button
                onClick={() => setTier('smart')}
                className={`${styles.tierButton} ${tier === 'smart' ? styles.tierButtonActive : ''}`}
              >
                Smart
                <span className={styles.tierDesc}>Unlimited supply</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      {loading ? (
        <div className={styles.loading}>Calculating...</div>
      ) : estimate ? (
        <div className={styles.results}>
          <div className={styles.resultHeader}>
            <h3 className={styles.resultTitle}>
              {estimate.tier === 'smart' ? `Smart ${estimate.smartTier?.replace('smart_', '').replace(/^\w/, c => c.toUpperCase())}` : 'Flex'}
            </h3>
            <div className={styles.monthlyPrice}>
              {formatCurrency(estimate.pricing.finalMonthly || estimate.pricing.monthlySubscription || 0)}
              <span className={styles.perMonth}>/ month</span>
            </div>
          </div>

          <div className={styles.resultStats}>
            <div className={styles.stat}>
              <span className={styles.statValue}>{estimate.consumption.monthlyKg}</span>
              <span className={styles.statLabel}>kg / month</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>~{estimate.consumption.monthlyUnits}</span>
              <span className={styles.statLabel}>cups / month</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>
                {formatCurrency(estimate.pricing.perEmployee || (estimate.pricing.monthlySubscription! / employeeCount))}
              </span>
              <span className={styles.statLabel}>per employee</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{formatCurrency(estimate.pricing.perCup || 0)}</span>
              <span className={styles.statLabel}>per cup</span>
            </div>
          </div>

          {/* Discount/Savings Info */}
          {estimate.tier === 'flex' && estimate.pricing.discountPercent && estimate.pricing.discountPercent > 0 && (
            <div className={styles.discount}>
              <span className={styles.discountBadge}>{estimate.pricing.discountPercent}% volume discount</span>
              <span>Save {formatCurrency(estimate.pricing.baseMonthly! - estimate.pricing.finalMonthly!)}</span>
            </div>
          )}

          {estimate.tier === 'smart' && estimate.pricing.comparedToFlex && estimate.pricing.comparedToFlex.savingsPercent > 0 && (
            <div className={styles.savings}>
              <span className={styles.savingsBadge}>
                Save {estimate.pricing.comparedToFlex.savingsPercent}% vs Flex
              </span>
              <span>{formatCurrency(estimate.pricing.comparedToFlex.savings)} / month</span>
            </div>
          )}

          {/* SmartBox Info */}
          {estimate.smartBoxes && (
            <div className={styles.smartBoxInfo}>
              <span className={styles.smartBoxIcon}>📦</span>
              <span>
                {estimate.smartBoxes.recommended} SmartBox{estimate.smartBoxes.recommended > 1 ? 'es' : ''} recommended
                {estimate.smartBoxes.included > 0 && ` (${estimate.smartBoxes.included} included)`}
              </span>
            </div>
          )}

          {/* Recommendation */}
          {estimate.recommendation && (
            <div className={styles.recommendation}>
              <span className={styles.recIcon}>💡</span>
              {estimate.recommendation}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
