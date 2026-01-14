'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from '../../dashboard.module.css';

interface SmartBox {
  id: string;
  companyId: string;
  companyName?: string;
  deviceId: string;
  currentProductId: string | null;
  currentProductName: string | null;
  locationDescription: string | null;
  status: 'provisioned' | 'active' | 'offline' | 'maintenance' | 'decommissioned';
  currentFillPercent: number | null;
  currentWeightGrams: number | null;
  lastReadingAt: string | null;
  reorderThresholdPercent: number;
  autoReorderEnabled: boolean;
  createdAt: string;
}

interface NewBoxForm {
  companyId: string;
  deviceId: string;
  locationDescription: string;
}

export default function AdminB2BSmartBoxPage() {
  const [boxes, setBoxes] = useState<SmartBox[]>([]);
  const [companies, setCompanies] = useState<{ id: string; companyName: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Create modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBox, setNewBox] = useState<NewBoxForm>({ companyId: '', deviceId: '', locationDescription: '' });
  const [creating, setCreating] = useState(false);
  
  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBox, setEditingBox] = useState<SmartBox | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchBoxes = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      
      const res = await fetch(`/api/admin/b2b/smartbox?${params}`);
      if (!res.ok) throw new Error('Failed to fetch SmartBoxes');
      const data = await res.json();
      setBoxes(data.boxes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading SmartBoxes');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  const fetchCompanies = async () => {
    try {
      const res = await fetch('/api/admin/b2b/companies?status=approved&tier=smart');
      if (!res.ok) throw new Error('Failed to fetch companies');
      const data = await res.json();
      setCompanies(data.companies);
    } catch {
      // Ignore error, just can't show company picker
    }
  };

  useEffect(() => {
    fetchBoxes();
    fetchCompanies();
  }, [fetchBoxes]);

  const handleCreate = async () => {
    if (!newBox.companyId || !newBox.deviceId) {
      alert('Please fill in all required fields');
      return;
    }
    
    setCreating(true);
    try {
      const res = await fetch('/api/admin/b2b/smartbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBox),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create SmartBox');
      }

      await fetchBoxes();
      setShowCreateModal(false);
      setNewBox({ companyId: '', deviceId: '', locationDescription: '' });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error creating SmartBox');
    } finally {
      setCreating(false);
    }
  };

  const handleEdit = (box: SmartBox) => {
    setEditingBox({ ...box });
    setShowEditModal(true);
  };

  const handleSave = async () => {
    if (!editingBox) return;
    
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/b2b/smartbox/${editingBox.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: editingBox.status,
          locationDescription: editingBox.locationDescription,
          reorderThresholdPercent: editingBox.reorderThresholdPercent,
          autoReorderEnabled: editingBox.autoReorderEnabled,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save SmartBox');
      }

      await fetchBoxes();
      setShowEditModal(false);
      setEditingBox(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error saving SmartBox');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
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
      provisioned: { bg: '#fef3c7', color: '#92400e' },
      active: { bg: '#d1fae5', color: '#065f46' },
      offline: { bg: '#fee2e2', color: '#991b1b' },
      maintenance: { bg: '#e0e7ff', color: '#3730a3' },
      decommissioned: { bg: '#e5e7eb', color: '#374151' },
    };
    const style = colors[status] || colors.provisioned;
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

  const getFillColor = (percent: number | null) => {
    if (percent === null) return '#9ca3af';
    if (percent <= 20) return '#dc2626';
    if (percent <= 40) return '#f59e0b';
    return '#10b981';
  };

  // Calculate stats
  const activeBoxes = boxes.filter(b => b.status === 'active');
  const offlineBoxes = boxes.filter(b => b.status === 'offline');
  const lowStockBoxes = boxes.filter(b => b.currentFillPercent !== null && b.currentFillPercent <= 20);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>SmartBox Devices</h1>
            <p>Manage IoT inventory devices</p>
          </div>
          <button className={styles.button} onClick={() => setShowCreateModal(true)}>
            + Provision New Device
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
          <option value="provisioned">Provisioned</option>
          <option value="active">Active</option>
          <option value="offline">Offline</option>
          <option value="maintenance">Maintenance</option>
          <option value="decommissioned">Decommissioned</option>
        </select>
      </div>

      {/* Stats */}
      <div className={styles.stats}>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{boxes.length}</span>
          <span className={styles.statLabel}>Total Devices</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue} style={{ color: '#10b981' }}>{activeBoxes.length}</span>
          <span className={styles.statLabel}>Active</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue} style={{ color: offlineBoxes.length > 0 ? '#dc2626' : undefined }}>
            {offlineBoxes.length}
          </span>
          <span className={styles.statLabel}>Offline</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue} style={{ color: lowStockBoxes.length > 0 ? '#f59e0b' : undefined }}>
            {lowStockBoxes.length}
          </span>
          <span className={styles.statLabel}>Low Stock (&lt;20%)</span>
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
                <th>Device ID</th>
                <th>Company</th>
                <th>Product</th>
                <th>Location</th>
                <th>Status</th>
                <th>Fill Level</th>
                <th>Last Reading</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {boxes.map((box) => (
                <tr key={box.id}>
                  <td>
                    <strong style={{ fontFamily: 'monospace' }}>{box.deviceId}</strong>
                  </td>
                  <td>{box.companyName || box.companyId.slice(0, 8)}</td>
                  <td>{box.currentProductName || '-'}</td>
                  <td>{box.locationDescription || '-'}</td>
                  <td>{getStatusBadge(box.status)}</td>
                  <td>
                    {box.currentFillPercent !== null ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{
                          width: '60px',
                          height: '8px',
                          backgroundColor: '#e5e7eb',
                          borderRadius: '4px',
                          overflow: 'hidden',
                        }}>
                          <div style={{
                            width: `${box.currentFillPercent}%`,
                            height: '100%',
                            backgroundColor: getFillColor(box.currentFillPercent),
                          }} />
                        </div>
                        <span style={{ fontSize: '0.875rem', color: getFillColor(box.currentFillPercent) }}>
                          {box.currentFillPercent}%
                        </span>
                      </div>
                    ) : (
                      <span style={{ color: '#9ca3af' }}>No data</span>
                    )}
                  </td>
                  <td style={{ fontSize: '0.875rem' }}>{formatDate(box.lastReadingAt)}</td>
                  <td>
                    <button
                      className={styles.button}
                      style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                      onClick={() => handleEdit(box)}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
              {boxes.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', color: '#666' }}>
                    No SmartBox devices found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className={styles.modalOverlay} onClick={() => setShowCreateModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2>Provision New SmartBox</h2>
            
            <div className={styles.formGroup}>
              <label className={styles.label}>Company *</label>
              <select
                className={styles.input}
                value={newBox.companyId}
                onChange={(e) => setNewBox({ ...newBox, companyId: e.target.value })}
              >
                <option value="">Select a company</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.companyName}</option>
                ))}
              </select>
              {companies.length === 0 && (
                <small style={{ color: '#666' }}>No approved B2B Smart companies found</small>
              )}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Device ID *</label>
              <input
                type="text"
                className={styles.input}
                value={newBox.deviceId}
                onChange={(e) => setNewBox({ ...newBox, deviceId: e.target.value })}
                placeholder="e.g., SB-2024-001"
              />
              <small style={{ color: '#666' }}>Unique identifier from the device</small>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Location Description</label>
              <input
                type="text"
                className={styles.input}
                value={newBox.locationDescription}
                onChange={(e) => setNewBox({ ...newBox, locationDescription: e.target.value })}
                placeholder="e.g., Office Kitchen, Break Room"
              />
            </div>

            <div className={styles.modalActions}>
              <button
                className={styles.button}
                style={{ backgroundColor: '#6b7280' }}
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </button>
              <button
                className={styles.button}
                onClick={handleCreate}
                disabled={creating}
              >
                {creating ? 'Creating...' : 'Provision Device'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingBox && (
        <div className={styles.modalOverlay} onClick={() => setShowEditModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2>Edit SmartBox: {editingBox.deviceId}</h2>
            
            <div className={styles.formGroup}>
              <label className={styles.label}>Status</label>
              <select
                className={styles.input}
                value={editingBox.status}
                onChange={(e) => setEditingBox({ ...editingBox, status: e.target.value as SmartBox['status'] })}
              >
                <option value="provisioned">Provisioned</option>
                <option value="active">Active</option>
                <option value="offline">Offline</option>
                <option value="maintenance">Maintenance</option>
                <option value="decommissioned">Decommissioned</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Location Description</label>
              <input
                type="text"
                className={styles.input}
                value={editingBox.locationDescription || ''}
                onChange={(e) => setEditingBox({ ...editingBox, locationDescription: e.target.value || null })}
                placeholder="e.g., Office Kitchen"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Reorder Threshold (%)</label>
              <input
                type="number"
                className={styles.input}
                value={editingBox.reorderThresholdPercent}
                onChange={(e) => setEditingBox({ ...editingBox, reorderThresholdPercent: parseInt(e.target.value) || 20 })}
                min="5"
                max="50"
              />
            </div>

            <div className={styles.formGroup}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={editingBox.autoReorderEnabled}
                  onChange={(e) => setEditingBox({ ...editingBox, autoReorderEnabled: e.target.checked })}
                />
                Auto-reorder enabled
              </label>
            </div>

            <div className={styles.modalActions}>
              <button
                className={styles.button}
                style={{ backgroundColor: '#6b7280' }}
                onClick={() => setShowEditModal(false)}
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
