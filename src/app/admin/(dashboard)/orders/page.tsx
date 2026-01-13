import { db } from '@/db';
import { orders } from '@/db/schema';
import { desc } from 'drizzle-orm';
import Link from 'next/link';
import styles from '../dashboard.module.css';

export const dynamic = 'force-dynamic';

export default async function AdminOrdersPage() {
  const rows = await db.select({
    id: orders.id,
    orderNumber: orders.orderNumber,
    email: orders.email,
    total: orders.total,
    currency: orders.currency,
    status: orders.status,
    createdAt: orders.createdAt,
  }).from(orders)
    .orderBy(desc(orders.createdAt))
    .limit(50);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Orders</h1>
        <p>Recent orders (most recent first)</p>
      </header>

      <section className={styles.section}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Order</th>
              <th>Email</th>
              <th>Total</th>
              <th>Status</th>
              <th>Date</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => (
              <tr key={o.id}>
                <td className={styles.code}>{o.orderNumber}</td>
                <td>{o.email}</td>
                <td>€{((o.total || 0) / 100).toFixed(2)}</td>
                <td>{o.status}</td>
                <td>{o.createdAt ? new Date(o.createdAt).toLocaleString() : '—'}</td>
                <td>
                  <Link href={`/admin/orders/${o.orderNumber}`} className={styles.linkButton}>
                    View
                  </Link>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className={styles.empty}>No orders yet</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
