'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from '../account.module.css';

interface Address {
  id: string;
  type: 'shipping' | 'billing';
  firstName: string;
  lastName: string;
  company?: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

interface FormData {
  type: 'shipping' | 'billing';
  firstName: string;
  lastName: string;
  company: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

const emptyForm: FormData = {
  type: 'shipping',
  firstName: '',
  lastName: '',
  company: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'DE',
  isDefault: false,
};

export default function AddressesPage() {
  const t = useTranslations('account');
  const router = useRouter();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchAddresses = async () => {
    try {
      const res = await fetch('/api/account/addresses');
      if (res.ok) {
        const data = await res.json();
        setAddresses(data.addresses);
      } else if (res.status === 401) {
        router.push('/account/login');
      }
    } catch (fetchError) {
      console.error('Failed to fetch addresses:', fetchError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const url = editingId 
        ? `/api/account/addresses/${editingId}`
        : '/api/account/addresses';
      
      const res = await fetch(url, {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        await fetchAddresses();
        setShowForm(false);
        setEditingId(null);
        setFormData(emptyForm);
      } else {
        const data = await res.json();
        setError(data.error || 'Fehler beim Speichern');
      }
    } catch {
      setError('Verbindungsfehler');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (address: Address) => {
    setFormData({
      type: address.type,
      firstName: address.firstName,
      lastName: address.lastName,
      company: address.company || '',
      line1: address.line1,
      line2: address.line2 || '',
      city: address.city,
      state: address.state || '',
      postalCode: address.postalCode,
      country: address.country,
      isDefault: address.isDefault,
    });
    setEditingId(address.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Adresse wirklich löschen?')) return;

    try {
      const res = await fetch(`/api/account/addresses/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await fetchAddresses();
      }
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleSetDefault = async (id: string, type: 'shipping' | 'billing') => {
    try {
      const res = await fetch(`/api/account/addresses/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDefault: true, type }),
      });
      if (res.ok) {
        await fetchAddresses();
      }
    } catch (err) {
      console.error('Set default failed:', err);
    }
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

  const shippingAddresses = addresses.filter(a => a.type === 'shipping');
  const billingAddresses = addresses.filter(a => a.type === 'billing');

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.userInfo}>
            <h1 className={styles.title}>{t('addresses.title')}</h1>
            <p className={styles.welcome}>{t('addresses.description')}</p>
          </div>
          <Link href="/account" className={styles.backButton}>
            ← {t('backToAccount')}
          </Link>
        </div>

        {/* Add Button */}
        {!showForm && (
          <button
            onClick={() => {
              setFormData(emptyForm);
              setEditingId(null);
              setShowForm(true);
            }}
            className={styles.primaryButton}
            style={{ marginBottom: 30 }}
          >
            + {t('addresses.addNew')}
          </button>
        )}

        {/* Form */}
        {showForm && (
          <div className={styles.card} style={{ marginBottom: 30 }}>
            <div className={styles.cardHeader}>
              <h2>{editingId ? t('addresses.edit') : t('addresses.addNew')}</h2>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: 20 }}>
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

              <div style={{ display: 'grid', gap: 20, maxWidth: 600 }}>
                {/* Type */}
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                    {t('addresses.type')}
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as 'shipping' | 'billing' })}
                    className={styles.input}
                    style={{ width: '100%' }}
                  >
                    <option value="shipping">{t('addresses.shipping')}</option>
                    <option value="billing">{t('addresses.billing')}</option>
                  </select>
                </div>

                {/* Name */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                      {t('addresses.firstName')}
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className={styles.input}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                      {t('addresses.lastName')}
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className={styles.input}
                    />
                  </div>
                </div>

                {/* Company */}
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                    {t('addresses.company')} ({t('addresses.optional')})
                  </label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className={styles.input}
                  />
                </div>

                {/* Address */}
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                    {t('addresses.line1')}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.line1}
                    onChange={(e) => setFormData({ ...formData, line1: e.target.value })}
                    className={styles.input}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                    {t('addresses.line2')} ({t('addresses.optional')})
                  </label>
                  <input
                    type="text"
                    value={formData.line2}
                    onChange={(e) => setFormData({ ...formData, line2: e.target.value })}
                    className={styles.input}
                  />
                </div>

                {/* City, Postal, Country */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 15 }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                      {t('addresses.city')}
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className={styles.input}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                      {t('addresses.postalCode')}
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.postalCode}
                      onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                      className={styles.input}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                    {t('addresses.country')}
                  </label>
                  <select
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className={styles.input}
                    style={{ width: '100%' }}
                  >
                    <option value="DE">Deutschland</option>
                    <option value="AT">Österreich</option>
                    <option value="CH">Schweiz</option>
                    <option value="NL">Niederlande</option>
                    <option value="BE">Belgien</option>
                    <option value="FR">Frankreich</option>
                  </select>
                </div>

