import { db } from '@/db';
import { giftCards } from '@/db/schema';
import { desc } from 'drizzle-orm';
import styles from '../dashboard.module.css';
import { GiftCardActions } from './GiftCardActions';

export default async function AdminGiftCardsPage() {
  // Fetch all gift cards with transaction count
  const allGiftCards = await db.select({
    id: giftCards.id,
    code: giftCards.code,
    initialAmount: giftCards.initialAmount,
    currentBalance: giftCards.currentBalance,
    currency: giftCards.currency,
    purchasedByEmail: giftCards.purchasedByEmail,
    recipientEmail: giftCards.recipientEmail,
    recipientName: giftCards.recipientName,
    status: giftCards.status,
    sentAt: giftCards.sentAt,
    expiresAt: giftCards.expiresAt,
    createdAt: giftCards.createdAt,
  }).from(giftCards).orderBy(desc(giftCards.createdAt));

  // Calculate stats
  const stats = {
    total: allGiftCards.length,
    active: allGiftCards.filter(g => g.status === 'active').length,
    totalValue: allGiftCards.reduce((sum, g) => sum + g.initialAmount, 0),
    outstandingBalance: allGiftCards
      .filter(g => g.status === 'active')
      .reduce((sum, g) => sum + g.currentBalance, 0),
  };

  const formatPrice = (cents: number) => `€${(cents / 100).toFixed(2)}`;
  const formatDate = (date: Date | null) => 
    date ? new Date(date).toLocaleDateString('de-DE') : '-';

  const getStatusBadge = (status: string) => {
    const statusStyles: Record<string, { bg: string; color: string; label: string }> = {
      pending: { bg: '#fef3c7', color: '#92400e', label: 'Pending' },
      active: { bg: '#d1fae5', color: '#065f46', label: 'Active' },
      used: { bg: '#e5e7eb', color: '#374151', label: 'Used' },
      expired: { bg: '#fee2e2', color: '#991b1b', label: 'Expired' },
      disabled: { bg: '#fecaca', color: '#991b1b', label: 'Disabled' },
    };
    const style = statusStyles[status] || statusStyles.pending;
    return (
      <span style={{ 
        background: style.bg, 
        color: style.color, 
        padding: '4px 8px', 
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: 500 
      }}>
        {style.label}
      </span>
    );
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Gift Cards</h1>
        <p>Manage gift cards and vouchers</p>
      </header>

      {/* Stats */}
      <div className={styles.stats}>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{stats.total}</span>
          <span className={styles.statLabel}>Total</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{stats.active}</span>
          <span className={styles.statLabel}>Active</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{formatPrice(stats.totalValue)}</span>
          <span className={styles.statLabel}>Total Value</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{formatPrice(stats.outstandingBalance)}</span>
          <span className={styles.statLabel}>Outstanding Balance</span>
        </div>
      </div>

      {/* Gift Cards Table */}
      <section className={styles.section}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Code</th>
                <th>Status</th>
                <th>Value</th>
                <th>Balance</th>
                <th>Purchased By</th>
                <th>Recipient</th>
                <th>Created</th>
                <th>Expires</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {allGiftCards.length === 0 ? (
                <tr>
                  <td colSpan={9} className={styles.empty}>
                    No gift cards yet
                  </td>
                </tr>
              ) : (
                allGiftCards.map((giftCard) => (
                  <tr key={giftCard.id}>
                    <td>
                      <code className={styles.code}>
                        {giftCard.code}
                      </code>
                    </td>
                    <td>{getStatusBadge(giftCard.status)}</td>
                    <td>{formatPrice(giftCard.initialAmount)}</td>
                    <td>
                      <span style={{ 
                        color: giftCard.currentBalance === 0 ? '#9ca3af' : '#059669',
                        fontWeight: 600 
                      }}>
                        {formatPrice(giftCard.currentBalance)}
                      </span>
                    </td>
                    <td style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {giftCard.purchasedByEmail || '-'}
                    </td>
                    <td style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {giftCard.recipientName || giftCard.recipientEmail || '-'}
                    </td>
                    <td>{formatDate(giftCard.createdAt)}</td>
                    <td>{formatDate(giftCard.expiresAt)}</td>
                    <td>
                      <GiftCardActions 
                        giftCardId={giftCard.id} 
                        status={giftCard.status}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
