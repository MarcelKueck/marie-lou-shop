'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import styles from './ReviewForm.module.css';

interface ReviewFormProps {
  productSlug: string;
  orderId?: string;
  onSuccess?: () => void;
}

export default function ReviewForm({ productSlug, orderId, onSuccess }: ReviewFormProps) {
  const t = useTranslations('reviews');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      setError(t('ratingRequired'));
      return;
    }
    
    if (!customerName.trim()) {
      setError(t('nameRequired'));
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productSlug,
          orderId,
          rating,
          title: title.trim() || undefined,
          content: content.trim() || undefined,
          customerName: customerName.trim(),
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit review');
      }
      
      setSuccess(true);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className={styles.successMessage}>
        <span className={styles.successIcon}>✓</span>
        <h3>{t('thankYou')}</h3>
        <p>{t('reviewSubmitted')}</p>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <h3 className={styles.formTitle}>{t('writeReview')}</h3>
      
      {error && (
        <div className={styles.error}>{error}</div>
      )}
      
      {/* Rating Stars */}
      <div className={styles.field}>
        <label className={styles.label}>{t('yourRating')} *</label>
        <div className={styles.starRating}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className={`${styles.starButton} ${(hoverRating || rating) >= star ? styles.starFilled : ''}`}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(star)}
            >
              ★
            </button>
          ))}
        </div>
      </div>
      
      {/* Name */}
      <div className={styles.field}>
        <label htmlFor="customerName" className={styles.label}>{t('yourName')} *</label>
        <input
          type="text"
          id="customerName"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          placeholder={t('namePlaceholder')}
          className={styles.input}
          maxLength={50}
          required
        />
      </div>
      
      {/* Title */}
      <div className={styles.field}>
        <label htmlFor="title" className={styles.label}>{t('reviewTitle')}</label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('titlePlaceholder')}
          className={styles.input}
          maxLength={100}
        />
      </div>
      
      {/* Content */}
      <div className={styles.field}>
        <label htmlFor="content" className={styles.label}>{t('reviewContent')}</label>
        <textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={t('contentPlaceholder')}
          className={styles.textarea}
          rows={4}
          maxLength={1000}
        />
      </div>
      
      <button 
        type="submit" 
        className={styles.submitButton}
        disabled={isSubmitting || rating === 0}
      >
        {isSubmitting ? t('submitting') : t('submitReview')}
      </button>
    </form>
  );
}
