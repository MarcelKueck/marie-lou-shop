'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import styles from './Story.module.css';

export default function Story() {
  const t = useTranslations('story');

  return (
    <section className={styles.story} id="story">
      <div className={styles.imageContainer}>
        <div className={styles.accent} />
        <Image
          src="/images/story/founder.png"
          alt="Coffee roasting"
          width={600}
          height={500}
          className={styles.image}
        />
      </div>

      <div className={styles.content}>
        <h2>
          {t('title')} <em>{t('brand')}</em>
        </h2>
        <p>{t('paragraph1')}</p>
        <p>{t('paragraph2')}</p>
        <p>{t('paragraph3')}</p>
        <p>{t('paragraph4')}</p>

        <div className={styles.signature}>
          <span className={styles.signatureText}>{t('signature')}</span>
        </div>

        <Link href="/story" className="btn btn-secondary">
          {t('readMore')}
        </Link>
      </div>
    </section>
  );
}
