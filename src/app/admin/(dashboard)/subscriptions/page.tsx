import { db } from '@/db';
import { subscriptions, customers } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import Link from 'next/link';
import styles from '../dashboard.module.css';
import subscriptionStyles from './subscriptions.module.css';

export const dynamic = 'force-dynamic';

export default async function AdminSubscriptionsPage() {
  const rows = await db.select({
    id: subscriptions.id,
    customerId: subscriptions.customerId,
    productName: subscriptions.productName,
    variantName: subscriptions.variantName,
    quantity: subscriptions.quantity,
    unitPrice: subscriptions.unitPrice,
    intervalCount: subscriptions.intervalCount,
    intervalUnit: subscriptions.intervalUnit,
    status: subscriptions.status,
    nextDeliveryAt: subscriptions.nextDeliveryAt,
    shippingFirstName: subscriptions.shippingFirstName,
    shippingLastName: subscriptions.shippingLastName,
    shippingCity: subscriptions.shippingCity,
    stripeSubscriptionId: subscriptions.stripeSubscriptionId,
    createdAt: subscriptions.createdAt,
    pausedAt: subscriptions.pausedAt,
    cancelledAt: subscriptions.cancelledAt,
    customerEmail: customers.email,
    customerFirstName: customers.firstName,
    customerLastName: customers.lastName,
  })
    .from(subscriptions)
    .leftJoin(customers, eq(subscriptions.customerId, customers.id))
    .orderBy(desc(subscriptions.createdAt))
    .limit(100);

  const activeCount = rows.filter(r => r.status === 'active').length;
  const pausedCount = rows.filter(r => r.status === 'paused').length;
  const cancelledCount = rows.filter(r => r.status === 'cancelled').length;
  
  // Calculate MRR (Monthly Recurring Revenue)
  const mrr = rows
    .filter(r => r.status === 'active')
    .reduce((sum, r) => {
      const monthlyPrice = r.intervalUnit === 'week' 
        ? (r.unitPrice * r.quantity * 4) / r.intervalCount
        : (r.unitPrice * r.quantity) / r.intervalCount;
      return sum + monthlyPrice;
    }, 0);

  const formatPrice = (cents: number) => `€${(cents / 100).toFixed(2)}`;
  
  const getIntervalLabel = (count: number, unit: string) => {
    if (unit === 'week') {
      return count === 1 ? 'Every week' : `Every ${count} weeks`;
    }
    return count === 1 ? 'Every month' : `Every ${count} months`;
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'active': return subscriptionStyles.statusActive;
      case 'paused': return subscriptionStyles.statusPaused;
      case 'cancelled': return subscriptionStyles.statusCancelled;
      case 'past_due': return subscriptionStyles.statusPastDue;
      default: return '';
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Subscriptions</h1>
        <p>Manage customer subscriptions</p>
      </header>

      {/* Stats Cards */}
      <div className={subscriptionStyles.statsGrid}>
        <div className={subscriptionStyles.statCard}>
          <div className={subscriptionStyles.statValue}>{rows.length}</div>
          <div className={subscriptionStyles.statLabel}>Total Subscriptions</div>
        </div>
        <div className={subscriptionStyles.statCard}>
          <div className={`${subscriptionStyles.statValue} ${subscriptionStyles.activeValue}`}>{activeCount}</div>
          <div className={subscriptionStyles.statLabel}>Active</div>
        </div>
        <div className={subscriptionStyles.statCard}>
          <div className={`${subscriptionStyles.statValue} ${subscriptionStyles.pausedValue}`}>{pausedCount}</div>
          <div className={subscriptionStyles.statLabel}>Paused</div>
        </div>
        <div className={subscriptionStyles.statCard}>
          <div className={`${subscriptionStyles.statValue} ${subscriptionStyles.cancelledValue}`}>{cancelledCount}</div>
          <div className={subscriptionStyles.statLabel}>Cancelled</div>
        </div>
        <div className={subscriptionStyles.statCard}>
          <div className={subscriptionStyles.statValue}>{formatPrice(mrr)}</div>
          <div className={subscriptionStyles.statLabel}>Est. MRR</div>
        </div>
      </div>

      <section className={styles.section}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Customer</th>
              <th>Product</th>
              <th>Frequency</th>
              <th>Price</th>
              <th>Status</th>
              <th>Next Delivery</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((sub) => (
              <tr key={sub.id}>
                <td>
                  <div className={subscriptionStyles.customerCell}>
                    <span className={subscriptionStyles.customerName}>
                      {sub.customerFirstName} {sub.customerLastName}
                    </span>
                    <span className={subscriptionStyles.customerEmail}>{sub.customerEmail}</span>
                  </div>
                </td>
                <td>
                  <div className={subscriptionStyles.productCell}>
                    <span className={subscriptionStyles.productName}>{sub.productName}</span>
                    <span className={subscriptionStyles.variantName}>{sub.variantName} × {sub.quantity}</span>
                  </div>
                </td>
                <td>{getIntervalLabel(sub.intervalCount, sub.intervalUnit)}</td>
                <td>{formatPrice(sub.unitPrice * sub.quantity)}</td>
                <td>
                  <span className={`${subscriptionStyles.statusBadge} ${getStatusBadgeClass(sub.status)}`}>
                    {sub.status}
                  </span>
                </td>
                <td>
                  {sub.nextDeliveryAt 
                    ? new Date(sub.nextDeliveryAt).toLocaleDateString('de-DE')
                    : '—'}
                </td>
                <td>{sub.createdAt ? new Date(sub.createdAt).toLocaleDateString('de-DE') : '—'}</td>
                <td>
                  <Link href={`/admin/subscriptions/${sub.id}`} className={subscriptionStyles.viewLink}>
                    View
                  </Link>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className={styles.empty}>No subscriptions yet</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
