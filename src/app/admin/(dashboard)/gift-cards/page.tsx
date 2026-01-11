import { db } from '@/db';
import { giftCards, giftCardTransactions } from '@/db/schema';
import { desc, eq, sql } from 'drizzle-orm';
import styles from '../../admin.module.css';
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
      pending: { bg: '#fef3c7', color: '#92400e', label: 'Ausstehend' },
      active: { bg: '#d1fae5', color: '#065f46', label: 'Aktiv' },
      used: { bg: '#e5e7eb', color: '#374151', label: 'Aufgebraucht' },
      expired: { bg: '#fee2e2', color: '#991b1b', label: 'Abgelaufen' },
      disabled: { bg: '#fecaca', color: '#991b1b', label: 'Deaktiviert' },
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
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Geschenkgutscheine</h1>
      </div>

      {/* Stats */}
      <div className={styles.statsGrid} style={{ marginBottom: 30 }}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.total}</div>
          <div className={styles.statLabel}>Gesamt</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.active}</div>
          <div className={styles.statLabel}>Aktiv</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{formatPrice(stats.totalValue)}</div>
          <div className={styles.statLabel}>Gesamtwert</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{formatPrice(stats.outstandingBalance)}</div>
          <div className={styles.statLabel}>Offenes Guthaben</div>
        </div>
      </div>

      {/* Gift Cards Table */}
      <div className={styles.card}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Code</th>
              <th>Status</th>
              <th>Wert</th>
              <th>Guthaben</th>
              <th>Käufer</th>
              <th>Empfänger</th>
              <th>Erstellt</th>
              <th>Gültig bis</th>
              <th>Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {allGiftCards.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: 40, color: '#666' }}>
                  Noch keine Gutscheine vorhanden
                </td>
              </tr>
            ) : (
              allGiftCards.map((giftCard) => (
                <tr key={giftCard.id}>
                  <td>
                    <code style={{ 
                      background: '#f3f4f6', 
                      padding: '4px 8px', 
                      borderRadius: '4px',
                      fontFamily: 'monospace' 
                    }}>
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
                    {giftCard.purchasedByEmail}
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
    </div>
  );
}
