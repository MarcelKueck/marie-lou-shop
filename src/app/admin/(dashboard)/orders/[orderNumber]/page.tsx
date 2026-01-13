import { db } from '@/db';
import { orders, orderItems } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import styles from './order-detail.module.css';
import OrderActions from './OrderActions';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ orderNumber: string }>;
}

export default async function AdminOrderDetailPage({ params }: Props) {
  const { orderNumber } = await params;
  
  const order = await db.query.orders.findFirst({
    where: eq(orders.orderNumber, orderNumber),
  });

  if (!order) {
    notFound();
  }

  const items = await db.query.orderItems.findMany({
    where: eq(orderItems.orderId, order.id),
  });

  const formatPrice = (cents: number) => `€${(cents / 100).toFixed(2)}`;
  const formatDate = (date: Date | null) => date?.toLocaleString('en-US') || '-';

  const statusColors: Record<string, string> = {
    pending: '#f59e0b',
    paid: '#3b82f6',
    processing: '#8b5cf6',
    shipped: '#06b6d4',
    delivered: '#22c55e',
    cancelled: '#ef4444',
    refunded: '#6b7280',
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <Link href="/admin/orders" className={styles.backLink}>← Back to Orders</Link>
          <h1>Order {order.orderNumber}</h1>
        </div>
        <span 
          className={styles.statusBadge} 
          style={{ backgroundColor: statusColors[order.status] || '#6b7280' }}
        >
          {order.status}
        </span>
      </header>

      <div className={styles.grid}>
        {/* Order Info */}
        <section className={styles.card}>
          <h2>Order Details</h2>
          <dl className={styles.details}>
            <dt>Order Number</dt>
            <dd>{order.orderNumber}</dd>
            <dt>Status</dt>
            <dd>{order.status}</dd>
            <dt>Created</dt>
            <dd>{formatDate(order.createdAt)}</dd>
            <dt>Roasted</dt>
            <dd>{formatDate(order.roastedAt)}</dd>
            <dt>Shipped</dt>
            <dd>{formatDate(order.shippedAt)}</dd>
            <dt>Delivered</dt>
            <dd>{formatDate(order.deliveredAt)}</dd>
          </dl>
        </section>

        {/* Customer Info */}
        <section className={styles.card}>
          <h2>Customer</h2>
          <dl className={styles.details}>
            <dt>Name</dt>
            <dd>{order.firstName} {order.lastName}</dd>
            <dt>Email</dt>
            <dd>{order.email}</dd>
            <dt>Phone</dt>
            <dd>{order.phone || '-'}</dd>
          </dl>
        </section>

        {/* Shipping Address */}
        <section className={styles.card}>
          <h2>Shipping Address</h2>
          <address className={styles.address}>
            {order.shippingFirstName} {order.shippingLastName}<br />
            {order.shippingCompany && <>{order.shippingCompany}<br /></>}
            {order.shippingLine1}<br />
            {order.shippingLine2 && <>{order.shippingLine2}<br /></>}
            {order.shippingPostalCode} {order.shippingCity}<br />
            {order.shippingCountry}
          </address>
        </section>

        {/* Actions */}
        <section className={styles.card}>
          <h2>Actions</h2>
          <OrderActions order={order} />
        </section>
      </div>

      {/* Order Items */}
      <section className={styles.itemsCard}>
        <h2>Items</h2>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Product</th>
              <th>Variant</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id}>
                <td>{item.productName}</td>
                <td>{item.variantName || '-'}</td>
                <td>{item.quantity}</td>
                <td>{formatPrice(item.unitPrice)}</td>
                <td>{formatPrice(item.unitPrice * item.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className={styles.totals}>
          <div className={styles.totalRow}>
            <span>Subtotal</span>
            <span>{formatPrice(order.subtotal)}</span>
          </div>
          <div className={styles.totalRow}>
            <span>Shipping</span>
            <span>{formatPrice(order.shippingCost)}</span>
          </div>
          {order.discount > 0 && (
            <div className={styles.totalRow}>
              <span>Discount</span>
              <span>-{formatPrice(order.discount)}</span>
            </div>
          )}
          <div className={styles.totalRow + ' ' + styles.grandTotal}>
            <span>Total</span>
            <span>{formatPrice(order.total)}</span>
          </div>
        </div>
      </section>
    </div>
  );
}
