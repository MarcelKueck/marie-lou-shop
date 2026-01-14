'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from '../../dashboard.module.css';

interface WaitlistLead {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string | null;
  estimatedDevices: number | null;
  notes: string | null;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  source: string | null;
  createdAt: string;
}

export default function AdminB2BWaitlistPage() {
  const [leads, setLeads] = useState<WaitlistLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Edit modal state
  const [showModal, setShowModal] = useState(false);
  const [editingLead, setEditingLead] = useState<WaitlistLead | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      
      const res = await fetch(`/api/admin/b2b/waitlist?${params}`);
      if (!res.ok) throw new Error('Failed to fetch waitlist');
      const data = await res.json();
      setLeads(data.leads);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading waitlist');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleEdit = (lead: WaitlistLead) => {
    setEditingLead({ ...lead });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!editingLead) return;
    
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/b2b/waitlist/${editingLead.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: editingLead.status,
          notes: editingLead.notes,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save lead');
      }

      await fetchLeads();
      setShowModal(false);
      setEditingLead(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error saving lead');
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => {
    // Export as CSV
    const headers = ['Company', 'Contact', 'Email', 'Phone', 'Est. Devices', 'Status', 'Source', 'Created'];
    const rows = leads.map(l => [
      l.companyName,
      l.contactName,
      l.email,
      l.phone || '',
      l.estimatedDevices?.toString() || '',
      l.status,
      l.source || '',
      new Date(l.createdAt).toISOString(),
    ]);
    
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `b2b-waitlist-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, { bg: string; color: string }> = {
      new: { bg: '#dbeafe', color: '#1e40af' },
      contacted: { bg: '#fef3c7', color: '#92400e' },
      qualified: { bg: '#e0e7ff', color: '#3730a3' },
      converted: { bg: '#d1fae5', color: '#065f46' },
      lost: { bg: '#e5e7eb', color: '#374151' },
    };
    const style = colors[status] || colors.new;
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

  // Calculate stats
  const totalDevices = leads.reduce((sum, l) => sum + (l.estimatedDevices || 0), 0);
  const newLeads = leads.filter(l => l.status === 'new');
  const qualifiedLeads = leads.filter(l => l.status === 'qualified');
  const convertedLeads = leads.filter(l => l.status === 'converted');

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>SmartBox Waitlist</h1>
            <p>Manage SmartBox pre-launch leads</p>
          </div>
          <button className={styles.button} onClick={handleExport}>
            📥 Export CSV
          </button>
        </div>
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
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="qualified">Qualified</option>
          <option value="converted">Converted</option>
          <option value="lost">Lost</option>
        </select>
      </div>

      {/* Stats */}
      <div className={styles.stats}>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{leads.length}</span>
          <span className={styles.statLabel}>Total Leads</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue} style={{ color: '#3b82f6' }}>{newLeads.length}</span>
          <span className={styles.statLabel}>New</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue} style={{ color: '#7c3aed' }}>{qualifiedLeads.length}</span>
          <span className={styles.statLabel}>Qualified</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue} style={{ color: '#10b981' }}>{convertedLeads.length}</span>
          <span className={styles.statLabel}>Converted</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{totalDevices}</span>
          <span className={styles.statLabel}>Est. Devices</span>
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
                <th>Email</th>
                <th>Est. Devices</th>
                <th>Status</th>
                <th>Source</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id}>
                  <td><strong>{lead.companyName}</strong></td>
                  <td>
                    {lead.contactName}
                    {lead.phone && <><br /><small style={{ color: '#666' }}>{lead.phone}</small></>}
                  </td>
                  <td>
                    <a href={`mailto:${lead.email}`} style={{ color: '#3b82f6' }}>{lead.email}</a>
                  </td>
                  <td>{lead.estimatedDevices || '-'}</td>
                  <td>{getStatusBadge(lead.status)}</td>
                  <td style={{ fontSize: '0.875rem', color: '#666' }}>{lead.source || '-'}</td>
                  <td style={{ fontSize: '0.875rem' }}>{formatDate(lead.createdAt)}</td>
                  <td>
                    <button
                      className={styles.button}
                      style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                      onClick={() => handleEdit(lead)}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
              {leads.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', color: '#666' }}>
                    No waitlist leads found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Modal */}
      {showModal && editingLead && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2>Edit Lead: {editingLead.companyName}</h2>
            
            <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
              <p style={{ margin: 0 }}>
                <strong>Contact:</strong> {editingLead.contactName}<br />
                <strong>Email:</strong> {editingLead.email}<br />
                {editingLead.phone && <><strong>Phone:</strong> {editingLead.phone}<br /></>}
                <strong>Est. Devices:</strong> {editingLead.estimatedDevices || 'Not specified'}
              </p>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Status</label>
              <select
                className={styles.input}
                value={editingLead.status}
                onChange={(e) => setEditingLead({ ...editingLead, status: e.target.value as WaitlistLead['status'] })}
              >
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="converted">Converted</option>
                <option value="lost">Lost</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Admin Notes</label>
              <textarea
                className={styles.input}
                value={editingLead.notes || ''}
                onChange={(e) => setEditingLead({ ...editingLead, notes: e.target.value || null })}
                rows={4}
                placeholder="Add notes about this lead..."
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
