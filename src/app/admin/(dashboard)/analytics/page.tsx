import { db } from '@/db';
import { orders, customers, referralCodes, referrals } from '@/db/schema';
import { sql } from 'drizzle-orm';
import styles from '../dashboard.module.css';

export const dynamic = 'force-dynamic';

export default async function AdminAnalyticsPage() {
  // Overall metrics
  const totalOrdersRes = await db.select({ total: sql<number>`count(*)` }).from(orders);
  const totalRevenueRes = await db.select({ revenue: sql<number>`sum(${orders.total})` }).from(orders);
  const totalCustomersRes = await db.select({ count: sql<number>`count(distinct ${customers.id})` }).from(customers);
  const totalCodesRes = await db.select({ count: sql<number>`count(*)` }).from(referralCodes);
  const totalReferralsRes = await db.select({ count: sql<number>`count(*)` }).from(referrals);

  const totalOrders = totalOrdersRes[0]?.total || 0;
  const totalRevenue = totalRevenueRes[0]?.revenue || 0;
  const totalCustomers = totalCustomersRes[0]?.count || 0;
  const totalCodes = totalCodesRes[0]?.count || 0;
  const totalReferrals = totalReferralsRes[0]?.count || 0;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Analytics</h1>
        <p>High-level overview of orders, customers, and referral activity</p>
      </header>

      <section className={styles.stats}>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{totalOrders}</span>
          <span className={styles.statLabel}>Total Orders</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>€{(totalRevenue / 100).toFixed(2)}</span>
          <span className={styles.statLabel}>Total Revenue</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{totalCustomers}</span>
          <span className={styles.statLabel}>Customers</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{totalCodes}</span>
          <span className={styles.statLabel}>Referral Codes</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{totalReferrals}</span>
          <span className={styles.statLabel}>Referrals</span>
        </div>
      </section>
    </div>
  );
}
