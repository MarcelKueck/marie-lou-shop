'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useBrand } from '@/hooks/useBrand';
import Navigation from '@/components/layout/Navigation';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/cart/CartDrawer';
import styles from './faq.module.css';

interface FAQItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}

function FAQItem({ question, answer, isOpen, onToggle }: FAQItemProps) {
  return (
    <div className={styles.faqItem}>
      <button
        className={`${styles.faqQuestion} ${isOpen ? styles.open : ''}`}
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <span>{question}</span>
        <svg
          className={styles.chevron}
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>
      <div className={`${styles.faqAnswer} ${isOpen ? styles.open : ''}`}>
        <p>{answer}</p>
      </div>
    </div>
  );
}

export default function FAQPage() {
  const { brand } = useBrand();
  const t = useTranslations('faqPage');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqCategories = [
    {
      title: t('categories.ordering.title'),
      items: [
        { question: t('categories.ordering.q1'), answer: t('categories.ordering.a1') },
        { question: t('categories.ordering.q2'), answer: t('categories.ordering.a2') },
        { question: t('categories.ordering.q3'), answer: t('categories.ordering.a3') },
      ],
    },
    {
      title: t('categories.shipping.title'),
      items: [
        { question: t('categories.shipping.q1'), answer: t('categories.shipping.a1') },
        { question: t('categories.shipping.q2'), answer: t('categories.shipping.a2') },
        { question: t('categories.shipping.q3'), answer: t('categories.shipping.a3') },
      ],
    },
    {
      title: t('categories.coffee.title'),
      items: [
        { question: t('categories.coffee.q1'), answer: t('categories.coffee.a1') },
        { question: t('categories.coffee.q2'), answer: t('categories.coffee.a2') },
        { question: t('categories.coffee.q3'), answer: t('categories.coffee.a3') },
      ],
    },
    {
      title: t('categories.returns.title'),
      items: [
        { question: t('categories.returns.q1'), answer: t('categories.returns.a1') },
        { question: t('categories.returns.q2'), answer: t('categories.returns.a2') },
      ],
    },
  ];

  let globalIndex = 0;

  return (
    <div className={`theme-${brand.id}`}>
      <Navigation onCartClick={() => setIsCartOpen(true)} />

      <main className={styles.main}>
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <h1>{t('title')}</h1>
            <p className={styles.subtitle}>{t('subtitle')}</p>
          </div>
        </section>

        <section className={styles.faqSection}>
          <div className={styles.container}>
            {faqCategories.map((category, catIndex) => {
              return (
                <div key={catIndex} className={styles.category}>
                  <h2 className={styles.categoryTitle}>{category.title}</h2>
                  <div className={styles.faqList}>
                    {category.items.map((item, itemIndex) => {
                      const currentIndex = globalIndex++;
                      return (
                        <FAQItem
                          key={itemIndex}
                          question={item.question}
                          answer={item.answer}
                          isOpen={openIndex === currentIndex}
                          onToggle={() =>
                            setOpenIndex(openIndex === currentIndex ? null : currentIndex)
                          }
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className={styles.contactSection}>
          <div className={styles.contactContent}>
            <h2>{t('contactTitle')}</h2>
            <p>{t('contactDescription')}</p>
            <a href="mailto:hello@marieloucoffee.com" className={styles.contactButton}>
              {t('contactButton')}
            </a>
          </div>
        </section>
      </main>

      <Footer />

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
}
