'use client';

import { useTranslations } from 'next-intl';
import styles from './Process.module.css';

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
          {steps.map(({ step, key }) => (
            <div key={step} className={styles.step}>
              <div className={styles.stepNumber}>{step}</div>
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
