import { getTranslations } from 'next-intl/server';
import Image from 'next/image';
import { B2BLayout } from '@/components/b2b';
import WaitlistForm from './WaitlistForm';
import styles from './waitlist.module.css';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'b2b.waitlist' });
  
  return {
    title: t('meta.title'),
    description: t('meta.description'),
  };
}

export default async function B2BWaitlistPage() {
  const t = await getTranslations('b2b.waitlist');

  return (
    <B2BLayout>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.badge}>{t('hero.badge')}</div>
          <h1 className={styles.heroTitle}>{t('hero.title')}</h1>
          <p className={styles.heroSubtitle}>{t('hero.subtitle')}</p>
          
          <div className={styles.heroStats}>
            <div className={styles.stat}>
              <span className={styles.statValue}>50+</span>
              <span className={styles.statLabel}>{t('hero.stats.companies')}</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>15%</span>
              <span className={styles.statLabel}>{t('hero.stats.savings')}</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>0</span>
              <span className={styles.statLabel}>{t('hero.stats.waste')}</span>
            </div>
          </div>
        </div>
        
        <div className={styles.heroImage}>
          <Image 
            src="/smart_box_vision.png" 
            alt="SmartBox Coffee Container"
            width={500}
            height={400}
            className={styles.smartboxImage}
          />
        </div>
      </section>

      {/* Problem Section */}
      <section className={styles.problem}>
        <h2>{t('problem.title')}</h2>
        <div className={styles.problemGrid}>
          <div className={styles.problemCard}>
            <span className={styles.problemIcon}>⏰</span>
            <h3>{t('problem.time.title')}</h3>
            <p>{t('problem.time.desc')}</p>
          </div>
          <div className={styles.problemCard}>
            <span className={styles.problemIcon}>🗑️</span>
            <h3>{t('problem.waste.title')}</h3>
            <p>{t('problem.waste.desc')}</p>
          </div>
          <div className={styles.problemCard}>
            <span className={styles.problemIcon}>😤</span>
            <h3>{t('problem.frustration.title')}</h3>
            <p>{t('problem.frustration.desc')}</p>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className={styles.solution}>
        <h2>{t('solution.title')}</h2>
        <p className={styles.solutionSubtitle}>{t('solution.subtitle')}</p>
        
        <div className={styles.howItWorks}>
          <div className={styles.step}>
            <div className={styles.stepNumber}>1</div>
            <h3>{t('solution.step1.title')}</h3>
            <p>{t('solution.step1.desc')}</p>
          </div>
          <div className={styles.stepArrow}>→</div>
          <div className={styles.step}>
            <div className={styles.stepNumber}>2</div>
            <h3>{t('solution.step2.title')}</h3>
            <p>{t('solution.step2.desc')}</p>
          </div>
          <div className={styles.stepArrow}>→</div>
          <div className={styles.step}>
            <div className={styles.stepNumber}>3</div>
            <h3>{t('solution.step3.title')}</h3>
            <p>{t('solution.step3.desc')}</p>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className={styles.benefits}>
        <h2>{t('benefits.title')}</h2>
        <div className={styles.benefitsGrid}>
          <div className={styles.benefitCard}>
            <span className={styles.benefitIcon}>🎯</span>
            <h3>{t('benefits.neverRunOut.title')}</h3>
            <p>{t('benefits.neverRunOut.desc')}</p>
          </div>
          <div className={styles.benefitCard}>
            <span className={styles.benefitIcon}>💰</span>
            <h3>{t('benefits.predictable.title')}</h3>
            <p>{t('benefits.predictable.desc')}</p>
          </div>
          <div className={styles.benefitCard}>
            <span className={styles.benefitIcon}>🌱</span>
            <h3>{t('benefits.sustainable.title')}</h3>
            <p>{t('benefits.sustainable.desc')}</p>
          </div>
          <div className={styles.benefitCard}>
            <span className={styles.benefitIcon}>☕</span>
            <h3>{t('benefits.quality.title')}</h3>
            <p>{t('benefits.quality.desc')}</p>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className={styles.pricing}>
        <h2>{t('pricing.title')}</h2>
        <p className={styles.pricingSubtitle}>{t('pricing.subtitle')}</p>
        
        <div className={styles.pricingCards}>
          <div className={styles.pricingCard}>
            <h3>B2B Flex</h3>
            <p className={styles.pricingDesc}>{t('pricing.flex.desc')}</p>
            <ul className={styles.pricingFeatures}>
              <li>✓ {t('pricing.flex.feature1')}</li>
              <li>✓ {t('pricing.flex.feature2')}</li>
              <li>✓ {t('pricing.flex.feature3')}</li>
            </ul>
            <p className={styles.pricingNote}>{t('pricing.flex.note')}</p>
          </div>
          
          <div className={`${styles.pricingCard} ${styles.featured}`}>
            <div className={styles.featuredBadge}>{t('pricing.smart.badge')}</div>
            <h3>B2B Smart</h3>
            <p className={styles.pricingDesc}>{t('pricing.smart.desc')}</p>
            <ul className={styles.pricingFeatures}>
              <li>✓ {t('pricing.smart.feature1')}</li>
              <li>✓ {t('pricing.smart.feature2')}</li>
              <li>✓ {t('pricing.smart.feature3')}</li>
              <li>✓ {t('pricing.smart.feature4')}</li>
            </ul>
            <p className={styles.pricingPrice}>
              {t('pricing.smart.from')} <strong>€12</strong> {t('pricing.smart.perEmployee')}
            </p>
          </div>
        </div>
      </section>

      {/* Waitlist Form */}
      <section className={styles.waitlistSection} id="join">
        <div className={styles.waitlistContent}>
          <h2>{t('form.title')}</h2>
          <p className={styles.waitlistSubtitle}>{t('form.subtitle')}</p>
          
          <div className={styles.earlyBirdBenefits}>
            <h4>{t('form.earlyBird.title')}</h4>
            <ul>
              <li>🎁 {t('form.earlyBird.benefit1')}</li>
              <li>🚀 {t('form.earlyBird.benefit2')}</li>
              <li>💬 {t('form.earlyBird.benefit3')}</li>
            </ul>
          </div>
          
          <WaitlistForm />
        </div>
      </section>

      {/* FAQ Section */}
      <section className={styles.faq}>
        <h2>{t('faq.title')}</h2>
        <div className={styles.faqGrid}>
          <div className={styles.faqItem}>
            <h4>{t('faq.q1.question')}</h4>
            <p>{t('faq.q1.answer')}</p>
          </div>
          <div className={styles.faqItem}>
            <h4>{t('faq.q2.question')}</h4>
            <p>{t('faq.q2.answer')}</p>
          </div>
          <div className={styles.faqItem}>
            <h4>{t('faq.q3.question')}</h4>
            <p>{t('faq.q3.answer')}</p>
          </div>
          <div className={styles.faqItem}>
            <h4>{t('faq.q4.question')}</h4>
            <p>{t('faq.q4.answer')}</p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className={styles.finalCta}>
        <h2>{t('cta.title')}</h2>
        <p>{t('cta.subtitle')}</p>
        <a href="#join" className={styles.ctaButton}>{t('cta.button')}</a>
      </section>
    </B2BLayout>
  );
}
