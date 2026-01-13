'use client';

import { useState, useEffect, use } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { useBrand } from '@/hooks/useBrand';
import Navigation from '@/components/layout/Navigation';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/cart/CartDrawer';
import { ReviewForm } from '@/components/reviews';
import styles from './review.module.css';

interface ReviewRequestData {
  valid: boolean;
  orderId: string;
  orderNumber: string;
  productId: string;
  productName: string;
  productImage: string | null;
  variantName: string;
  customerName: string;
  alreadyReviewed: boolean;
  rewardAmount: number;
}

interface PageProps {
  params: Promise<{ token: string; locale: string }>;
}

export default function ReviewPage({ params }: PageProps) {
  const { token } = use(params);
  const { brand } = useBrand();
  const locale = useLocale() as 'de' | 'en';
  const t = useTranslations('reviews');
  
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ReviewRequestData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [rewardCode, setRewardCode] = useState<string | null>(null);

  useEffect(() => {
    async function validateToken() {
      try {
        const res = await fetch(`/api/reviews/validate-token?token=${token}`);
        const result = await res.json();
        
        if (!res.ok || !result.valid) {
          setError(result.error || 'Invalid or expired review link');
          return;
        }
        
        setData(result);
      } catch (err) {
        setError('Failed to load review request');
      } finally {
        setLoading(false);
      }
    }
    
    validateToken();
  }, [token]);

  const handleReviewSuccess = async () => {
    // Fetch the reward code that was generated
    try {
      const res = await fetch(`/api/reviews/claim-reward?token=${token}`);
      if (res.ok) {
        const result = await res.json();
        setRewardCode(result.code);
      }
    } catch (err) {
      console.error('Failed to claim reward:', err);
    }
    setReviewSubmitted(true);
  };

  if (loading) {
    return (
      <div className={`theme-${brand.id}`}>
        <Navigation onCartClick={() => setIsCartOpen(true)} />
        <main className={styles.main}>
          <div className={styles.container}>
            <div className={styles.loading}>
              {locale === 'de' ? 'Laden...' : 'Loading...'}
            </div>
          </div>
        </main>
        <Footer />
        <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={`theme-${brand.id}`}>
        <Navigation onCartClick={() => setIsCartOpen(true)} />
        <main className={styles.main}>
          <div className={styles.container}>
            <div className={styles.errorState}>
              <span className={styles.errorIcon}>⚠️</span>
              <h1>{locale === 'de' ? 'Link ungültig' : 'Invalid Link'}</h1>
              <p>
                {locale === 'de' 
                  ? 'Dieser Bewertungslink ist ungültig oder abgelaufen.' 
                  : 'This review link is invalid or has expired.'}
              </p>
              <Link href={`/${locale}/account`} className={styles.button}>
                {locale === 'de' ? 'Zum Konto' : 'Go to Account'}
              </Link>
            </div>
          </div>
        </main>
        <Footer />
        <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      </div>
    );
  }

  if (data.alreadyReviewed) {
    return (
      <div className={`theme-${brand.id}`}>
        <Navigation onCartClick={() => setIsCartOpen(true)} />
        <main className={styles.main}>
          <div className={styles.container}>
            <div className={styles.alreadyReviewed}>
              <span className={styles.successIcon}>✓</span>
              <h1>{locale === 'de' ? 'Bereits bewertet' : 'Already Reviewed'}</h1>
              <p>
                {locale === 'de' 
                  ? 'Du hast dieses Produkt bereits bewertet. Vielen Dank!' 
                  : 'You have already reviewed this product. Thank you!'}
              </p>
              <Link href={`/${locale}/shop`} className={styles.button}>
                {locale === 'de' ? 'Weiter einkaufen' : 'Continue Shopping'}
              </Link>
            </div>
          </div>
        </main>
        <Footer />
        <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      </div>
    );
  }

  if (reviewSubmitted) {
    return (
      <div className={`theme-${brand.id}`}>
        <Navigation onCartClick={() => setIsCartOpen(true)} />
        <main className={styles.main}>
          <div className={styles.container}>
            <div className={styles.thankYou}>
              <span className={styles.giftIcon}>🎁</span>
              <h1>{locale === 'de' ? 'Vielen Dank!' : 'Thank You!'}</h1>
              <p>
                {locale === 'de' 
                  ? 'Deine Bewertung hilft anderen Kunden bei ihrer Entscheidung.' 
                  : 'Your review helps other customers make their decision.'}
              </p>
              
              {rewardCode && (
                <div className={styles.rewardSection}>
                  <h2>{locale === 'de' ? 'Dein Dankeschön-Gutschein' : 'Your Thank You Voucher'}</h2>
                  <p>
                    {locale === 'de' 
                      ? `Als Dankeschön erhältst du €${(data.rewardAmount / 100).toFixed(2)} Rabatt auf deine nächste Bestellung!`
                      : `As a thank you, you get €${(data.rewardAmount / 100).toFixed(2)} off your next order!`}
                  </p>
                  <div className={styles.codeBox}>
                    <span className={styles.code}>{rewardCode}</span>
                    <button 
                      className={styles.copyButton}
                      onClick={() => navigator.clipboard.writeText(rewardCode)}
                    >
                      {locale === 'de' ? 'Kopieren' : 'Copy'}
                    </button>
                  </div>
                </div>
              )}
              
              <Link href={`/${locale}/shop`} className={styles.button}>
                {locale === 'de' ? 'Weiter einkaufen' : 'Continue Shopping'}
              </Link>
            </div>
          </div>
        </main>
        <Footer />
        <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      </div>
    );
  }

  return (
    <div className={`theme-${brand.id}`}>
      <Navigation onCartClick={() => setIsCartOpen(true)} />
      
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.header}>
            <h1>{locale === 'de' ? 'Bewerte deinen Einkauf' : 'Review Your Purchase'}</h1>
            <p>
              {locale === 'de' 
                ? `Hallo ${data.customerName}! Wie hat dir dein Kaffee geschmeckt?`
                : `Hi ${data.customerName}! How did you enjoy your coffee?`}
            </p>
          </div>

          <div className={styles.productCard}>
            <div className={styles.productImage}>
              {data.productImage ? (
                <Image
                  src={data.productImage}
                  alt={data.productName}
                  width={120}
                  height={120}
                  className={styles.image}
                />
              ) : (
                <div className={styles.imagePlaceholder} />
              )}
            </div>
            <div className={styles.productInfo}>
              <h2>{data.productName}</h2>
              <p className={styles.variant}>{data.variantName}</p>
              <p className={styles.orderNumber}>
                {locale === 'de' ? 'Bestellung' : 'Order'} #{data.orderNumber}
              </p>
            </div>
          </div>

          <div className={styles.rewardBanner}>
            <span className={styles.giftEmoji}>🎁</span>
            <div>
              <strong>
                {locale === 'de' 
                  ? `Erhalte €${(data.rewardAmount / 100).toFixed(2)} Rabatt!`
                  : `Get €${(data.rewardAmount / 100).toFixed(2)} off!`}
              </strong>
              <p>
                {locale === 'de' 
                  ? 'Als Dankeschön für deine Bewertung erhältst du einen Gutscheincode.'
                  : 'As a thank you for your review, you\'ll receive a discount code.'}
              </p>
            </div>
          </div>

          <div className={styles.formWrapper}>
            <ReviewForm 
              productSlug={data.productId} 
              orderId={data.orderId}
              onSuccess={handleReviewSuccess}
              customerName={data.customerName}
              reviewToken={token}
            />
          </div>
        </div>
      </main>

      <Footer />
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
}
