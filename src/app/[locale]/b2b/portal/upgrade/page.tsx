'use client';

import { useState } from 'react';
import styles from '../portal.module.css';

// Smart tier pricing
const SMART_TIERS = [
  {
    id: 'smart_starter',
    name: 'Smart Starter',
    employees: '1-15',
    pricePerEmployee: 15,
    features: ['1 SmartBox included', 'Auto-reorder', 'Basic analytics', 'Email support'],
    popular: false,
  },
  {
    id: 'smart_growth',
    name: 'Smart Growth',
    employees: '16-50',
    pricePerEmployee: 12,
    features: ['2 SmartBoxes included', 'Auto-reorder', 'Advanced analytics', 'Priority support', 'Account manager'],
    popular: true,
  },
  {
    id: 'smart_scale',
    name: 'Smart Scale',
    employees: '51-200',
    pricePerEmployee: 10,
    features: ['3 SmartBoxes included', 'Auto-reorder', 'Full analytics suite', 'Dedicated support', 'Custom integrations'],
    popular: false,
  },
  {
    id: 'smart_enterprise',
    name: 'Smart Enterprise',
    employees: '201+',
    pricePerEmployee: 8,
    features: ['Unlimited SmartBoxes', 'Custom SLA', 'API access', '24/7 support', 'White-label options'],
    popular: false,
  },
];

export default function B2BUpgradePage() {
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [employeeCount, setEmployeeCount] = useState(20);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleUpgradeRequest = async () => {
    if (!selectedTier) return;
    
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/b2b/portal/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: selectedTier,
          employeeCount,
        }),
      });
      
      if (res.ok) {
        setShowSuccess(true);
      }
    } catch (error) {
      console.error('Upgrade request failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRecommendedTier = () => {
    if (employeeCount <= 15) return 'smart_starter';
    if (employeeCount <= 50) return 'smart_growth';
    if (employeeCount <= 200) return 'smart_scale';
    return 'smart_enterprise';
  };

  const calculateMonthlyPrice = (tier: typeof SMART_TIERS[0]) => {
    return employeeCount * tier.pricePerEmployee;
  };

  if (showSuccess) {
    return (
      <div className={styles.page}>
        <div className={styles.successMessage}>
          <div className={styles.successIcon}>✓</div>
          <h1>Upgrade Request Received!</h1>
          <p>
            Thank you for your interest in upgrading to Smart tier. 
            Our team will review your request and contact you within 1-2 business days.
          </p>
          <button
            onClick={() => window.location.href = './'}
            className={styles.buttonPrimary}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Upgrade to Smart</h1>
        <p className={styles.pageDescription}>
          Automate your coffee supply with SmartBox IoT monitoring and never run out again.
        </p>
      </div>

      {/* Employee Count Slider */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>How many employees?</h2>
        <div className={styles.sliderContainer}>
          <input
            type="range"
            min="1"
            max="300"
            value={employeeCount}
            onChange={(e) => setEmployeeCount(parseInt(e.target.value))}
            className={styles.slider}
          />
          <div className={styles.sliderValue}>
            <span className={styles.largeNumber}>{employeeCount}</span>
            <span className={styles.sliderLabel}>employees</span>
          </div>
        </div>
      </div>

      {/* Tier Cards */}
      <div className={styles.tierGrid}>
        {SMART_TIERS.map((tier) => {
          const isRecommended = tier.id === getRecommendedTier();
          const monthlyPrice = calculateMonthlyPrice(tier);
          
          return (
            <div
              key={tier.id}
              className={`${styles.tierCard} ${selectedTier === tier.id ? styles.tierCardSelected : ''} ${isRecommended ? styles.tierCardRecommended : ''}`}
              onClick={() => setSelectedTier(tier.id)}
            >
              {isRecommended && (
                <div className={styles.recommendedBadge}>Recommended</div>
              )}
              {tier.popular && (
                <div className={styles.popularBadge}>Most Popular</div>
              )}
              
              <h3 className={styles.tierName}>{tier.name}</h3>
              <div className={styles.tierEmployees}>{tier.employees} employees</div>
              
              <div className={styles.tierPricing}>
                <span className={styles.tierPrice}>€{tier.pricePerEmployee}</span>
                <span className={styles.tierPriceUnit}>/ employee / month</span>
              </div>
              
              <div className={styles.tierMonthly}>
                €{monthlyPrice} / month
              </div>
              
              <ul className={styles.tierFeatures}>
                {tier.features.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
              
              <button
                className={`${styles.tierSelectButton} ${selectedTier === tier.id ? styles.tierSelectButtonActive : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedTier(tier.id);
                }}
              >
                {selectedTier === tier.id ? 'Selected' : 'Select'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Comparison Section */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Flex vs Smart Comparison</h2>
        <div className={styles.comparisonTable}>
          <table>
            <thead>
              <tr>
                <th>Feature</th>
                <th>Flex (Current)</th>
                <th>Smart</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Ordering</td>
                <td>Manual</td>
                <td className={styles.highlight}>Automatic (SmartBox)</td>
              </tr>
              <tr>
                <td>Inventory Monitoring</td>
                <td>None</td>
                <td className={styles.highlight}>Real-time IoT</td>
              </tr>
              <tr>
                <td>Payment</td>
                <td>Per order (Invoice)</td>
                <td className={styles.highlight}>Fixed monthly</td>
              </tr>
              <tr>
                <td>Supply</td>
                <td>Variable</td>
                <td className={styles.highlight}>Unlimited</td>
              </tr>
              <tr>
                <td>Analytics</td>
                <td>Basic</td>
                <td className={styles.highlight}>Advanced consumption insights</td>
              </tr>
              <tr>
                <td>Support</td>
                <td>Email</td>
                <td className={styles.highlight}>Priority / Dedicated</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* SmartBox Info */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>How SmartBox Works</h2>
        <div className={styles.howItWorks}>
          <div className={styles.step}>
            <div className={styles.stepNumber}>1</div>
            <h4>Install</h4>
            <p>We send you a pre-configured SmartBox. Simply place it in your kitchen or break room.</p>
          </div>
          <div className={styles.step}>
            <div className={styles.stepNumber}>2</div>
            <h4>Monitor</h4>
            <p>The built-in sensor tracks fill levels in real-time and sends data to our platform.</p>
          </div>
          <div className={styles.step}>
            <div className={styles.stepNumber}>3</div>
            <h4>Auto-Order</h4>
            <p>When levels get low, we automatically dispatch a refill - before you notice.</p>
          </div>
          <div className={styles.step}>
            <div className={styles.stepNumber}>4</div>
            <h4>Enjoy</h4>
            <p>Your team always has fresh coffee. You save time and never run out.</p>
          </div>
        </div>
      </div>

      {/* Request Upgrade Button */}
      <div className={styles.upgradeAction}>
        <button
          onClick={handleUpgradeRequest}
          disabled={!selectedTier || isSubmitting}
          className={styles.buttonPrimary}
        >
          {isSubmitting ? 'Sending Request...' : 'Request Upgrade'}
        </button>
        <p className={styles.upgradeNote}>
          Our team will contact you to complete the upgrade and arrange SmartBox delivery.
        </p>
      </div>
    </div>
  );
}
