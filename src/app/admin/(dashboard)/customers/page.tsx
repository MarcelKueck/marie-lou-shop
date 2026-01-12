'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from '../../admin.module.css';

interface Customer {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  stripeCustomerId: string | null;
  marketingOptIn: boolean;
  referralTrusted: boolean;
  referralSuspended: boolean;
  referralNotes: string | null;
  createdAt: string;
  updatedAt: string;
  orderCount?: number;
  totalSpent?: number;
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  
  // Edit modal state
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/customers${search ? `?search=${encodeURIComponent(search)}` : ''}`);
      if (!res.ok) throw new Error('Failed to fetch customers');
      const data = await res.json();
      setCustomers(data.customers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading customers');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchCustomers();
    }, 300);
    return () => clearTimeout(debounce);
  }, [fetchCustomers]);

  const handleEdit = (customer: Customer) => {
    setEditingCustomer({ ...customer });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!editingCustomer) return;
    
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/customers/${editingCustomer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: editingCustomer.firstName,
          lastName: editingCustomer.lastName,
          phone: editingCustomer.phone,
          marketingOptIn: editingCustomer.marketingOptIn,
          referralTrusted: editingCustomer.referralTrusted,
          referralSuspended: editingCustomer.referralSuspended,
          referralNotes: editingCustomer.referralNotes,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save customer');
      }

      await fetchCustomers();
      setShowModal(false);
      setEditingCustomer(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error saving customer');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatCurrency = (cents: number) => `€${(cents / 100).toFixed(2)}`;

  if (loading && customers.length === 0) {
    return (
      <div className={styles.container}>
        <p>Lade Kunden...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1>Kunden</h1>
          <p>{customers.length} Kunden insgesamt</p>
        </div>
      </header>

      {error && <div className={styles.error}>{error}</div>}

      {/* Search */}
      <div style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Suche nach E-Mail, Name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.input}
          style={{ maxWidth: 400 }}
        />
      </div>

      {/* Customers Table */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>E-Mail</th>
              <th>Name</th>
              <th>Telefon</th>
              <th>Bestellungen</th>
              <th>Umsatz</th>
              <th>Marketing</th>
              <th>Registriert</th>
              <th>Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {customer.email}
                    {customer.referralSuspended && (
                      <span style={{ 
                        background: '#fee2e2', 
                        color: '#dc2626', 
                        padding: '2px 6px', 
                        borderRadius: 4, 
                        fontSize: '0.75rem' 
                      }}>
                        Gesperrt
                      </span>
                    )}
                    {customer.referralTrusted && (
                      <span style={{ 
                        background: '#dcfce7', 
                        color: '#16a34a', 
                        padding: '2px 6px', 
                        borderRadius: 4, 
                        fontSize: '0.75rem' 
                      }}>
                        Vertraut
                      </span>
                    )}
                  </div>
                </td>
                <td>
                  {customer.firstName || customer.lastName 
                    ? `${customer.firstName || ''} ${customer.lastName || ''}`.trim()
                    : '—'
                  }
                </td>
                <td>{customer.phone || '—'}</td>
                <td>{customer.orderCount ?? 0}</td>
                <td>{formatCurrency(customer.totalSpent ?? 0)}</td>
                <td>
                  {customer.marketingOptIn ? (
                    <span style={{ color: '#16a34a' }}>✓</span>
                  ) : (
                    <span style={{ color: '#9ca3af' }}>—</span>
                  )}
                </td>
                <td>{formatDate(customer.createdAt)}</td>
                <td>
                  <button
                    onClick={() => handleEdit(customer)}
                    className={`${styles.button} ${styles.buttonSecondary}`}
                    style={{ padding: '4px 12px', fontSize: '0.875rem' }}
                  >
                    Bearbeiten
                  </button>
                </td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: 40 }}>
                  {search ? 'Keine Kunden gefunden' : 'Noch keine Kunden'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {showModal && editingCustomer && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Kunde bearbeiten</h2>
              <button onClick={() => setShowModal(false)} className={styles.closeButton}>×</button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label className={styles.label}>E-Mail (nicht änderbar)</label>
                <input
                  type="email"
                  value={editingCustomer.email}
                  disabled
                  className={styles.input}
                  style={{ background: '#f3f4f6' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Vorname</label>
                  <input
                    type="text"
                    value={editingCustomer.firstName || ''}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, firstName: e.target.value || null })}
                    className={styles.input}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Nachname</label>
                  <input
                    type="text"
                    value={editingCustomer.lastName || ''}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, lastName: e.target.value || null })}
                    className={styles.input}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Telefon</label>
                <input
                  type="tel"
                  value={editingCustomer.phone || ''}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, phone: e.target.value || null })}
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Stripe Kunden-ID</label>
                <input
                  type="text"
                  value={editingCustomer.stripeCustomerId || ''}
                  disabled
                  className={styles.input}
                  style={{ background: '#f3f4f6' }}
                />
              </div>

              <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 16, marginTop: 8 }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '1rem' }}>Einstellungen</h3>
                
                <div className={styles.formGroup}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={editingCustomer.marketingOptIn}
                      onChange={(e) => setEditingCustomer({ ...editingCustomer, marketingOptIn: e.target.checked })}
                    />
                    <span>Marketing-Newsletter abonniert</span>
                  </label>
                </div>
              </div>

              <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 16, marginTop: 8 }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '1rem' }}>Empfehlungsprogramm</h3>
                
                <div className={styles.formGroup}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={editingCustomer.referralTrusted}
                      onChange={(e) => setEditingCustomer({ ...editingCustomer, referralTrusted: e.target.checked })}
                    />
                    <span>Vertrauenswürdig (Bypass Missbrauchsprüfung)</span>
                  </label>
                </div>

                <div className={styles.formGroup}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={editingCustomer.referralSuspended}
                      onChange={(e) => setEditingCustomer({ ...editingCustomer, referralSuspended: e.target.checked })}
                    />
                    <span style={{ color: '#dc2626' }}>Gesperrt (keine Empfehlungsprämien)</span>
                  </label>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Admin-Notizen</label>
                  <textarea
                    value={editingCustomer.referralNotes || ''}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, referralNotes: e.target.value || null })}
                    className={styles.input}
                    rows={3}
                    placeholder="Interne Notizen zum Kunden..."
                    style={{ resize: 'vertical' }}
                  />
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                onClick={() => setShowModal(false)}
                className={`${styles.button} ${styles.buttonSecondary}`}
              >
                Abbrechen
              </button>
              <button
                onClick={handleSave}
                className={`${styles.button} ${styles.buttonPrimary}`}
                disabled={saving}
              >
                {saving ? 'Speichern...' : 'Speichern'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
