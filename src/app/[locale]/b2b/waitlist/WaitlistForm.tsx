'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import styles from './waitlist.module.css';

export default function WaitlistForm() {
  const t = useTranslations('b2b.waitlist.form');
  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    teamSize: '',
    currentSolution: '',
    interestLevel: '',
    preferredStart: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/b2b/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitted(true);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to submit. Please try again.');
      }
    } catch {
      setError('Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className={styles.successMessage}>
        <div className={styles.successIcon}>🎉</div>
        <h3>{t('success.title')}</h3>
        <p>{t('success.message')}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      {error && <div className={styles.error}>{error}</div>}
      
      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label htmlFor="companyName">{t('fields.companyName')} *</label>
          <input
            type="text"
            id="companyName"
            value={formData.companyName}
            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
            required
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="contactName">{t('fields.contactName')} *</label>
          <input
            type="text"
            id="contactName"
            value={formData.contactName}
            onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
            required
          />
        </div>
      </div>

      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label htmlFor="email">{t('fields.email')} *</label>
          <input
            type="email"
            id="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="phone">{t('fields.phone')}</label>
          <input
            type="tel"
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>
      </div>

      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label htmlFor="teamSize">{t('fields.teamSize')} *</label>
          <select
            id="teamSize"
            value={formData.teamSize}
            onChange={(e) => setFormData({ ...formData, teamSize: e.target.value })}
            required
          >
            <option value="">{t('fields.select')}</option>
            <option value="5-10">5-10</option>
            <option value="10-20">10-20</option>
            <option value="20-35">20-35</option>
            <option value="35-50">35-50</option>
            <option value="50+">50+</option>
          </select>
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="currentSolution">{t('fields.currentSolution')} *</label>
          <select
            id="currentSolution"
            value={formData.currentSolution}
            onChange={(e) => setFormData({ ...formData, currentSolution: e.target.value })}
            required
          >
            <option value="">{t('fields.select')}</option>
            <option value="none">{t('fields.solutions.none')}</option>
            <option value="supermarket">{t('fields.solutions.supermarket')}</option>
            <option value="local_roaster">{t('fields.solutions.localRoaster')}</option>
            <option value="big_supplier">{t('fields.solutions.bigSupplier')}</option>
            <option value="other">{t('fields.solutions.other')}</option>
          </select>
        </div>
      </div>

      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label htmlFor="interestLevel">{t('fields.interestLevel')} *</label>
          <select
            id="interestLevel"
            value={formData.interestLevel}
            onChange={(e) => setFormData({ ...formData, interestLevel: e.target.value })}
            required
          >
            <option value="">{t('fields.select')}</option>
            <option value="flex">{t('fields.interests.flex')}</option>
            <option value="smart">{t('fields.interests.smart')}</option>
            <option value="unsure">{t('fields.interests.unsure')}</option>
          </select>
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="preferredStart">{t('fields.preferredStart')}</label>
          <select
            id="preferredStart"
            value={formData.preferredStart}
            onChange={(e) => setFormData({ ...formData, preferredStart: e.target.value })}
          >
            <option value="">{t('fields.select')}</option>
            <option value="asap">{t('fields.starts.asap')}</option>
            <option value="1month">{t('fields.starts.1month')}</option>
            <option value="3months">{t('fields.starts.3months')}</option>
            <option value="exploring">{t('fields.starts.exploring')}</option>
          </select>
        </div>
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="message">{t('fields.message')}</label>
        <textarea
          id="message"
          rows={3}
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          placeholder={t('fields.messagePlaceholder')}
        />
      </div>

      <button type="submit" className={styles.submitButton} disabled={submitting}>
        {submitting ? t('submitting') : t('submit')}
      </button>
      
      <p className={styles.privacy}>{t('privacy')}</p>
    </form>
  );
}
