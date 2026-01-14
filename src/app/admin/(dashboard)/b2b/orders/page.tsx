'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from '../../dashboard.module.css';

interface B2BOrder {
  id: string;
  orderNumber: string;
  companyId: string;
  companyName?: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  totalCents: number;
  paymentStatus: 'pending' | 'invoiced' | 'paid' | 'overdue';
  paymentDueDate: string | null;
  shippingAddressJson: string;
  trackingNumber: string | null;
  notes: string | null;
  createdAt: string;
}

export default function AdminB2BOrdersPage() {
  const [orders, setOrders] = useState<B2BOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  
  // Edit modal state
  const [showModal, setShowModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<B2BOrder | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (paymentFilter !== 'all') params.set('paymentStatus', paymentFilter);
      
      const res = await fetch(`/api/admin/b2b/orders?${params}`);
      if (!res.ok) throw new Error('Failed to fetch orders');
      const data = await res.json();
      setOrders(data.orders);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading orders');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, paymentFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleEdit = (order: B2BOrder) => {
    setEditingOrder({ ...order });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!editingOrder) return;
    
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/b2b/orders/${editingOrder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: editingOrder.status,
          paymentStatus: editingOrder.paymentStatus,
          trackingNumber: editingOrder.trackingNumber,
          notes: editingOrder.notes,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save order');
      }

      await fetchOrders();
      setShowModal(false);
      setEditingOrder(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error saving order');
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
    });
  };

  const formatPrice = (cents: number) => {
    return `€${(cents / 100).toFixed(2)}`;
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, { bg: string; color: string }> = {
      pending: { bg: '#fef3c7', color: '#92400e' },
      confirmed: { bg: '#dbeafe', color: '#1e40af' },
      processing: { bg: '#e0e7ff', color: '#3730a3' },
      shipped: { bg: '#d1fae5', color: '#065f46' },
      delivered: { bg: '#bbf7d0', color: '#166534' },
      cancelled: { bg: '#fee2e2', color: '#991b1b' },
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

  const getPaymentBadge = (status: string) => {
    const colors: Record<string, { bg: string; color: string }> = {
      pending: { bg: '#fef3c7', color: '#92400e' },
      invoiced: { bg: '#dbeafe', color: '#1e40af' },
      paid: { bg: '#d1fae5', color: '#065f46' },
      overdue: { bg: '#fee2e2', color: '#991b1b' },
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

  // Calculate stats
  const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'confirmed');
  const overduePayments = orders.filter(o => o.paymentStatus === 'overdue');
  const totalRevenue = orders.filter(o => o.paymentStatus === 'paid').reduce((sum, o) => sum + o.totalCents, 0);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>B2B Orders</h1>
        <p>Manage business-to-business orders</p>
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
          <option value="confirmed">Confirmed</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          className={styles.input}
          style={{ width: 'auto' }}
        >
          <option value="all">All Payments</option>
          <option value="pending">Payment Pending</option>
          <option value="invoiced">Invoiced</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      {/* Stats */}
      <div className={styles.stats}>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{pendingOrders.length}</span>
          <span className={styles.statLabel}>Pending Orders</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue} style={{ color: overduePayments.length > 0 ? '#dc2626' : undefined }}>
            {overduePayments.length}
          </span>
          <span className={styles.statLabel}>Overdue Payments</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{orders.length}</span>
          <span className={styles.statLabel}>Total Orders</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{formatPrice(totalRevenue)}</span>
          <span className={styles.statLabel}>Paid Revenue</span>
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
                <th>Order #</th>
                <th>Company</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Total</th>
                <th>Due Date</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <strong>{order.orderNumber}</strong>
                    {order.trackingNumber && (
                      <><br /><small style={{ color: '#666' }}>📦 {order.trackingNumber}</small></>
                    )}
                  </td>
                  <td>{order.companyName || order.companyId.slice(0, 8)}</td>
                  <td>{getStatusBadge(order.status)}</td>
                  <td>{getPaymentBadge(order.paymentStatus)}</td>
                  <td>
                    <strong>{formatPrice(order.totalCents)}</strong>
                    {order.discountCents > 0 && (
                      <><br /><small style={{ color: '#059669' }}>-{formatPrice(order.discountCents)}</small></>
                    )}
                  </td>
                  <td style={{ color: order.paymentStatus === 'overdue' ? '#dc2626' : undefined }}>
                    {formatDate(order.paymentDueDate)}
                  </td>
                  <td>{formatDate(order.createdAt)}</td>
                  <td>
                    <button
                      className={styles.button}
                      style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                      onClick={() => handleEdit(order)}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', color: '#666' }}>
                    No orders found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Modal */}
      {showModal && editingOrder && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2>Edit Order: {editingOrder.orderNumber}</h2>
            
            <div className={styles.formGroup}>
              <label className={styles.label}>Order Status</label>
              <select
                className={styles.input}
                value={editingOrder.status}
                onChange={(e) => setEditingOrder({ ...editingOrder, status: e.target.value as B2BOrder['status'] })}
              >
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Payment Status</label>
              <select
                className={styles.input}
                value={editingOrder.paymentStatus}
                onChange={(e) => setEditingOrder({ ...editingOrder, paymentStatus: e.target.value as B2BOrder['paymentStatus'] })}
              >
                <option value="pending">Pending</option>
                <option value="invoiced">Invoiced</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Tracking Number</label>
              <input
                type="text"
                className={styles.input}
                value={editingOrder.trackingNumber || ''}
                onChange={(e) => setEditingOrder({ ...editingOrder, trackingNumber: e.target.value || null })}
                placeholder="Enter tracking number"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Admin Notes</label>
              <textarea
                className={styles.input}
                value={editingOrder.notes || ''}
                onChange={(e) => setEditingOrder({ ...editingOrder, notes: e.target.value || null })}
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
