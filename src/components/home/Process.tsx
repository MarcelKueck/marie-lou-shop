'use client';

import { useTranslations } from 'next-intl';
import styles from './Process.module.css';

// Simple inline SVG icons for each step
const StepIcons = {
  step1: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v4m0 12v4M2 12h4m12 0h4" />
      <path d="M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
    </svg>
  ),
  step2: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10" />
      <path d="M12 6v6l4 2" />
      <path d="M20 4l-2 2m2-2l-2-2m2 2h-4" />
    </svg>
  ),
  step3: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
      <path d="M12 12v3" />
      <circle cx="12" cy="16" r="1" />
    </svg>
  ),
  step4: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
      <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z" />
      <path d="M6 2v4m4-4v4m4-4v4" />
    </svg>
  ),
};

export function Process() {
  const t = useTranslations('process');

  const steps = [
    { step: '01', key: 'step1' },
    { step: '02', key: 'step2' },
    { step: '03', key: 'step3' },
    { step: '04', key: 'step4' },
  ] as const;

  return (
    <section className={styles.process} id="process">
      <div className={styles.container}>
        <span className={styles.badge}>{t('badge')}</span>
        <h2 className={styles.title}>{t('title')}</h2>
        
        <div className={styles.steps}>
          {steps.map(({ step, key }, index) => (
            <div key={step} className={styles.step}>
              <div className={styles.stepHeader}>
                <div className={styles.iconWrapper}>
                  {StepIcons[key]}
                </div>
                <div className={styles.stepNumber}>{step}</div>
              </div>
              {index < steps.length - 1 && <div className={styles.connector} />}
              <h3>{t(`${key}.title`)}</h3>
              <p>{t(`${key}.description`)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Process;
