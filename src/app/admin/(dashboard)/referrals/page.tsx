import { db } from '@/db';
import { referralCodes, referrals, referralRewards, customers } from '@/db/schema';
import { desc, eq, sql } from 'drizzle-orm';
import styles from './referrals.module.css';

export const dynamic = 'force-dynamic';

export default async function AdminReferralsPage() {
  // Get overall stats
  const overallStats = await db.select({
    totalCodes: sql<number>`count(distinct ${referralCodes.id})`,
    totalReferrals: sql<number>`count(distinct ${referrals.id})`,
    totalRewards: sql<number>`count(distinct ${referralRewards.id})`,
    pendingRewards: sql<number>`sum(case when ${referralRewards.status} = 'pending' then 1 else 0 end)`,
  }).from(referralCodes)
    .leftJoin(referrals, eq(referrals.referrerCodeId, referralCodes.id))
    .leftJoin(referralRewards, eq(referralRewards.customerId, referralCodes.customerId));

  // Get top referrers
  const topReferrers = await db.select({
    customerId: referralCodes.customerId,
    code: referralCodes.code,
    timesUsed: referralCodes.timesUsed,
    customerEmail: customers.email,
    customerName: sql<string>`${customers.firstName} || ' ' || ${customers.lastName}`,
  }).from(referralCodes)
    .leftJoin(customers, eq(customers.id, referralCodes.customerId))
    .orderBy(desc(referralCodes.timesUsed))
    .limit(10);

  // Get recent referrals
  const recentReferrals = await db.select({
    id: referrals.id,
    referredEmail: referrals.referredEmail,
    status: referrals.status,
    createdAt: referrals.createdAt,
    referrerCode: referralCodes.code,
    referrerEmail: customers.email,
  }).from(referrals)
    .leftJoin(referralCodes, eq(referralCodes.id, referrals.referrerCodeId))
    .leftJoin(customers, eq(customers.id, referrals.referrerId))
    .orderBy(desc(referrals.createdAt))
    .limit(20);

  // Get pending rewards
  const pendingRewards = await db.select({
    id: referralRewards.id,
    productName: referralRewards.productName,
    status: referralRewards.status,
    createdAt: referralRewards.createdAt,
    customerEmail: customers.email,
  }).from(referralRewards)
    .leftJoin(customers, eq(customers.id, referralRewards.customerId))
    .where(eq(referralRewards.status, 'pending'))
    .orderBy(desc(referralRewards.createdAt))
    .limit(20);

  const stats = overallStats[0] || { totalCodes: 0, totalReferrals: 0, totalRewards: 0, pendingRewards: 0 };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Referral Program</h1>
        <p>Monitor referrals, rewards, and program performance</p>
      </header>

      <section className={styles.stats}>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{stats.totalCodes}</span>
          <span className={styles.statLabel}>Active Codes</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{stats.totalReferrals}</span>
          <span className={styles.statLabel}>Total Referrals</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{stats.totalRewards}</span>
          <span className={styles.statLabel}>Rewards Issued</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{stats.pendingRewards || 0}</span>
          <span className={styles.statLabel}>Pending Rewards</span>
        </div>
      </section>

      <div className={styles.columns}>
        <section className={styles.section}>
          <h2>Top Referrers</h2>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Code</th>
                <th>Customer</th>
                <th>Uses</th>
              </tr>
            </thead>
            <tbody>
              {topReferrers.map((referrer) => (
                <tr key={referrer.customerId}>
                  <td className={styles.code}>{referrer.code}</td>
                  <td>{referrer.customerEmail || 'Unknown'}</td>
                  <td>{referrer.timesUsed}</td>
                </tr>
              ))}
              {topReferrers.length === 0 && (
                <tr>
                  <td colSpan={3} className={styles.empty}>No referrers yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        <section className={styles.section}>
          <h2>Pending Rewards</h2>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Reward</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {pendingRewards.map((reward) => (
                <tr key={reward.id}>
                  <td>{reward.customerEmail || 'Unknown'}</td>
                  <td>{reward.productName}</td>
                  <td>{reward.createdAt ? new Date(reward.createdAt).toLocaleDateString() : 'N/A'}</td>
                </tr>
              ))}
              {pendingRewards.length === 0 && (
                <tr>
                  <td colSpan={3} className={styles.empty}>No pending rewards</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </div>

      <section className={styles.section}>
        <h2>Recent Referrals</h2>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Referred Email</th>
              <th>Referrer</th>
              <th>Code</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {recentReferrals.map((referral) => (
              <tr key={referral.id}>
                <td>{referral.referredEmail}</td>
                <td>{referral.referrerEmail || 'Unknown'}</td>
                <td className={styles.code}>{referral.referrerCode}</td>
                <td>
                  <span className={`${styles.status} ${styles[`status${referral.status}`]}`}>
                    {referral.status}
                  </span>
                </td>
                <td>{referral.createdAt ? new Date(referral.createdAt).toLocaleDateString() : 'N/A'}</td>
              </tr>
            ))}
            {recentReferrals.length === 0 && (
              <tr>
                <td colSpan={5} className={styles.empty}>No referrals yet</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
