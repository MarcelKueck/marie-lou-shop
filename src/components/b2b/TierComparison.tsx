'use client';

import styles from './TierComparison.module.css';

interface TierComparisonProps {
  highlightTier?: 'flex' | 'smart';
  showCTA?: boolean;
  onSelectTier?: (tier: 'flex' | 'smart') => void;
}

const FEATURES = [
  {
    name: 'Ordering',
    flex: 'Manual, on-demand',
    smart: 'Automated via SmartBox',
    smartBetter: true,
  },
  {
    name: 'Inventory Tracking',
    flex: 'Manual',
    smart: 'Real-time IoT sensors',
    smartBetter: true,
  },
  {
    name: 'Payment',
    flex: 'Per order (Net 14-30)',
    smart: 'Fixed monthly subscription',
    smartBetter: true,
  },
  {
    name: 'Supply',
    flex: 'Variable based on orders',
    smart: 'Unlimited included',
    smartBetter: true,
  },
  {
    name: 'Volume Discounts',
    flex: 'Up to 15% based on volume',
    smart: 'Included in rate',
    smartBetter: false,
  },
  {
    name: 'Minimum Commitment',
    flex: 'None',
    smart: '12-month contract',
    smartBetter: false,
  },
  {
    name: 'Analytics',
    flex: 'Basic order history',
    smart: 'Advanced consumption insights',
    smartBetter: true,
  },
  {
    name: 'Support',
    flex: 'Email support',
    smart: 'Priority / Dedicated manager',
    smartBetter: true,
  },
  {
    name: 'Employee Promo',
    flex: '10% discount code',
    smart: '15% discount code',
    smartBetter: true,
  },
  {
    name: 'SmartBox Devices',
    flex: 'Not available',
    smart: '1-3 included (tier based)',
    smartBetter: true,
  },
];

export default function TierComparison({
  highlightTier,
  showCTA = true,
  onSelectTier,
}: TierComparisonProps) {
  return (
    <div className={styles.comparison}>
      <div className={styles.header}>
        <div className={styles.headerCell}></div>
        <div className={`${styles.headerCell} ${highlightTier === 'flex' ? styles.highlighted : ''}`}>
          <h3 className={styles.tierName}>Flex</h3>
          <p className={styles.tierDesc}>Pay as you go</p>
        </div>
        <div className={`${styles.headerCell} ${highlightTier === 'smart' ? styles.highlighted : ''}`}>
          <h3 className={styles.tierName}>Smart</h3>
          <p className={styles.tierDesc}>All-inclusive</p>
          <span className={styles.recommendedBadge}>Recommended</span>
        </div>
      </div>

      <div className={styles.body}>
        {FEATURES.map((feature, index) => (
          <div key={index} className={styles.row}>
            <div className={styles.featureCell}>
              <span className={styles.featureName}>{feature.name}</span>
            </div>
            <div className={`${styles.valueCell} ${highlightTier === 'flex' ? styles.highlighted : ''}`}>
              <span className={styles.value}>{feature.flex}</span>
            </div>
            <div className={`${styles.valueCell} ${highlightTier === 'smart' ? styles.highlighted : ''}`}>
              <span className={`${styles.value} ${feature.smartBetter ? styles.better : ''}`}>
                {feature.smartBetter && <span className={styles.checkmark}>✓</span>}
                {feature.smart}
              </span>
            </div>
          </div>
        ))}
      </div>

      {showCTA && (
        <div className={styles.ctaRow}>
          <div className={styles.ctaCell}></div>
          <div className={`${styles.ctaCell} ${highlightTier === 'flex' ? styles.highlighted : ''}`}>
            <button
              onClick={() => onSelectTier?.('flex')}
              className={styles.ctaButton}
            >
              Choose Flex
            </button>
          </div>
          <div className={`${styles.ctaCell} ${highlightTier === 'smart' ? styles.highlighted : ''}`}>
            <button
              onClick={() => onSelectTier?.('smart')}
              className={`${styles.ctaButton} ${styles.ctaButtonPrimary}`}
            >
              Choose Smart
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
