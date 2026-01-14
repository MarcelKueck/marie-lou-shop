import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getCurrentB2BCompany } from '@/lib/b2b-auth';
import { db } from '@/db';
import { b2bOrders, orders } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { Link } from '@/i18n/routing';
import styles from './orders.module.css';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function B2BOrdersPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  
  const t = await getTranslations('b2b.portal.orders');
  const company = await getCurrentB2BCompany();
  
  if (!company) {
    return null;
  }
  
  // Fetch all B2B orders with linked order details
  const companyOrders = await db
    .select({
      b2bOrder: b2bOrders,
      order: orders,
    })
    .from(b2bOrders)
    .leftJoin(orders, eq(b2bOrders.orderId, orders.id))
    .where(eq(b2bOrders.companyId, company.id))
    .orderBy(desc(b2bOrders.createdAt));
  
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
      year: 'numeric',
    }).format(date);
  };
  
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending': return styles.statusPending;
      case 'processing': return styles.statusProcessing;
      case 'shipped': return styles.statusShipped;
      case 'delivered': return styles.statusDelivered;
      case 'cancelled': return styles.statusCancelled;
      default: return styles.statusPending;
    }
  };
  
  const getPaymentBadgeClass = (status: string) => {
    switch (status) {
      case 'paid': return styles.paymentPaid;
      case 'pending': return styles.paymentPending;
      case 'overdue': return styles.paymentOverdue;
      default: return styles.paymentPending;
    }
  };
  
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>{t('title')}</h1>
          <p className={styles.subtitle}>{companyOrders.length} orders total</p>
        </div>
        <Link href="/b2b/portal/shop" className={styles.newOrderButton}>
          + New Order
        </Link>
      </header>
      
      {companyOrders.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📦</div>
          <h2 className={styles.emptyTitle}>{t('empty')}</h2>
          <p className={styles.emptyText}>Place your first order to get started.</p>
          <Link href="/b2b/portal/shop" className={styles.shopLink}>
            Browse Products →
          </Link>
        </div>
      ) : (
        <div className={styles.ordersTable}>
          <table>
            <thead>
              <tr>
                <th>{t('orderNumber')}</th>
                <th>{t('date')}</th>
                <th>PO Number</th>
                <th>{t('status')}</th>
                <th>Payment</th>
                <th>{t('total')}</th>
                <th>{t('invoice')}</th>
              </tr>
            </thead>
            <tbody>
              {companyOrders.map(({ b2bOrder, order }) => (
                <tr key={b2bOrder.id}>
                  <td>
                    <Link href={`/b2b/portal/orders/${b2bOrder.id}`} className={styles.orderLink}>
                      {order?.orderNumber || b2bOrder.id.slice(0, 8)}
                    </Link>
                  </td>
                  <td>{formatDate(b2bOrder.createdAt)}</td>
                  <td>{b2bOrder.poNumber || '-'}</td>
                  <td>
                    <span className={`${styles.statusBadge} ${getStatusBadgeClass(order?.status || 'pending')}`}>
                      {order?.status || 'pending'}
                    </span>
                  </td>
                  <td>
                    <span className={`${styles.paymentBadge} ${getPaymentBadgeClass(b2bOrder.paymentStatus)}`}>
                      {b2bOrder.paymentStatus}
                    </span>
                  </td>
                  <td className={styles.totalCell}>
                    {formatCurrency(order?.total || 0)}
                    {(b2bOrder.volumeDiscountAmount ?? 0) > 0 && (
                      <span className={styles.discount}>
                        -{b2bOrder.volumeDiscountPercent}%
                      </span>
                    )}
                  </td>
                  <td>
                    {order?.invoiceNumber ? (
                      <a href={`/api/invoices/${order.invoiceId}`} className={styles.invoiceLink} target="_blank" rel="noopener noreferrer">
                        {order.invoiceNumber}
                      </a>
                    ) : (
                      <span className={styles.noInvoice}>Pending</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
