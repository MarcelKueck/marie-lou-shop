import { db } from '@/db';
import { orders, customers, reviews } from '@/db/schema';
import { sql, gte, eq } from 'drizzle-orm';
import Link from 'next/link';
import styles from './(dashboard)/dashboard.module.css';
import LogoutButton from './(dashboard)/LogoutButton';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
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
    <div className={styles.layout}>
      <nav className={styles.sidebar}>
        <div className={styles.logo}>
          <Link href="/admin">Admin Panel</Link>
        </div>
        <ul className={styles.navList}>
          <li><Link href="/admin">Dashboard</Link></li>
          <li><Link href="/admin/orders">Orders</Link></li>
          <li><Link href="/admin/subscriptions">Subscriptions</Link></li>
          <li><Link href="/admin/refunds">Refunds</Link></li>
          <li><Link href="/admin/reviews">Reviews</Link></li>
          <li><Link href="/admin/gift-cards">Gift Cards</Link></li>
          <li><Link href="/admin/products">Products</Link></li>
          <li><Link href="/admin/inventory">Inventory</Link></li>
          <li><Link href="/admin/customers">Customers</Link></li>
          <li><Link href="/admin/referrals">Referrals</Link></li>
          <li><Link href="/admin/analytics">Analytics</Link></li>
          <li><Link href="/admin/settings">Settings</Link></li>
        </ul>
        <div className={styles.sidebarFooter}>
          <LogoutButton />
        </div>
      </nav>
      <main className={styles.main}>
        <div className={styles.container}>
          <header className={styles.header}>
            <h1>Dashboard</h1>
            <p>Good day! Here is your overview for today.</p>
          </header>

          {/* Stats Cards */}
          <div className={styles.stats}>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{formatPrice(Number(todayStats[0]?.revenue || 0))}</span>
              <span className={styles.statLabel}>Revenue today</span>
              <span className={styles.statSubtext}>{todayStats[0]?.orders || 0} orders</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{formatPrice(Number(monthStats[0]?.revenue || 0))}</span>
              <span className={styles.statLabel}>Revenue 30 days</span>
              <span className={styles.statSubtext}>{monthStats[0]?.orders || 0} orders</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{totalCustomers[0]?.count || 0}</span>
              <span className={styles.statLabel}>Total customers</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue} style={{ color: Number(pendingReviews[0]?.count || 0) > 0 ? '#f59e0b' : undefined }}>
                {pendingReviews[0]?.count || 0}
              </span>
              <span className={styles.statLabel}>Pending reviews</span>
            </div>
          </div>

          {/* Action Required */}
          {(pendingOrders.length > 0 || readyToShip.length > 0) && (
            <section className={styles.section}>
              <h2 style={{ marginBottom: '1rem', color: '#f59e0b' }}>⏳ Action required</h2>
              
              {pendingOrders.length > 0 && (
                <div className={styles.actionCard}>
                  <h3>📦 {pendingOrders.length} order(s) waiting to be roasted</h3>
                  <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Order</th>
                          <th>Customer</th>
                          <th>Date</th>
                          <th>Total</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingOrders.map(order => (
                          <tr key={order.id}>
                            <td>{order.orderNumber}</td>
                            <td>{order.firstName} {order.lastName}</td>
                            <td>{order.createdAt?.toLocaleDateString('en-US')}</td>
                            <td>{formatPrice(order.total)}</td>
                            <td>
                              <Link href={`/admin/orders/${order.orderNumber}`} className={styles.linkButton}>
                                Open
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
                  <h3>🚚 {readyToShip.length} order(s) ready to ship</h3>
                  <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Order</th>
                          <th>Customer</th>
                          <th>Roasted on</th>
                          <th>Total</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {readyToShip.map(order => (
                          <tr key={order.id}>
                            <td>{order.orderNumber}</td>
                            <td>{order.firstName} {order.lastName}</td>
                            <td>{order.roastedAt?.toLocaleDateString('en-US') || '-'}</td>
                            <td>{formatPrice(order.total)}</td>
                            <td>
                              <Link href={`/admin/orders/${order.orderNumber}`} className={styles.linkButton}>
                                Open
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
              <h3>📋 Orders</h3>
              <p>View and manage all orders</p>
            </Link>
            <Link href="/admin/reviews" className={styles.quickLink}>
              <h3>⭐ Reviews</h3>
              <p>Moderate customer reviews</p>
            </Link>
            <Link href="/admin/customers" className={styles.quickLink}>
              <h3>👥 Customers</h3>
              <p>Customer list and details</p>
            </Link>
            <Link href="/admin/referrals" className={styles.quickLink}>
              <h3>🎁 Referrals</h3>
              <p>Manage referral program</p>
            </Link>
          </section>
        </div>
      </main>
    </div>
  );
}