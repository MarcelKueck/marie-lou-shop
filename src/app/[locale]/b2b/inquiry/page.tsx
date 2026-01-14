'use client';

import { useState, useEffect, Suspense } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams, useRouter } from 'next/navigation';
import { B2BLayout } from '@/components/b2b';
import styles from './inquiry.module.css';

function InquiryFormContent() {
  const t = useTranslations('b2b');
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    companyName: '',
    contactFirstName: '',
    contactLastName: '',
    contactEmail: '',
    contactPhone: '',
    employeeCount: '',
    preferredTier: searchParams.get('tier') || 'smart',
    preferredBrand: 'coffee',
    currentSolution: '',
    message: '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  
  // Update preferredTier when searchParams change
  useEffect(() => {
    const tier = searchParams.get('tier');
    if (tier && (tier === 'smart' || tier === 'flex')) {
      setFormData(prev => ({ ...prev, preferredTier: tier }));
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const response = await fetch('/api/b2b/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          employeeCount: parseInt(formData.employeeCount) || 0,
        }),
      });

      if (response.ok) {
        setSubmitStatus('success');
        // Reset form
        setFormData({
          companyName: '',
          contactFirstName: '',
          contactLastName: '',
          contactEmail: '',
          contactPhone: '',
          employeeCount: '',
          preferredTier: 'smart',
          preferredBrand: 'coffee',
          currentSolution: '',
          message: '',
        });
      } else {
        setSubmitStatus('error');
      }
    } catch {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (submitStatus === 'success') {
    return (
      <B2BLayout>
        <div className={styles.successContainer}>
          <div className={styles.successIcon}>✓</div>
          <h1 className={styles.successTitle}>{t('inquiry.success')}</h1>
          <p className={styles.successMessage}>
            We&apos;ll be in touch within 24 hours to discuss your coffee needs.
          </p>
          <button
            className={styles.primaryButton}
            onClick={() => router.push('/b2b')}
          >
            Back to B2B
          </button>
        </div>
      </B2BLayout>
    );
  }

  return (
    <B2BLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>{t('inquiry.title')}</h1>
          <p className={styles.subtitle}>{t('inquiry.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Company Name */}
          <div className={styles.field}>
            <label htmlFor="companyName" className={styles.label}>
              {t('inquiry.fields.companyName')} *
            </label>
            <input
              type="text"
              id="companyName"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              required
              className={styles.input}
            />
          </div>

          {/* Name Fields */}
          <div className={styles.fieldRow}>
            <div className={styles.field}>
              <label htmlFor="contactFirstName" className={styles.label}>
                {t('inquiry.fields.contactFirstName')} *
              </label>
              <input
                type="text"
                id="contactFirstName"
                name="contactFirstName"
                value={formData.contactFirstName}
                onChange={handleChange}
                required
                className={styles.input}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="contactLastName" className={styles.label}>
                {t('inquiry.fields.contactLastName')} *
              </label>
              <input
                type="text"
                id="contactLastName"
                name="contactLastName"
                value={formData.contactLastName}
                onChange={handleChange}
                required
                className={styles.input}
              />
            </div>
          </div>

          {/* Contact Fields */}
          <div className={styles.fieldRow}>
            <div className={styles.field}>
              <label htmlFor="contactEmail" className={styles.label}>
                {t('inquiry.fields.contactEmail')} *
              </label>
              <input
                type="email"
                id="contactEmail"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleChange}
                required
                className={styles.input}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="contactPhone" className={styles.label}>
                {t('inquiry.fields.contactPhone')}
              </label>
              <input
                type="tel"
                id="contactPhone"
                name="contactPhone"
                value={formData.contactPhone}
                onChange={handleChange}
                className={styles.input}
              />
            </div>
          </div>

          {/* Employee Count */}
          <div className={styles.field}>
            <label htmlFor="employeeCount" className={styles.label}>
              {t('inquiry.fields.employeeCount')} *
            </label>
            <input
              type="number"
              id="employeeCount"
              name="employeeCount"
              value={formData.employeeCount}
              onChange={handleChange}
              required
              min="1"
              className={styles.input}
            />
          </div>

          {/* Tier Selection */}
          <div className={styles.field}>
            <label className={styles.label}>
              {t('inquiry.fields.preferredTier')} *
            </label>
            <div className={styles.radioGroup}>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="preferredTier"
                  value="smart"
                  checked={formData.preferredTier === 'smart'}
                  onChange={handleChange}
                  className={styles.radio}
                />
                <span className={styles.radioText}>
                  {t('inquiry.tierOptions.smart')}
                </span>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="preferredTier"
                  value="flex"
                  checked={formData.preferredTier === 'flex'}
                  onChange={handleChange}
                  className={styles.radio}
                />
                <span className={styles.radioText}>
                  {t('inquiry.tierOptions.flex')}
                </span>
              </label>
            </div>
          </div>

          {/* Brand Selection */}
          <div className={styles.field}>
            <label htmlFor="preferredBrand" className={styles.label}>
              {t('inquiry.fields.preferredBrand')} *
            </label>
            <select
              id="preferredBrand"
              name="preferredBrand"
              value={formData.preferredBrand}
              onChange={handleChange}
              required
              className={styles.select}
            >
              <option value="coffee">{t('inquiry.brandOptions.coffee')}</option>
              <option value="tea">{t('inquiry.brandOptions.tea')}</option>
              <option value="both">{t('inquiry.brandOptions.both')}</option>
            </select>
          </div>

          {/* Current Solution */}
          <div className={styles.field}>
            <label htmlFor="currentSolution" className={styles.label}>
              {t('inquiry.fields.currentSolution')} *
            </label>
            <select
              id="currentSolution"
              name="currentSolution"
              value={formData.currentSolution}
              onChange={handleChange}
              required
              className={styles.select}
            >
              <option value="">Select...</option>
              <option value="none">{t('inquiry.solutionOptions.none')}</option>
              <option value="supermarket">{t('inquiry.solutionOptions.supermarket')}</option>
              <option value="local_roaster">{t('inquiry.solutionOptions.local_roaster')}</option>
              <option value="big_supplier">{t('inquiry.solutionOptions.big_supplier')}</option>
              <option value="other">{t('inquiry.solutionOptions.other')}</option>
            </select>
          </div>

          {/* Message */}
          <div className={styles.field}>
            <label htmlFor="message" className={styles.label}>
              {t('inquiry.fields.message')}
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              rows={4}
              className={styles.textarea}
            />
          </div>

          {submitStatus === 'error' && (
            <div className={styles.error}>{t('inquiry.error')}</div>
          )}

          <button
            type="submit"
            className={styles.submitButton}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : t('inquiry.submit')}
          </button>
        </form>
      </div>
    </B2BLayout>
  );
}

export default function InquiryPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <InquiryFormContent />
    </Suspense>
  );
}
