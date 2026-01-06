'use client';

import { useTranslations } from 'next-intl';
import styles from './Testimonials.module.css';

export function Testimonials() {
  const t = useTranslations('testimonials');

  const testimonials = [
    { key: 'testimonial1' },
    { key: 'testimonial2' },
    { key: 'testimonial3' },
  ] as const;

  return (
    <section className={styles.testimonials}>
      <div className={styles.container}>
        <span className={styles.badge}>{t('badge')}</span>
        <h2 className={styles.title}>{t('title')}</h2>
        
        <div className={styles.grid}>
          {testimonials.map(({ key }) => (
            <div key={key} className={styles.testimonial}>
              <div className={styles.stars}>★★★★★</div>
              <p className={styles.quote}>&ldquo;{t(`${key}.quote`)}&rdquo;</p>
              <div className={styles.author}>
                <div className={styles.avatar}></div>
                <div className={styles.info}>
                  <strong>{t(`${key}.name`)}</strong>
                  <span>{t(`${key}.location`)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Testimonials;