                {/* Default */}
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.isDefault}
                      onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                      style={{ width: 18, height: 18 }}
                    />
                    <span>{t('addresses.setAsDefault')}</span>
                  </label>
                </div>
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: 10, marginTop: 30 }}>
                <button
                  type="submit"
                  disabled={submitting}
                  className={styles.primaryButton}
                >
                  {submitting ? 'Speichern...' : t('addresses.save')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setFormData(emptyForm);
                  }}
                  className={styles.secondaryButton}
                >
                  {t('addresses.cancel')}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Shipping Addresses */}
        <div className={styles.card} style={{ marginBottom: 30 }}>
          <div className={styles.cardHeader}>
            <h2>📦 {t('addresses.shippingAddresses')}</h2>
          </div>
          <div style={{ padding: 20 }}>
            {shippingAddresses.length === 0 ? (
              <p style={{ color: '#666' }}>{t('addresses.noAddresses')}</p>
            ) : (
              <div style={{ display: 'grid', gap: 15 }}>
                {shippingAddresses.map((address) => (
                  <div
                    key={address.id}
                    style={{
                      padding: 15,
                      border: address.isDefault ? '2px solid var(--color-primary)' : '1px solid #ddd',
                      borderRadius: 8,
                      background: address.isDefault ? 'rgba(var(--color-primary-rgb), 0.05)' : 'white',
                    }}
                  >
                    {address.isDefault && (
                      <span style={{
                        display: 'inline-block',
                        background: 'var(--color-primary)',
                        color: 'white',
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontSize: '0.75rem',
                        marginBottom: 8,
                      }}>
                        {t('addresses.default')}
                      </span>
                    )}
                    <p style={{ margin: 0, fontWeight: 500 }}>
                      {address.firstName} {address.lastName}
                    </p>
                    {address.company && <p style={{ margin: '4px 0 0 0', color: '#666' }}>{address.company}</p>}
                    <p style={{ margin: '4px 0 0 0', color: '#666' }}>{address.line1}</p>
                    {address.line2 && <p style={{ margin: '4px 0 0 0', color: '#666' }}>{address.line2}</p>}
                    <p style={{ margin: '4px 0 0 0', color: '#666' }}>
                      {address.postalCode} {address.city}
                    </p>
                    <p style={{ margin: '4px 0 0 0', color: '#666' }}>{address.country}</p>
                    <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                      <button
                        onClick={() => handleEdit(address)}
                        style={{
                          padding: '6px 12px',
                          background: '#f3f4f6',
                          border: 'none',
                          borderRadius: 4,
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                        }}
                      >
                        ✏️ {t('addresses.edit')}
                      </button>
                      {!address.isDefault && (
                        <button
                          onClick={() => handleSetDefault(address.id, 'shipping')}
                          style={{
                            padding: '6px 12px',
                            background: '#f3f4f6',
                            border: 'none',
                            borderRadius: 4,
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                          }}
                        >
                          ⭐ {t('addresses.makeDefault')}
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(address.id)}
                        style={{
                          padding: '6px 12px',
                          background: '#fee2e2',
                          color: '#dc2626',
                          border: 'none',
                          borderRadius: 4,
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                        }}
                      >
                        🗑️ {t('addresses.delete')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Billing Addresses */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2>🧾 {t('addresses.billingAddresses')}</h2>
          </div>
          <div style={{ padding: 20 }}>
            {billingAddresses.length === 0 ? (
              <p style={{ color: '#666' }}>{t('addresses.noAddresses')}</p>
            ) : (
              <div style={{ display: 'grid', gap: 15 }}>
                {billingAddresses.map((address) => (
                  <div
                    key={address.id}
                    style={{
                      padding: 15,
                      border: address.isDefault ? '2px solid var(--color-primary)' : '1px solid #ddd',
                      borderRadius: 8,
                      background: address.isDefault ? 'rgba(var(--color-primary-rgb), 0.05)' : 'white',
                    }}
                  >
                    {address.isDefault && (
                      <span style={{
                        display: 'inline-block',
                        background: 'var(--color-primary)',
                        color: 'white',
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontSize: '0.75rem',
                        marginBottom: 8,
                      }}>
                        {t('addresses.default')}
                      </span>
                    )}
                    <p style={{ margin: 0, fontWeight: 500 }}>
                      {address.firstName} {address.lastName}
                    </p>
                    {address.company && <p style={{ margin: '4px 0 0 0', color: '#666' }}>{address.company}</p>}
                    <p style={{ margin: '4px 0 0 0', color: '#666' }}>{address.line1}</p>
                    {address.line2 && <p style={{ margin: '4px 0 0 0', color: '#666' }}>{address.line2}</p>}
                    <p style={{ margin: '4px 0 0 0', color: '#666' }}>
                      {address.postalCode} {address.city}
                    </p>
                    <p style={{ margin: '4px 0 0 0', color: '#666' }}>{address.country}</p>
                    <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                      <button
                        onClick={() => handleEdit(address)}
                        style={{
                          padding: '6px 12px',
                          background: '#f3f4f6',
                          border: 'none',
                          borderRadius: 4,
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                        }}
                      >
                        ✏️ {t('addresses.edit')}
                      </button>
                      {!address.isDefault && (
                        <button
                          onClick={() => handleSetDefault(address.id, 'billing')}
                          style={{
                            padding: '6px 12px',
                            background: '#f3f4f6',
                            border: 'none',
                            borderRadius: 4,
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                          }}
                        >
                          ⭐ {t('addresses.makeDefault')}
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(address.id)}
                        style={{
                          padding: '6px 12px',
                          background: '#fee2e2',
                          color: '#dc2626',
                          border: 'none',
                          borderRadius: 4,
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                        }}
                      >
                        🗑️ {t('addresses.delete')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
