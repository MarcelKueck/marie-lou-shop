import { db } from '@/db';
import { customers } from '@/db/schema';
import { desc } from 'drizzle-orm';
import styles from '../dashboard.module.css';

export const dynamic = 'force-dynamic';

export default async function AdminCustomersPage() {
  const rows = await db.select({
    id: customers.id,
    email: customers.email,
    firstName: customers.firstName,
    lastName: customers.lastName,
    createdAt: customers.createdAt,
  }).from(customers)
    .orderBy(desc(customers.createdAt))
    .limit(50);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Customers</h1>
        <p>Recent customers and contact details</p>
      </header>

      <section className={styles.section}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Email</th>
              <th>Name</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id}>
                <td>{c.email}</td>
                <td>{(c.firstName || '') + (c.lastName ? ' ' + c.lastName : '')}</td>
                <td>{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={3} className={styles.empty}>No customers yet</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
