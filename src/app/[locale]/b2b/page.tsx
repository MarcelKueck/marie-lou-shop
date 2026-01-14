'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { B2BLayout } from '@/components/b2b';
import styles from './b2b.module.css';

export default function B2BLandingPage() {
  const t = useTranslations('b2b');
  const router = useRouter();

  return (
    <B2BLayout>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroImageWrapper}>
          <Image
            src="/smart_box_vision.png"
            alt="SmartBox - Automated Coffee Replenishment"
            fill
            className={styles.heroImg}
            priority
            sizes="55vw"
          />
          <div className={styles.imageOverlay} />
        </div>
        
        <div className={styles.heroContent}>
          <span className={styles.badge}>{t('landing.badge')}</span>
          <h1 className={styles.heroTitle}>
            {t('landing.titleLine1')} <em>{t('landing.titleEmphasis')}</em>
          </h1>
          <p className={styles.heroSubtitle}>{t('landing.subtitle')}</p>
          <div className={styles.heroCtas}>
            <button
              className={styles.primaryButton}
              onClick={() => router.push('/b2b/inquiry?tier=smart')}
            >
              {t('landing.heroCta')}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
            <button
              className={styles.secondaryButton}
              onClick={() => router.push('/b2b/inquiry?tier=flex')}
            >
              {t('landing.secondaryCta')}
            </button>
          </div>
        </div>
      </section>

      {/* Tier Comparison */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t('tiers.title')}</h2>
        <p className={styles.sectionSubtitle}>{t('tiers.subtitle')}</p>
        
        <div className={styles.tierGrid}>
          {/* Smart Tier */}
          <div className={`${styles.tierCard} ${styles.tierCardFeatured}`}>
            <span className={styles.tierBadge}>{t('landing.smartBadge')}</span>
            <h3 className={styles.tierName}>{t('tiers.smart.name')}</h3>
            <p className={styles.tierTagline}>{t('tiers.smart.tagline')}</p>
            <p className={styles.tierDescription}>{t('tiers.smart.description')}</p>
            <ul className={styles.tierFeatures}>
              {(t.raw('tiers.smart.features') as string[]).map((feature, index) => (
                <li key={index} className={styles.tierFeature}>
                  <span className={styles.checkmark}>✓</span>
                  {feature}
                </li>
              ))}
            </ul>
            <p className={styles.tierPricing}>{t('tiers.smart.pricing')}</p>
            <button
              className={styles.primaryButton}
              onClick={() => router.push('/b2b/inquiry?tier=smart')}
            >
              {t('tiers.smart.cta')}
            </button>
          </div>

          {/* Flex Tier */}
          <div className={styles.tierCard}>
            <span className={styles.tierBadgeSecondary}>{t('landing.flexBadge')}</span>
            <h3 className={styles.tierName}>{t('tiers.flex.name')}</h3>
            <p className={styles.tierTagline}>{t('tiers.flex.tagline')}</p>
            <p className={styles.tierDescription}>{t('tiers.flex.description')}</p>
            <ul className={styles.tierFeatures}>
              {(t.raw('tiers.flex.features') as string[]).map((feature, index) => (
                <li key={index} className={styles.tierFeature}>
                  <span className={styles.checkmark}>✓</span>
                  {feature}
                </li>
              ))}
            </ul>
            <p className={styles.tierPricing}>{t('tiers.flex.pricing')}</p>
            <button
              className={styles.secondaryButton}
              onClick={() => router.push('/b2b/inquiry?tier=flex')}
            >
              {t('tiers.flex.cta')}
            </button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className={`${styles.section} ${styles.sectionAlt}`}>
        <h2 className={styles.sectionTitle}>{t('features.title')}</h2>
        <div className={styles.featureGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>📦</div>
            <h3 className={styles.featureTitle}>{t('features.smartBox.title')}</h3>
            <p className={styles.featureDescription}>{t('features.smartBox.description')}</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>🌱</div>
            <h3 className={styles.featureTitle}>{t('features.sustainability.title')}</h3>
            <p className={styles.featureDescription}>{t('features.sustainability.description')}</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>☕</div>
            <h3 className={styles.featureTitle}>{t('features.quality.title')}</h3>
            <p className={styles.featureDescription}>{t('features.quality.description')}</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>✨</div>
            <h3 className={styles.featureTitle}>{t('features.convenience.title')}</h3>
            <p className={styles.featureDescription}>{t('features.convenience.description')}</p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t('howItWorks.title')}</h2>
        <div className={styles.stepsGrid}>
          <div className={styles.step}>
            <div className={styles.stepNumber}>1</div>
            <h3 className={styles.stepTitle}>{t('howItWorks.step1.title')}</h3>
            <p className={styles.stepDescription}>{t('howItWorks.step1.description')}</p>
          </div>
          <div className={styles.step}>
            <div className={styles.stepNumber}>2</div>
            <h3 className={styles.stepTitle}>{t('howItWorks.step2.title')}</h3>
            <p className={styles.stepDescription}>{t('howItWorks.step2.description')}</p>
          </div>
          <div className={styles.step}>
            <div className={styles.stepNumber}>3</div>
            <h3 className={styles.stepTitle}>{t('howItWorks.step3.title')}</h3>
            <p className={styles.stepDescription}>{t('howItWorks.step3.description')}</p>
          </div>
          <div className={styles.step}>
            <div className={styles.stepNumber}>4</div>
            <h3 className={styles.stepTitle}>{t('howItWorks.step4.title')}</h3>
            <p className={styles.stepDescription}>{t('howItWorks.step4.description')}</p>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className={`${styles.section} ${styles.sectionAlt}`}>
        <h2 className={styles.sectionTitle}>{t('pricing.title')}</h2>
        <p className={styles.sectionSubtitle}>{t('pricing.subtitle')}</p>
        
        <div className={styles.pricingGrid}>
          <div className={styles.pricingCard}>
            <h4 className={styles.pricingName}>{t('pricing.smart.starter.name')}</h4>
            <p className={styles.pricingEmployees}>{t('pricing.smart.starter.employees')}</p>
            <div className={styles.pricingAmount}>
              <span className={styles.pricingPrice}>{t('pricing.smart.starter.price')}</span>
              <span className={styles.pricingUnit}>{t('pricing.smart.starter.unit')}</span>
            </div>
            <p className={styles.pricingIncludes}>{t('pricing.smart.starter.includes')}</p>
          </div>
          <div className={`${styles.pricingCard} ${styles.pricingCardFeatured}`}>
            <h4 className={styles.pricingName}>{t('pricing.smart.growth.name')}</h4>
            <p className={styles.pricingEmployees}>{t('pricing.smart.growth.employees')}</p>
            <div className={styles.pricingAmount}>
              <span className={styles.pricingPrice}>{t('pricing.smart.growth.price')}</span>
              <span className={styles.pricingUnit}>{t('pricing.smart.growth.unit')}</span>
            </div>
            <p className={styles.pricingIncludes}>{t('pricing.smart.growth.includes')}</p>
          </div>
          <div className={styles.pricingCard}>
            <h4 className={styles.pricingName}>{t('pricing.smart.scale.name')}</h4>
            <p className={styles.pricingEmployees}>{t('pricing.smart.scale.employees')}</p>
            <div className={styles.pricingAmount}>
              <span className={styles.pricingPrice}>{t('pricing.smart.scale.price')}</span>
              <span className={styles.pricingUnit}>{t('pricing.smart.scale.unit')}</span>
            </div>
            <p className={styles.pricingIncludes}>{t('pricing.smart.scale.includes')}</p>
          </div>
          <div className={styles.pricingCard}>
            <h4 className={styles.pricingName}>{t('pricing.smart.enterprise.name')}</h4>
            <p className={styles.pricingEmployees}>{t('pricing.smart.enterprise.employees')}</p>
            <div className={styles.pricingAmount}>
              <span className={styles.pricingPrice}>{t('pricing.smart.enterprise.price')}</span>
              <span className={styles.pricingUnit}>{t('pricing.smart.enterprise.unit')}</span>
            </div>
            <p className={styles.pricingIncludes}>{t('pricing.smart.enterprise.includes')}</p>
          </div>
        </div>

        <Link href="/b2b/pricing" className={styles.pricingCta}>
          {t('pricing.cta')} →
        </Link>
      </section>

      {/* Cross-sell Feature */}
      <section className={styles.section}>
        <div className={styles.crossSellCard}>
          <span className={styles.crossSellBadge}>{t('crossSell.badge')}</span>
          <h3 className={styles.crossSellTitle}>{t('crossSell.title')}</h3>
          <p className={styles.crossSellDescription}>{t('crossSell.description')}</p>
        </div>
      </section>

      {/* Testimonials */}
      <section className={`${styles.section} ${styles.sectionAlt}`}>
        <h2 className={styles.sectionTitle}>{t('testimonials.title')}</h2>
        <div className={styles.testimonialGrid}>
          <div className={styles.testimonialCard}>
            <p className={styles.testimonialText}>&ldquo;{t('testimonials.quote1.text')}&rdquo;</p>
            <div className={styles.testimonialAuthor}>
              <strong>{t('testimonials.quote1.author')}</strong>
              <span>{t('testimonials.quote1.company')}</span>
              <span className={styles.testimonialEmployees}>{t('testimonials.quote1.employees')}</span>
            </div>
          </div>
          <div className={styles.testimonialCard}>
            <p className={styles.testimonialText}>&ldquo;{t('testimonials.quote2.text')}&rdquo;</p>
            <div className={styles.testimonialAuthor}>
              <strong>{t('testimonials.quote2.author')}</strong>
              <span>{t('testimonials.quote2.company')}</span>
              <span className={styles.testimonialEmployees}>{t('testimonials.quote2.employees')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t('faq.title')}</h2>
        <div className={styles.faqList}>
          {(t.raw('faq.items') as Array<{ question: string; answer: string }>).map((item, index) => (
            <details key={index} className={styles.faqItem}>
              <summary className={styles.faqQuestion}>{item.question}</summary>
              <p className={styles.faqAnswer}>{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className={`${styles.section} ${styles.ctaSection}`}>
        <h2 className={styles.ctaTitle}>{t('cta.title')}</h2>
        <p className={styles.ctaSubtitle}>{t('cta.subtitle')}</p>
        <div className={styles.ctaButtons}>
          <button
            className={styles.primaryButton}
            onClick={() => router.push('/b2b/inquiry?tier=smart')}
          >
            {t('cta.smart')}
          </button>
          <button
            className={styles.secondaryButton}
            onClick={() => router.push('/b2b/inquiry?tier=flex')}
          >
            {t('cta.flex')}
          </button>
        </div>
        <p className={styles.ctaContact}>
          {t('cta.contact')}{' '}
          <a href="mailto:b2b@marieloucoffee.com" className={styles.ctaLink}>
            b2b@marieloucoffee.com
          </a>
        </p>
      </section>
    </B2BLayout>
  );
}
