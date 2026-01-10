import { db } from '@/db';
import { refundRequests, orders, customers } from '@/db/schema';
import { desc, eq, sql } from 'drizzle-orm';
import styles from './refunds.module.css';
import RefundActions from './RefundActions';

export const dynamic = 'force-dynamic';

const REASON_LABELS: Record<string, string> = {
  not_satisfied: 'Not Satisfied',
  damaged: 'Damaged Product',
  wrong_item: 'Wrong Item',
  never_arrived: 'Never Arrived',
  changed_mind: 'Changed Mind',
  other: 'Other',
};

export default async function AdminRefundsPage() {
  // Get stats
  const stats = await db.select({
    total: sql<number>`count(*)`,
    pending: sql<number>`sum(case when ${refundRequests.status} = 'pending' then 1 else 0 end)`,
    approved: sql<number>`sum(case when ${refundRequests.status} = 'approved' then 1 else 0 end)`,
    processed: sql<number>`sum(case when ${refundRequests.status} = 'processed' then 1 else 0 end)`,
    denied: sql<number>`sum(case when ${refundRequests.status} = 'denied' then 1 else 0 end)`,
    totalAmount: sql<number>`sum(case when ${refundRequests.status} = 'processed' then ${refundRequests.approvedAmount} else 0 end)`,
  }).from(refundRequests);

  // Get all refund requests with order and customer info
  const requests = await db.select({
    id: refundRequests.id,
    orderId: refundRequests.orderId,
    orderNumber: orders.orderNumber,
    customerId: refundRequests.customerId,
    customerEmail: customers.email,
    customerFirstName: customers.firstName,
    customerLastName: customers.lastName,
    reason: refundRequests.reason,
    reasonDetails: refundRequests.reasonDetails,
    requestedAmount: refundRequests.requestedAmount,
    approvedAmount: refundRequests.approvedAmount,
    status: refundRequests.status,
    adminNotes: refundRequests.adminNotes,
    stripeRefundId: refundRequests.stripeRefundId,
    createdAt: refundRequests.createdAt,
    reviewedAt: refundRequests.reviewedAt,
    processedAt: refundRequests.processedAt,
    orderTotal: orders.total,
    orderCurrency: orders.currency,
  })
  .from(refundRequests)
  .leftJoin(orders, eq(orders.id, refundRequests.orderId))
  .leftJoin(customers, eq(customers.id, refundRequests.customerId))
  .orderBy(desc(refundRequests.createdAt));

  const statsData = stats[0] || { total: 0, pending: 0, approved: 0, processed: 0, denied: 0, totalAmount: 0 };

  // Separate pending from other requests
  const pendingRequests = requests.filter(r => r.status === 'pending');

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Refund Requests</h1>
        <p>Review and process customer refund requests</p>
      </header>

      <section className={styles.stats}>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{statsData.pending || 0}</span>
          <span className={styles.statLabel}>Pending</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{statsData.processed || 0}</span>
          <span className={styles.statLabel}>Processed</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{statsData.denied || 0}</span>
          <span className={styles.statLabel}>Denied</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>€{((statsData.totalAmount || 0) / 100).toFixed(2)}</span>
          <span className={styles.statLabel}>Total Refunded</span>
        </div>
      </section>

      {/* Pending Requests - Priority Section */}
      {pendingRequests.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <span className={styles.urgentBadge}>{pendingRequests.length}</span>
            Pending Review
          </h2>
          <div className={styles.requestsGrid}>
            {pendingRequests.map((request) => (
              <div key={request.id} className={`${styles.requestCard} ${styles.pending}`}>
                <div className={styles.requestHeader}>
                  <span className={styles.orderNumber}>#{request.orderNumber}</span>
                  <span className={`${styles.status} ${styles.statusPending}`}>Pending</span>
                </div>
                
                <div className={styles.requestDetails}>
                  <div className={styles.detailRow}>
                    <span className={styles.label}>Customer:</span>
                    <span>{request.customerEmail}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.label}>Reason:</span>
                    <span>{REASON_LABELS[request.reason] || request.reason}</span>
                  </div>
                  {request.reasonDetails && (
                    <div className={styles.detailRow}>
                      <span className={styles.label}>Details:</span>
                      <span className={styles.reasonDetails}>{request.reasonDetails}</span>
                    </div>
                  )}
                  <div className={styles.detailRow}>
                    <span className={styles.label}>Amount:</span>
                    <span className={styles.amount}>
                      €{((request.requestedAmount || 0) / 100).toFixed(2)}
                    </span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.label}>Requested:</span>
                    <span>{request.createdAt ? new Date(request.createdAt).toLocaleString() : 'N/A'}</span>
                  </div>
                </div>

                <RefundActions 
                  requestId={request.id} 
                  requestedAmount={request.requestedAmount || 0}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* All Requests History */}
      <section className={styles.section}>
        <h2>Request History</h2>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Reason</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((request) => (
              <tr key={request.id}>
                <td className={styles.code}>#{request.orderNumber}</td>
                <td>{request.customerEmail}</td>
                <td>{REASON_LABELS[request.reason] || request.reason}</td>
                <td>
                  {request.status === 'processed' && request.approvedAmount
                    ? `€${(request.approvedAmount / 100).toFixed(2)}`
                    : `€${((request.requestedAmount || 0) / 100).toFixed(2)}`}
                </td>
                <td>
                  <span className={`${styles.status} ${styles[`status${request.status?.charAt(0).toUpperCase()}${request.status?.slice(1)}`]}`}>
                    {request.status}
                  </span>
                </td>
                <td>{request.createdAt ? new Date(request.createdAt).toLocaleDateString() : 'N/A'}</td>
              </tr>
            ))}
            {requests.length === 0 && (
              <tr>
                <td colSpan={6} className={styles.empty}>No refund requests yet</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
