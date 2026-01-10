import { db } from '@/db';
import { referralCodes, referrals, referralRewards, customers, orders } from '@/db/schema';
import { desc, eq, sql } from 'drizzle-orm';
import styles from './referrals.module.css';
import ReferrerActions from './ReferrerActions';

export const dynamic = 'force-dynamic';

// Helper function to get referrer abuse stats
async function getReferrerAbuseStats() {
  const allReferralCodes = await db.select().from(referralCodes);

  const referrerStats = await Promise.all(
    allReferralCodes.map(async (code) => {
      const customer = await db.query.customers.findFirst({
        where: eq(customers.id, code.customerId),
      });
      
      if (!customer) return null;

      const customerReferrals = await db.select().from(referrals)
        .where(eq(referrals.referrerId, customer.id));

      let refundedCount = 0;
      const totalReferrals = customerReferrals.length;

      for (const referral of customerReferrals) {
        if (referral.qualifyingOrderId) {
          const order = await db.query.orders.findFirst({
            where: eq(orders.id, referral.qualifyingOrderId),
          });
          if (order?.status === 'refunded') {
            refundedCount++;
          }
        }
      }

      const refundRate = totalReferrals > 0 ? refundedCount / totalReferrals : 0;
      const isFlagged = totalReferrals >= 3 && refundRate >= 0.5;

      return {
        customerId: customer.id,
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        referralCode: code.code,
        totalReferrals,
        refundedCount,
        refundRate: Math.round(refundRate * 100),
        isFlagged,
        isTrusted: customer.referralTrusted || false,
        isSuspended: customer.referralSuspended || false,
        notes: customer.referralNotes,
      };
    })
  );

  return referrerStats.filter((r): r is NonNullable<typeof r> => r !== null);
}

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

  // Get abuse stats for the management section
  const abuseStats = await getReferrerAbuseStats();
  const flaggedReferrers = abuseStats.filter(r => r.isFlagged && !r.isTrusted && !r.isSuspended);
  const suspendedReferrers = abuseStats.filter(r => r.isSuspended);
  const trustedReferrers = abuseStats.filter(r => r.isTrusted);

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

      {/* Abuse Prevention Management */}
      <section className={styles.section}>
        <h2>🛡️ Abuse Prevention</h2>
        <p style={{ color: '#666', marginBottom: '1rem', fontSize: '0.875rem' }}>
          Manage referrers who may be exploiting the referral program. Flagged referrers have a high refund rate among their referrals.
        </p>
        
        {/* Stats Summary */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <div style={{ 
            padding: '0.75rem 1rem', 
            background: flaggedReferrers.length > 0 ? '#fffbeb' : '#f3f4f6', 
            borderRadius: '8px',
            border: flaggedReferrers.length > 0 ? '1px solid #f59e0b' : '1px solid #e5e5e5'
          }}>
            <strong style={{ color: flaggedReferrers.length > 0 ? '#92400e' : '#374151' }}>
              {flaggedReferrers.length}
            </strong>
            <span style={{ marginLeft: '0.5rem', fontSize: '0.875rem', color: '#666' }}>Flagged</span>
          </div>
          <div style={{ padding: '0.75rem 1rem', background: '#ecfdf5', borderRadius: '8px', border: '1px solid #10b981' }}>
            <strong style={{ color: '#065f46' }}>{trustedReferrers.length}</strong>
            <span style={{ marginLeft: '0.5rem', fontSize: '0.875rem', color: '#666' }}>Trusted</span>
          </div>
          <div style={{ padding: '0.75rem 1rem', background: '#fef2f2', borderRadius: '8px', border: '1px solid #ef4444' }}>
            <strong style={{ color: '#b91c1c' }}>{suspendedReferrers.length}</strong>
            <span style={{ marginLeft: '0.5rem', fontSize: '0.875rem', color: '#666' }}>Suspended</span>
          </div>
        </div>

        {flaggedReferrers.length > 0 && (
          <>
            <h3 style={{ marginTop: '1.5rem', marginBottom: '0.5rem', color: '#92400e' }}>⚠️ Needs Review</h3>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Referrer</th>
                  <th>Code</th>
                  <th>Referrals</th>
                  <th>Refunded</th>
                  <th>Rate</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {flaggedReferrers.map((referrer) => (
                  <tr key={referrer.customerId}>
                    <td>
                      <div>
                        <strong>{referrer.firstName} {referrer.lastName}</strong>
                        <br />
                        <span style={{ fontSize: '0.75rem', color: '#666' }}>{referrer.email}</span>
                      </div>
                    </td>
                    <td className={styles.code}>{referrer.referralCode}</td>
                    <td>{referrer.totalReferrals}</td>
                    <td>{referrer.refundedCount}</td>
                    <td style={{ color: '#ef4444', fontWeight: 600 }}>{referrer.refundRate}%</td>
                    <td>
                      <ReferrerActions 
                        customerId={referrer.customerId} 
                        isTrusted={referrer.isTrusted}
                        isSuspended={referrer.isSuspended}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {suspendedReferrers.length > 0 && (
          <>
            <h3 style={{ marginTop: '1.5rem', marginBottom: '0.5rem', color: '#b91c1c' }}>🚫 Suspended</h3>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Referrer</th>
                  <th>Code</th>
                  <th>Notes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {suspendedReferrers.map((referrer) => (
                  <tr key={referrer.customerId}>
                    <td>
                      <strong>{referrer.firstName} {referrer.lastName}</strong>
                      <br />
                      <span style={{ fontSize: '0.75rem', color: '#666' }}>{referrer.email}</span>
                    </td>
                    <td className={styles.code}>{referrer.referralCode}</td>
                    <td style={{ fontSize: '0.875rem', color: '#666' }}>{referrer.notes || '-'}</td>
                    <td>
                      <ReferrerActions 
                        customerId={referrer.customerId} 
                        isTrusted={referrer.isTrusted}
                        isSuspended={referrer.isSuspended}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {trustedReferrers.length > 0 && (
          <>
            <h3 style={{ marginTop: '1.5rem', marginBottom: '0.5rem', color: '#065f46' }}>✅ Trusted</h3>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Referrer</th>
                  <th>Code</th>
                  <th>Notes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {trustedReferrers.map((referrer) => (
                  <tr key={referrer.customerId}>
                    <td>
                      <strong>{referrer.firstName} {referrer.lastName}</strong>
                      <br />
                      <span style={{ fontSize: '0.75rem', color: '#666' }}>{referrer.email}</span>
                    </td>
                    <td className={styles.code}>{referrer.referralCode}</td>
                    <td style={{ fontSize: '0.875rem', color: '#666' }}>{referrer.notes || '-'}</td>
                    <td>
                      <ReferrerActions 
                        customerId={referrer.customerId} 
                        isTrusted={referrer.isTrusted}
                        isSuspended={referrer.isSuspended}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {flaggedReferrers.length === 0 && suspendedReferrers.length === 0 && trustedReferrers.length === 0 && (
          <p style={{ color: '#666', textAlign: 'center', padding: '2rem' }}>
            No referrers require attention at this time.
          </p>
        )}
      </section>
    </div>
  );
}
