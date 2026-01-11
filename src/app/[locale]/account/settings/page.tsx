'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from '../account.module.css';

interface CustomerProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  marketingOptIn: boolean;
}

export default function SettingsPage() {
  const t = useTranslations('account');
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    marketingOptIn: false,
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [saving, setSaving] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/account/profile');
      if (res.ok) {
        const data = await res.json();
        setProfile(data.customer);
        setFormData({
          firstName: data.customer.firstName || '',
          lastName: data.customer.lastName || '',
          phone: data.customer.phone || '',
          marketingOptIn: data.customer.marketingOptIn || false,
        });
      } else if (res.status === 401) {
        router.push('/account/login');
      }
    } catch (fetchError) {
      console.error('Failed to fetch profile:', fetchError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setMessage(t('settings.profileUpdated'));
        await fetchProfile();
      } else {
        const data = await res.json();
        setError(data.error || 'Fehler beim Speichern');
      }
    } catch {
      setError('Verbindungsfehler');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPassword(true);
    setPasswordError('');
    setPasswordMessage('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError(t('settings.passwordsDoNotMatch'));
      setSavingPassword(false);
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setPasswordError(t('settings.passwordTooShort'));
      setSavingPassword(false);
      return;
    }

    try {
      const res = await fetch('/api/account/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      if (res.ok) {
        setPasswordMessage(t('settings.passwordChanged'));
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      } else {
        const data = await res.json();
        setPasswordError(data.error || 'Fehler beim Ändern des Passworts');
      }
    } catch {
      setPasswordError('Verbindungsfehler');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const res = await fetch('/api/account/delete', {
        method: 'DELETE',
      });

      if (res.ok) {
        router.push('/');
      } else {
        const data = await res.json();
        setError(data.error || 'Fehler beim Löschen des Kontos');
      }
    } catch {
      setError('Verbindungsfehler');
    }
    setShowDeleteConfirm(false);
  };

  if (loading) {
    return (
      <main className={styles.page}>
        <div className={styles.container}>
          <div className={styles.loading}>Laden...</div>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.userInfo}>
            <h1 className={styles.title}>{t('settings.title')}</h1>
            <p className={styles.welcome}>{t('settings.description')}</p>
          </div>
          <Link href="/account" className={styles.backButton}>
            ← {t('backToAccount')}
          </Link>
        </div>

        {/* Profile Settings */}
        <div className={styles.card} style={{ marginBottom: 30 }}>
          <div className={styles.cardHeader}>
            <h2>👤 {t('settings.profileInfo')}</h2>
          </div>
          <form onSubmit={handleSaveProfile} style={{ padding: 20 }}>
            {error && (
              <div style={{
                padding: '12px 16px',
                background: '#fee2e2',
                color: '#dc2626',
                borderRadius: 6,
                marginBottom: 20,
              }}>
                {error}
              </div>
            )}
            {message && (
              <div style={{
                padding: '12px 16px',
                background: '#d1fae5',
                color: '#065f46',
                borderRadius: 6,
                marginBottom: 20,
              }}>
                {message}
              </div>
            )}

            <div style={{ display: 'grid', gap: 20, maxWidth: 500 }}>
              {/* Email (read-only) */}
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                  {t('settings.email')}
                </label>
                <input
                  type="email"
                  value={profile?.email || ''}
                  disabled
                  className={styles.input}
                  style={{ background: '#f3f4f6' }}
                />
                <p style={{ marginTop: 4, fontSize: '0.875rem', color: '#666' }}>
                  {t('settings.emailCannotChange')}
                </p>
              </div>

              {/* Name */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                    {t('settings.firstName')}
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className={styles.input}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                    {t('settings.lastName')}
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className={styles.input}
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                  {t('settings.phone')}
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className={styles.input}
                />
              </div>

              {/* Marketing */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.marketingOptIn}
                    onChange={(e) => setFormData({ ...formData, marketingOptIn: e.target.checked })}
                    style={{ width: 18, height: 18 }}
                  />
                  <span>{t('settings.marketingOptIn')}</span>
                </label>
                <p style={{ marginTop: 4, marginLeft: 28, fontSize: '0.875rem', color: '#666' }}>
                  {t('settings.marketingDescription')}
                </p>
              </div>

              <button
                type="submit"
                disabled={saving}
                className={styles.primaryButton}
                style={{ width: 'fit-content' }}
              >
                {saving ? 'Speichern...' : t('settings.saveProfile')}
              </button>
            </div>
          </form>
        </div>

        {/* Change Password */}
        <div className={styles.card} style={{ marginBottom: 30 }}>
          <div className={styles.cardHeader}>
            <h2>🔒 {t('settings.changePassword')}</h2>
          </div>
          <form onSubmit={handleChangePassword} style={{ padding: 20 }}>
            {passwordError && (
              <div style={{
                padding: '12px 16px',
                background: '#fee2e2',
                color: '#dc2626',
                borderRadius: 6,
                marginBottom: 20,
              }}>
                {passwordError}
              </div>
            )}
            {passwordMessage && (
              <div style={{
                padding: '12px 16px',
                background: '#d1fae5',
                color: '#065f46',
                borderRadius: 6,
                marginBottom: 20,
              }}>
                {passwordMessage}
              </div>
            )}

            <div style={{ display: 'grid', gap: 20, maxWidth: 400 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                  {t('settings.currentPassword')}
                </label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className={styles.input}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                  {t('settings.newPassword')}
                </label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className={styles.input}
                  required
                  minLength={8}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                  {t('settings.confirmPassword')}
                </label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className={styles.input}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={savingPassword}
                className={styles.primaryButton}
                style={{ width: 'fit-content' }}
              >
                {savingPassword ? 'Ändern...' : t('settings.updatePassword')}
              </button>
            </div>
          </form>
        </div>

        {/* Danger Zone */}
        <div className={styles.card} style={{ borderColor: '#fee2e2' }}>
          <div className={styles.cardHeader} style={{ background: '#fef2f2' }}>
            <h2 style={{ color: '#dc2626' }}>⚠️ {t('settings.dangerZone')}</h2>
          </div>
          <div style={{ padding: 20 }}>
            <p style={{ marginBottom: 20, color: '#666' }}>
              {t('settings.deleteAccountWarning')}
            </p>

            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                style={{
                  padding: '10px 20px',
                  background: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                {t('settings.deleteAccount')}
              </button>
            ) : (
              <div style={{
                padding: 20,
                background: '#fef2f2',
                borderRadius: 8,
                border: '1px solid #fecaca',
              }}>
                <p style={{ marginBottom: 15, fontWeight: 500, color: '#dc2626' }}>
                  {t('settings.deleteConfirmTitle')}
                </p>
                <p style={{ marginBottom: 20, color: '#666' }}>
                  {t('settings.deleteConfirmText')}
                </p>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    onClick={handleDeleteAccount}
                    style={{
                      padding: '10px 20px',
                      background: '#dc2626',
                      color: 'white',
                      border: 'none',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontWeight: 500,
                    }}
                  >
                    {t('settings.confirmDelete')}
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    style={{
                      padding: '10px 20px',
                      background: '#f3f4f6',
                      color: '#374151',
                      border: 'none',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontWeight: 500,
                    }}
                  >
                    {t('settings.cancelDelete')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
