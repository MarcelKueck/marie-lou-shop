'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { B2BLayout } from '@/components/b2b';
import styles from './pricing.module.css';

// Constants from schema
const B2B_SMART_RATES = {
  starter: 15, // 5-15 employees
  growth: 12,  // 16-50 employees
  scale: 10,   // 51-200 employees
  enterprise: 8, // 200+ employees (custom)
};

const B2B_FLEX_DISCOUNTS = {
  tier1: 5,  // 5-10kg monthly
  tier2: 10, // 10-25kg monthly
  tier3: 15, // 25-50kg monthly
  tier4: 20, // 50kg+ monthly
};

// Average coffee consumption: 2.5 cups/day, 10g per cup
const GRAMS_PER_CUP = 10;
const AVERAGE_PRICE_PER_KG = 35; // €35/kg average

interface CalculationResult {
  monthlyKg: number;
  monthlyConsumptionCups: number;
  flexCost: number;
  flexDiscount: number;
  smartCost: number;
  smartTier: string;
  savings: number;
  recommendation: 'smart' | 'flex';
}

export default function B2BPricingPage() {
  const t = useTranslations('b2b');
  
  const [employees, setEmployees] = useState(20);
  const [cupsPerDay, setCupsPerDay] = useState(2);
  const [workDays, setWorkDays] = useState(5);
  const [brand, setBrand] = useState<'coffee' | 'tea' | 'both'>('coffee');
  
  const result = useMemo<CalculationResult>(() => {
    // Calculate monthly consumption
    const dailyCups = employees * cupsPerDay;
    const weeklyCups = dailyCups * workDays;
    const monthlyCups = weeklyCups * 4.33; // Average weeks per month
    const monthlyGrams = monthlyCups * GRAMS_PER_CUP;
    const monthlyKg = monthlyGrams / 1000;
    
    // Calculate Flex cost
    let flexDiscount = 0;
    if (monthlyKg >= 50) flexDiscount = B2B_FLEX_DISCOUNTS.tier4;
    else if (monthlyKg >= 25) flexDiscount = B2B_FLEX_DISCOUNTS.tier3;
    else if (monthlyKg >= 10) flexDiscount = B2B_FLEX_DISCOUNTS.tier2;
    else if (monthlyKg >= 5) flexDiscount = B2B_FLEX_DISCOUNTS.tier1;
    
    const flexCost = monthlyKg * AVERAGE_PRICE_PER_KG * (1 - flexDiscount / 100);
    
    // Calculate Smart cost
    let smartRate = B2B_SMART_RATES.starter;
    let smartTier = 'starter';
    if (employees > 200) {
      smartRate = B2B_SMART_RATES.enterprise;
      smartTier = 'enterprise';
    } else if (employees > 50) {
      smartRate = B2B_SMART_RATES.scale;
      smartTier = 'scale';
    } else if (employees > 15) {
      smartRate = B2B_SMART_RATES.growth;
      smartTier = 'growth';
    }
    
    const smartCost = employees * smartRate;
    
    // Calculate savings
    const savings = flexCost - smartCost;
    
    // Recommendation based on cost and convenience
    // Smart is recommended for 15+ employees or if cost-effective
    const recommendation = employees >= 15 || savings > 0 ? 'smart' : 'flex';
    
    return {
      monthlyKg,
      monthlyConsumptionCups: Math.round(monthlyCups),
      flexCost,
      flexDiscount,
      smartCost,
      smartTier,
      savings,
      recommendation,
    };
  }, [employees, cupsPerDay, workDays]);
  
  const smartTierLabel = {
    starter: t('pricing.smart.starter.name'),
    growth: t('pricing.smart.growth.name'),
    scale: t('pricing.smart.scale.name'),
    enterprise: t('pricing.smart.enterprise.name'),
  }[result.smartTier] || result.smartTier;
  
  return (
    <B2BLayout>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>{t('calculator.title')}</h1>
          <p className={styles.subtitle}>{t('calculator.subtitle')}</p>
        </header>
        
        <div className={styles.content}>
          <div className={styles.calculator}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>
                {t('calculator.employees')}
                <span className={styles.value}>{employees}</span>
              </label>
              <input
                type="range"
                min="5"
                max="300"
                value={employees}
                onChange={(e) => setEmployees(Number(e.target.value))}
                className={styles.slider}
              />
              <div className={styles.sliderLabels}>
                <span>5</span>
                <span>50</span>
                <span>150</span>
                <span>300</span>
              </div>
            </div>
            
            <div className={styles.inputGroup}>
              <label className={styles.label}>
                {t('calculator.cupsPerDay')}
                <span className={styles.value}>{cupsPerDay}</span>
              </label>
              <input
                type="range"
                min="1"
                max="5"
                step="0.5"
                value={cupsPerDay}
                onChange={(e) => setCupsPerDay(Number(e.target.value))}
                className={styles.slider}
              />
              <div className={styles.sliderLabels}>
                <span>1</span>
                <span>2</span>
                <span>3</span>
                <span>4</span>
                <span>5</span>
              </div>
            </div>
            
            <div className={styles.inputGroup}>
              <label className={styles.label}>
                {t('calculator.workDays')}
                <span className={styles.value}>{workDays}</span>
              </label>
              <input
                type="range"
                min="3"
                max="7"
                value={workDays}
                onChange={(e) => setWorkDays(Number(e.target.value))}
                className={styles.slider}
              />
              <div className={styles.sliderLabels}>
                <span>3</span>
                <span>4</span>
                <span>5</span>
                <span>6</span>
                <span>7</span>
              </div>
            </div>
            
            <div className={styles.inputGroup}>
              <label className={styles.label}>{t('calculator.brand')}</label>
              <div className={styles.radioGroup}>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="brand"
                    value="coffee"
                    checked={brand === 'coffee'}
                    onChange={() => setBrand('coffee')}
                  />
                  {t('calculator.brandOptions.coffee')}
                </label>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="brand"
                    value="tea"
                    checked={brand === 'tea'}
                    onChange={() => setBrand('tea')}
                  />
                  {t('calculator.brandOptions.tea')}
                </label>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="brand"
                    value="both"
                    checked={brand === 'both'}
                    onChange={() => setBrand('both')}
                  />
                  {t('calculator.brandOptions.both')}
                </label>
              </div>
            </div>
          </div>
          
          <div className={styles.results}>
            <div className={styles.consumptionCard}>
              <h3 className={styles.cardTitle}>{t('calculator.results.monthlyConsumption')}</h3>
              <div className={styles.consumptionValue}>
                <span className={styles.bigNumber}>{result.monthlyKg.toFixed(1)}</span>
                <span className={styles.unit}>kg</span>
              </div>
              <p className={styles.subValue}>
                ~{result.monthlyConsumptionCups.toLocaleString()} {t('calculator.results.weeklyConsumption').split(' ')[0].toLowerCase()}
              </p>
            </div>
            
            <div className={styles.comparisonCards}>
              <div className={`${styles.tierCard} ${result.recommendation === 'flex' ? styles.recommended : ''}`}>
                {result.recommendation === 'flex' && (
                  <span className={styles.recommendedBadge}>{t('calculator.results.recommendedTier')}</span>
                )}
                <h3 className={styles.tierName}>{t('tiers.flex.name')}</h3>
                <div className={styles.tierPrice}>
                  <span className={styles.priceValue}>€{result.flexCost.toFixed(0)}</span>
                  <span className={styles.pricePeriod}>/month</span>
                </div>
                {result.flexDiscount > 0 && (
                  <p className={styles.discount}>{result.flexDiscount}% volume discount</p>
                )}
                <Link 
                  href={`/b2b/inquiry?tier=flex`} 
                  className={`${styles.tierCta} ${result.recommendation === 'flex' ? styles.primary : styles.secondary}`}
                >
                  {t('tiers.flex.cta')}
                </Link>
              </div>
              
              <div className={`${styles.tierCard} ${result.recommendation === 'smart' ? styles.recommended : ''}`}>
                {result.recommendation === 'smart' && (
                  <span className={styles.recommendedBadge}>{t('calculator.results.recommendedTier')}</span>
                )}
                <h3 className={styles.tierName}>{t('tiers.smart.name')}</h3>
                <p className={styles.tierSubname}>{smartTierLabel}</p>
                <div className={styles.tierPrice}>
                  <span className={styles.priceValue}>€{result.smartCost.toFixed(0)}</span>
                  <span className={styles.pricePeriod}>/month</span>
                </div>
                <p className={styles.discount}>
                  €{(result.smartCost / employees).toFixed(0)}/employee
                </p>
                <Link 
                  href={`/b2b/inquiry?tier=smart`} 
                  className={`${styles.tierCta} ${result.recommendation === 'smart' ? styles.primary : styles.secondary}`}
                >
                  {t('tiers.smart.cta')}
                </Link>
              </div>
            </div>
            
            {result.savings > 0 && (
              <div className={styles.savingsBox}>
                <span className={styles.savingsLabel}>{t('calculator.results.savings')}</span>
                <span className={styles.savingsValue}>€{result.savings.toFixed(0)}/month</span>
              </div>
            )}
          </div>
        </div>
        
        <div className={styles.pricingDetails}>
          <h2 className={styles.sectionTitle}>{t('pricing.title')}</h2>
          
          <div className={styles.pricingGrid}>
            <div className={styles.smartPricing}>
              <h3 className={styles.pricingHeader}>Smart Tiers</h3>
              <div className={styles.pricingTiers}>
                <div className={styles.pricingTier}>
                  <span className={styles.tierRange}>5-15 employees</span>
                  <span className={styles.tierPrice}>€15/emp/mo</span>
                </div>
                <div className={styles.pricingTier}>
                  <span className={styles.tierRange}>16-50 employees</span>
                  <span className={styles.tierPrice}>€12/emp/mo</span>
                </div>
                <div className={styles.pricingTier}>
                  <span className={styles.tierRange}>51-200 employees</span>
                  <span className={styles.tierPrice}>€10/emp/mo</span>
                </div>
                <div className={styles.pricingTier}>
                  <span className={styles.tierRange}>200+ employees</span>
                  <span className={styles.tierPrice}>Custom</span>
                </div>
              </div>
            </div>
            
            <div className={styles.flexPricing}>
              <h3 className={styles.pricingHeader}>{t('pricing.flex.title')}</h3>
              <div className={styles.pricingTiers}>
                <div className={styles.pricingTier}>
                  <span className={styles.tierRange}>5-10 kg/mo</span>
                  <span className={styles.tierPrice}>5% off</span>
                </div>
                <div className={styles.pricingTier}>
                  <span className={styles.tierRange}>10-25 kg/mo</span>
                  <span className={styles.tierPrice}>10% off</span>
                </div>
                <div className={styles.pricingTier}>
                  <span className={styles.tierRange}>25-50 kg/mo</span>
                  <span className={styles.tierPrice}>15% off</span>
                </div>
                <div className={styles.pricingTier}>
                  <span className={styles.tierRange}>50+ kg/mo</span>
                  <span className={styles.tierPrice}>20% off</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </B2BLayout>
  );
}
