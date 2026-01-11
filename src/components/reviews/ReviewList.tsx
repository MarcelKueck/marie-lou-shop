'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import styles from './ReviewList.module.css';

interface Review {
  id: string;
  rating: number;
  title?: string;
  content?: string;
  customerName: string;
  verifiedPurchase: boolean;
  createdAt: string;
  adminResponse?: string;
  adminRespondedAt?: string;
}

interface ReviewData {
  reviews: Review[];
  totalReviews: number;
  averageRating: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

interface ReviewListProps {
  productSlug: string;
}

export default function ReviewList({ productSlug }: ReviewListProps) {
  const t = useTranslations('reviews');
  const [data, setData] = useState<ReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchReviews() {
      try {
        const response = await fetch(`/api/reviews?productSlug=${encodeURIComponent(productSlug)}`);
        if (!response.ok) throw new Error('Failed to fetch reviews');
        const reviewData = await response.json();
        setData(reviewData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }
    
    fetchReviews();
  }, [productSlug]);
  
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>{t('loading')}</div>
      </div>
    );
  }
  
  if (error) {
    return null; // Silently fail - don't show errors for reviews
  }
  
  if (!data || data.totalReviews === 0) {
    return (
      <div className={styles.container}>
        <h2 className={styles.title}>{t('title')}</h2>
        <p className={styles.noReviews}>{t('noReviews')}</p>
      </div>
    );
  }
  
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>{t('title')}</h2>
      
      {/* Summary */}
      <div className={styles.summary}>
        <div className={styles.averageRating}>
          <span className={styles.ratingNumber}>{data.averageRating.toFixed(1)}</span>
          <div className={styles.stars}>
            {renderStars(data.averageRating)}
          </div>
          <span className={styles.totalReviews}>
            {data.totalReviews} {data.totalReviews === 1 ? t('review') : t('reviewsPlural')}
          </span>
        </div>
        
        <div className={styles.distribution}>
          {[5, 4, 3, 2, 1].map(rating => (
            <div key={rating} className={styles.distributionRow}>
              <span className={styles.distributionLabel}>{rating} ★</span>
              <div className={styles.distributionBar}>
                <div 
                  className={styles.distributionFill}
                  style={{ 
                    width: `${data.totalReviews > 0 
                      ? (data.ratingDistribution[rating as keyof typeof data.ratingDistribution] / data.totalReviews) * 100 
                      : 0}%` 
                  }}
                />
              </div>
              <span className={styles.distributionCount}>
                {data.ratingDistribution[rating as keyof typeof data.ratingDistribution]}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Reviews List */}
      <div className={styles.list}>
        {data.reviews.map(review => (
          <div key={review.id} className={styles.review}>
            <div className={styles.reviewHeader}>
              <div className={styles.reviewMeta}>
                <span className={styles.reviewStars}>{renderStars(review.rating)}</span>
                {review.verifiedPurchase && (
                  <span className={styles.verified}>✓ {t('verifiedPurchase')}</span>
                )}
              </div>
              <span className={styles.reviewDate}>
                {new Date(review.createdAt).toLocaleDateString('de-DE')}
              </span>
            </div>
            
            {review.title && <h3 className={styles.reviewTitle}>{review.title}</h3>}
            
            {review.content && <p className={styles.reviewContent}>{review.content}</p>}
            
            <p className={styles.reviewAuthor}>— {review.customerName}</p>
            
            {review.adminResponse && (
              <div className={styles.adminResponse}>
                <strong>{t('sellerResponse')}</strong>
                <p>{review.adminResponse}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function renderStars(rating: number): string {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
  
  return '★'.repeat(fullStars) + (halfStar ? '½' : '') + '☆'.repeat(emptyStars);
}
