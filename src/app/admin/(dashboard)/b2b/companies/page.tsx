'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from '../../dashboard.module.css';

interface B2BCompany {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string | null;
  tier: 'flex' | 'smart';
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  discountPercent: number;
  paymentTermDays: number;
  creditLimitCents: number | null;
  monthlyVolumeKg: number | null;
  primaryProductInterest: string | null;
  notes: string | null;
  createdAt: string;
  approvedAt: string | null;
}

export default function AdminB2BCompaniesPage() {
  const [companies, setCompanies] = useState<B2BCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tierFilter, setTierFilter] = useState<string>('all');
  
  // Edit modal state
  const [showModal, setShowModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<B2BCompany | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchCompanies = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (tierFilter !== 'all') params.set('tier', tierFilter);
      
      const res = await fetch(`/api/admin/b2b/companies?${params}`);
      if (!res.ok) throw new Error('Failed to fetch companies');
      const data = await res.json();
      setCompanies(data.companies);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading companies');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, tierFilter]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const handleEdit = (company: B2BCompany) => {
    setEditingCompany({ ...company });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!editingCompany) return;
    
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/b2b/companies/${editingCompany.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: editingCompany.tier,
          status: editingCompany.status,
          discountPercent: editingCompany.discountPercent,
          paymentTermDays: editingCompany.paymentTermDays,
          creditLimitCents: editingCompany.creditLimitCents,
          notes: editingCompany.notes,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save company');
      }

      await fetchCompanies();
      setShowModal(false);
      setEditingCompany(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error saving company');
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async (company: B2BCompany) => {
    if (!confirm(`Approve ${company.companyName}? They will receive a welcome email with login credentials.`)) return;
    
    try {
      const res = await fetch(`/api/admin/b2b/companies/${company.id}/approve`, {
        method: 'POST',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to approve company');
      }

      await fetchCompanies();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error approving company');
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, { bg: string; color: string }> = {
      pending: { bg: '#fef3c7', color: '#92400e' },
      approved: { bg: '#d1fae5', color: '#065f46' },
      rejected: { bg: '#fee2e2', color: '#991b1b' },
      suspended: { bg: '#e5e7eb', color: '#374151' },
    };
    const style = colors[status] || colors.pending;
    return (
      <span style={{
        padding: '0.25rem 0.75rem',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: 600,
        backgroundColor: style.bg,
        color: style.color,
      }}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getTierBadge = (tier: string) => {
    const colors: Record<string, { bg: string; color: string }> = {
      flex: { bg: '#dbeafe', color: '#1e40af' },
      smart: { bg: '#f3e8ff', color: '#7c3aed' },
    };
    const style = colors[tier] || colors.flex;
    return (
      <span style={{
        padding: '0.25rem 0.75rem',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: 600,
        backgroundColor: style.bg,
        color: style.color,
      }}>
        B2B {tier.charAt(0).toUpperCase() + tier.slice(1)}
      </span>
    );
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>B2B Companies</h1>
        <p>Manage your B2B customer accounts</p>
      </header>

      {/* Filters */}
      <div className={styles.filters} style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={styles.input}
          style={{ width: 'auto' }}
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="suspended">Suspended</option>
        </select>
        <select
          value={tierFilter}
          onChange={(e) => setTierFilter(e.target.value)}
          className={styles.input}
          style={{ width: 'auto' }}
        >
          <option value="all">All Tiers</option>
          <option value="flex">B2B Flex</option>
          <option value="smart">B2B Smart</option>
        </select>
      </div>

      {/* Stats */}
      <div className={styles.stats}>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{companies.filter(c => c.status === 'pending').length}</span>
          <span className={styles.statLabel}>Pending Approval</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{companies.filter(c => c.status === 'approved').length}</span>
          <span className={styles.statLabel}>Active Companies</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{companies.filter(c => c.tier === 'smart').length}</span>
          <span className={styles.statLabel}>Smart Tier</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{companies.filter(c => c.tier === 'flex').length}</span>
          <span className={styles.statLabel}>Flex Tier</span>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p style={{ color: 'red' }}>{error}</p>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Company</th>
                <th>Contact</th>
                <th>Tier</th>
                <th>Status</th>
                <th>Discount</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((company) => (
                <tr key={company.id}>
                  <td>
                    <strong>{company.companyName}</strong>
                    <br />
                    <small style={{ color: '#666' }}>{company.email}</small>
                  </td>
                  <td>
                    {company.contactName}
                    {company.phone && <><br /><small style={{ color: '#666' }}>{company.phone}</small></>}
                  </td>
                  <td>{getTierBadge(company.tier)}</td>
                  <td>{getStatusBadge(company.status)}</td>
                  <td>{company.discountPercent}%</td>
                  <td>{formatDate(company.createdAt)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {company.status === 'pending' && (
                        <button
                          className={styles.button}
                          style={{ backgroundColor: '#10b981', fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                          onClick={() => handleApprove(company)}
                        >
                          Approve
                        </button>
                      )}
                      <button
                        className={styles.button}
                        style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                        onClick={() => handleEdit(company)}
                      >
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {companies.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: '#666' }}>
                    No companies found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Modal */}
      {showModal && editingCompany && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2>Edit Company: {editingCompany.companyName}</h2>
            
            <div className={styles.formGroup}>
              <label className={styles.label}>Tier</label>
              <select
                className={styles.input}
                value={editingCompany.tier}
                onChange={(e) => setEditingCompany({ ...editingCompany, tier: e.target.value as 'flex' | 'smart' })}
              >
                <option value="flex">B2B Flex</option>
                <option value="smart">B2B Smart</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Status</label>
              <select
                className={styles.input}
                value={editingCompany.status}
                onChange={(e) => setEditingCompany({ ...editingCompany, status: e.target.value as B2BCompany['status'] })}
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Discount %</label>
              <input
                type="number"
                className={styles.input}
                value={editingCompany.discountPercent}
                onChange={(e) => setEditingCompany({ ...editingCompany, discountPercent: parseInt(e.target.value) || 0 })}
                min="0"
                max="50"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Payment Term (days)</label>
              <input
                type="number"
                className={styles.input}
                value={editingCompany.paymentTermDays}
                onChange={(e) => setEditingCompany({ ...editingCompany, paymentTermDays: parseInt(e.target.value) || 0 })}
                min="0"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Credit Limit (€)</label>
              <input
                type="number"
                className={styles.input}
                value={editingCompany.creditLimitCents ? editingCompany.creditLimitCents / 100 : ''}
                onChange={(e) => setEditingCompany({ 
                  ...editingCompany, 
                  creditLimitCents: e.target.value ? Math.round(parseFloat(e.target.value) * 100) : null 
                })}
                min="0"
                step="0.01"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Admin Notes</label>
              <textarea
                className={styles.input}
                value={editingCompany.notes || ''}
                onChange={(e) => setEditingCompany({ ...editingCompany, notes: e.target.value || null })}
                rows={3}
              />
            </div>

            <div className={styles.modalActions}>
              <button
                className={styles.button}
                style={{ backgroundColor: '#6b7280' }}
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button
                className={styles.button}
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
