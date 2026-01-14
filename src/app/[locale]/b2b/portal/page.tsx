import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getCurrentB2BCompany } from '@/lib/b2b-auth';
import { db } from '@/db';
import { b2bOrders, orders, smartBoxes, boxReadings } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { Link } from '@/i18n/routing';
import styles from './portal.module.css';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function B2BPortalDashboard({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  
  const t = await getTranslations('b2b.portal.dashboard');
  const company = await getCurrentB2BCompany();
  
  if (!company) {
    return null;
  }
  
  // Fetch recent B2B orders with joined order details
  const recentB2BOrders = await db
    .select({
      b2bOrder: b2bOrders,
      order: orders,
    })
    .from(b2bOrders)
    .leftJoin(orders, eq(b2bOrders.orderId, orders.id))
    .where(eq(b2bOrders.companyId, company.id))
    .orderBy(desc(b2bOrders.createdAt))
    .limit(5);
  
  // Fetch SmartBox status if Smart tier
  let smartBox = null;
  let latestReading = null;
  
  if (company.tier === 'smart') {
    const boxes = await db
      .select()
      .from(smartBoxes)
      .where(eq(smartBoxes.companyId, company.id))
      .limit(1);
    
    smartBox = boxes[0] || null;
    
    if (smartBox) {
      const readings = await db
        .select()
        .from(boxReadings)
        .where(eq(boxReadings.boxId, smartBox.id))
        .orderBy(desc(boxReadings.recordedAt))
        .limit(1);
      
      latestReading = readings[0] || null;
    }
  }
  
  // Calculate stats
  const totalOrders = recentB2BOrders.length;
  const totalSpent = recentB2BOrders.reduce((sum, o) => sum + (o.order?.total || 0), 0);
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale === 'de' ? 'de-DE' : 'en-US', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount / 100);
  };
  
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat(locale === 'de' ? 'de-DE' : 'en-US', {
      day: 'numeric',
      month: 'short',
    }).format(date);
  };
  
  const fillLevel = latestReading?.fillPercent ?? 100;
  const circumference = 2 * Math.PI * 40;
  const dashOffset = circumference - (fillLevel / 100) * circumference;
  
  return (
    <div className={styles.dashboardPage}>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>
          {t('title')}, {company.contactFirstName}!
        </h1>
        <p className={styles.pageSubtitle}>{company.companyName}</p>
      </header>
      
      <div className={styles.dashboardGrid}>
        <div className={styles.mainColumn}>
          {/* SmartBox Status - only for Smart tier */}
          {company.tier === 'smart' && smartBox && (
            <div className={`${styles.card} ${styles.smartBoxCard}`}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>{t('smartBox.title')}</h2>
              </div>
              <div className={styles.smartBoxStatus}>
                <div className={styles.fillLevelContainer}>
                  <svg className={styles.fillLevelCircle} viewBox="0 0 100 100">
                    <circle
                      className={styles.fillLevelBg}
                      cx="50"
                      cy="50"
                      r="40"
                    />
                    <circle
                      className={styles.fillLevelFill}
                      cx="50"
                      cy="50"
                      r="40"
                      strokeDasharray={circumference}
                      strokeDashoffset={dashOffset}
                    />
                  </svg>
                  <span className={styles.fillLevelText}>{fillLevel}%</span>
                </div>
                <div className={styles.smartBoxInfo}>
                  <p className={styles.smartBoxLabel}>{t('smartBox.fillLevel')}</p>
                  <p className={styles.smartBoxValue}>
                    {fillLevel > 50 ? t('smartBox.healthy') : t('smartBox.lowStock')}
                  </p>
                  {latestReading && (
                    <>
                      <p className={styles.smartBoxLabel}>{t('smartBox.lastReading')}</p>
                      <p className={styles.smartBoxValue}>
                        {formatDate(latestReading.recordedAt)}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Stats Row */}
          <div className={styles.statsRow}>
            <div className={styles.stat}>
              <div className={styles.statValue}>{totalOrders}</div>
              <div className={styles.statLabel}>Total Orders</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statValue}>{formatCurrency(totalSpent)}</div>
              <div className={styles.statLabel}>Total Spent</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statValue}>{company.tier.toUpperCase()}</div>
              <div className={styles.statLabel}>Current Tier</div>
            </div>
          </div>
          
          {/* Recent Orders */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>{t('recentOrders')}</h2>
              <Link href="/b2b/portal/orders" className={styles.cardLink}>
                View all →
              </Link>
            </div>
            
            {recentB2BOrders.length > 0 ? (
              <table className={styles.ordersTable}>
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {recentB2BOrders.map(({ b2bOrder, order }) => (
                    <tr key={b2bOrder.id}>
                      <td>#{order?.orderNumber || b2bOrder.id.slice(0, 8)}</td>
                      <td>{formatDate(b2bOrder.createdAt)}</td>
                      <td>
                        <span className={`${styles.orderStatus} ${styles[order?.status || 'pending']}`}>
                          {order?.status || 'pending'}
                        </span>
                      </td>
                      <td>{formatCurrency(order?.total || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className={styles.emptyState}>
                <p>{t('noOrders')}</p>
                <Link href="/b2b/portal/shop" className={styles.cardLink}>
                  Place your first order →
                </Link>
              </div>
            )}
          </div>
        </div>
        
        <div className={styles.sideColumn}>
          {/* Quick Actions */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>{t('quickReorder')}</h2>
            </div>
            <div className={styles.quickActions}>
              <Link href="/b2b/portal/shop" className={styles.quickAction}>
                <span className={styles.quickActionIcon}>🛒</span>
                <span className={styles.quickActionLabel}>Browse Products</span>
                <span className={styles.quickActionArrow}>→</span>
              </Link>
              {recentB2BOrders[0] && (
                <Link href={`/b2b/portal/orders/${recentB2BOrders[0].b2bOrder.id}/reorder`} className={styles.quickAction}>
                  <span className={styles.quickActionIcon}>🔄</span>
                  <span className={styles.quickActionLabel}>Reorder Last Order</span>
                  <span className={styles.quickActionArrow}>→</span>
                </Link>
              )}
              <Link href="/b2b/portal/account" className={styles.quickAction}>
                <span className={styles.quickActionIcon}>⚙️</span>
                <span className={styles.quickActionLabel}>Account Settings</span>
                <span className={styles.quickActionArrow}>→</span>
              </Link>
            </div>
          </div>
          
          {/* Promo Code Card */}
          {company.promoCode && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Employee Promo Code</h2>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.75rem' }}>
                Share with employees for 10% off D2C orders:
              </p>
              <div style={{ 
                background: '#1a1a1a', 
                color: 'white', 
                padding: '0.75rem', 
                borderRadius: '6px',
                fontFamily: 'monospace',
                fontWeight: 'bold',
                textAlign: 'center',
                letterSpacing: '1px'
              }}>
                {company.promoCode}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
