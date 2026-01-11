import { db } from '@/db';
import { orders, customers, reviews } from '@/db/schema';
import { sql, gte, eq } from 'drizzle-orm';
import Link from 'next/link';
import styles from './dashboard.module.css';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardIndex() {
  const now = new Date();
  
  // Today's date at midnight
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  
  // 30 days ago
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  // Today's stats
  const todayStats = await db.select({
    orders: sql<number>`count(*)`,
    revenue: sql<number>`coalesce(sum(${orders.total}), 0)`,
  })
  .from(orders)
  .where(gte(orders.createdAt, today));
  
  // Month stats  
  const monthStats = await db.select({
    orders: sql<number>`count(*)`,
    revenue: sql<number>`coalesce(sum(${orders.total}), 0)`,
  })
  .from(orders)
  .where(gte(orders.createdAt, thirtyDaysAgo));
  
  // Pending orders (paid but not processed)
  const pendingOrders = await db.query.orders.findMany({
    where: eq(orders.status, 'paid'),
    orderBy: (orders, { asc }) => [asc(orders.createdAt)],
    limit: 10,
  });
  
  // Ready to ship (processing)
  const readyToShip = await db.query.orders.findMany({
    where: eq(orders.status, 'processing'),
    orderBy: (orders, { asc }) => [asc(orders.createdAt)],
    limit: 10,
  });
  
  // Pending reviews
  const pendingReviews = await db.select({
    count: sql<number>`count(*)`,
  })
  .from(reviews)
  .where(eq(reviews.status, 'pending'));
  
  // Total customers
  const totalCustomers = await db.select({
    count: sql<number>`count(*)`,
  })
  .from(customers);
  
  const formatPrice = (cents: number) => `€${(cents / 100).toFixed(2)}`;
  
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Dashboard</h1>
        <p>Guten Tag! Hier ist der Überblick für heute.</p>
      </header>

      {/* Stats Cards */}
      <div className={styles.stats}>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{formatPrice(Number(todayStats[0]?.revenue || 0))}</span>
          <span className={styles.statLabel}>Umsatz heute</span>
          <span className={styles.statSubtext}>{todayStats[0]?.orders || 0} Bestellungen</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{formatPrice(Number(monthStats[0]?.revenue || 0))}</span>
          <span className={styles.statLabel}>Umsatz 30 Tage</span>
          <span className={styles.statSubtext}>{monthStats[0]?.orders || 0} Bestellungen</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{totalCustomers[0]?.count || 0}</span>
          <span className={styles.statLabel}>Kunden gesamt</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue} style={{ color: Number(pendingReviews[0]?.count || 0) > 0 ? '#f59e0b' : undefined }}>
            {pendingReviews[0]?.count || 0}
          </span>
          <span className={styles.statLabel}>Ausstehende Bewertungen</span>
        </div>
      </div>

      {/* Action Required */}
      {(pendingOrders.length > 0 || readyToShip.length > 0) && (
        <section className={styles.section}>
          <h2 style={{ marginBottom: '1rem', color: '#f59e0b' }}>⏳ Aktion erforderlich</h2>
          
          {pendingOrders.length > 0 && (
            <div className={styles.actionCard}>
              <h3>📦 {pendingOrders.length} Bestellung(en) warten auf Röstung</h3>
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Bestellung</th>
                      <th>Kunde</th>
                      <th>Datum</th>
                      <th>Summe</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingOrders.map(order => (
                      <tr key={order.id}>
                        <td>{order.orderNumber}</td>
                        <td>{order.firstName} {order.lastName}</td>
                        <td>{order.createdAt?.toLocaleDateString('de-DE')}</td>
                        <td>{formatPrice(order.total)}</td>
                        <td>
                          <Link href={`/admin/orders/${order.id}`} className={styles.linkButton}>
                            Öffnen
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {readyToShip.length > 0 && (
            <div className={styles.actionCard} style={{ marginTop: '1rem' }}>
              <h3>🚚 {readyToShip.length} Bestellung(en) bereit zum Versand</h3>
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Bestellung</th>
                      <th>Kunde</th>
                      <th>Geröstet am</th>
                      <th>Summe</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {readyToShip.map(order => (
                      <tr key={order.id}>
                        <td>{order.orderNumber}</td>
                        <td>{order.firstName} {order.lastName}</td>
                        <td>{order.roastedAt?.toLocaleDateString('de-DE') || '-'}</td>
                        <td>{formatPrice(order.total)}</td>
                        <td>
                          <Link href={`/admin/orders/${order.id}`} className={styles.linkButton}>
                            Öffnen
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Quick Links */}
      <section className={styles.columns}>
        <Link href="/admin/orders" className={styles.quickLink}>
          <h3>📋 Bestellungen</h3>
          <p>Alle Bestellungen anzeigen und verwalten</p>
        </Link>
        <Link href="/admin/reviews" className={styles.quickLink}>
          <h3>⭐ Bewertungen</h3>
          <p>Kundenbewertungen moderieren</p>
        </Link>
        <Link href="/admin/customers" className={styles.quickLink}>
          <h3>👥 Kunden</h3>
          <p>Kundenliste und Details</p>
        </Link>
        <Link href="/admin/referrals" className={styles.quickLink}>
          <h3>🎁 Empfehlungen</h3>
          <p>Empfehlungsprogramm verwalten</p>
        </Link>
      </section>
    </div>
  );
}
