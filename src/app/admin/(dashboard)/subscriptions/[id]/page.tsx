import { db } from '@/db';
import { subscriptions, customers } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import styles from '../../page.module.css';
import subscriptionStyles from '../subscriptions.module.css';
import SubscriptionActions from './SubscriptionActions';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminSubscriptionDetailPage({ params }: PageProps) {
  const { id } = await params;
  
  const [subscription] = await db.select({
    id: subscriptions.id,
    customerId: subscriptions.customerId,
    stripeSubscriptionId: subscriptions.stripeSubscriptionId,
    stripeCustomerId: subscriptions.stripeCustomerId,
    productId: subscriptions.productId,
    variantId: subscriptions.variantId,
    productName: subscriptions.productName,
    variantName: subscriptions.variantName,
    intervalCount: subscriptions.intervalCount,
    intervalUnit: subscriptions.intervalUnit,
    unitPrice: subscriptions.unitPrice,
    quantity: subscriptions.quantity,
    shippingFirstName: subscriptions.shippingFirstName,
    shippingLastName: subscriptions.shippingLastName,
    shippingLine1: subscriptions.shippingLine1,
    shippingLine2: subscriptions.shippingLine2,
    shippingCity: subscriptions.shippingCity,
    shippingPostalCode: subscriptions.shippingPostalCode,
    shippingCountry: subscriptions.shippingCountry,
    status: subscriptions.status,
    nextDeliveryAt: subscriptions.nextDeliveryAt,
    createdAt: subscriptions.createdAt,
    updatedAt: subscriptions.updatedAt,
    cancelledAt: subscriptions.cancelledAt,
    pausedAt: subscriptions.pausedAt,
    pauseUntil: subscriptions.pauseUntil,
    customerEmail: customers.email,
    customerFirstName: customers.firstName,
    customerLastName: customers.lastName,
    customerPhone: customers.phone,
  })
    .from(subscriptions)
    .leftJoin(customers, eq(subscriptions.customerId, customers.id))
    .where(eq(subscriptions.id, id))
    .limit(1);

  if (!subscription) {
    notFound();
  }

  const formatPrice = (cents: number) => `€${(cents / 100).toFixed(2)}`;
  const formatDate = (date: Date | null) => date ? new Date(date).toLocaleDateString('de-DE') : '—';
  
  const getIntervalLabel = (count: number, unit: string) => {
    if (unit === 'week') {
      return count === 1 ? 'Every week' : `Every ${count} weeks`;
    }
    return count === 1 ? 'Every month' : `Every ${count} months`;
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'active': return 'active';
      case 'paused': return 'paused';
      case 'cancelled': return 'cancelled';
      default: return '';
    }
  };

  return (
    <div className={`${styles.container} ${subscriptionStyles.detailContainer}`}>
      <Link href="/admin/subscriptions" className={subscriptionStyles.backLink}>
        ← Back to Subscriptions
      </Link>
      
      <div className={subscriptionStyles.detailHeader}>
        <div className={subscriptionStyles.headerInfo}>
          <h1>{subscription.productName}</h1>
          <p className={subscriptionStyles.subscriptionId}>ID: {subscription.id}</p>
        </div>
        <span className={`${subscriptionStyles.headerStatus} ${subscriptionStyles[getStatusClass(subscription.status)]}`}>
          {subscription.status}
        </span>
      </div>

      <div className={subscriptionStyles.detailGrid}>
        {/* Customer Info */}
        <div className={subscriptionStyles.detailCard}>
          <h3>Customer</h3>
          <div className={subscriptionStyles.detailRow}>
            <span className={subscriptionStyles.detailLabel}>Name</span>
            <span className={subscriptionStyles.detailValue}>
              {subscription.customerFirstName} {subscription.customerLastName}
            </span>
          </div>
          <div className={subscriptionStyles.detailRow}>
            <span className={subscriptionStyles.detailLabel}>Email</span>
            <span className={subscriptionStyles.detailValue}>{subscription.customerEmail}</span>
          </div>
          {subscription.customerPhone && (
            <div className={subscriptionStyles.detailRow}>
              <span className={subscriptionStyles.detailLabel}>Phone</span>
              <span className={subscriptionStyles.detailValue}>{subscription.customerPhone}</span>
            </div>
          )}
          <div className={subscriptionStyles.detailRow}>
            <span className={subscriptionStyles.detailLabel}>Customer ID</span>
            <Link href={`/admin/customers/${subscription.customerId}`} className={subscriptionStyles.stripeLink}>
              {subscription.customerId.slice(0, 8)}...
            </Link>
          </div>
        </div>

        {/* Product Info */}
        <div className={subscriptionStyles.detailCard}>
          <h3>Product</h3>
          <div className={subscriptionStyles.detailRow}>
            <span className={subscriptionStyles.detailLabel}>Product</span>
            <span className={subscriptionStyles.detailValue}>{subscription.productName}</span>
          </div>
          <div className={subscriptionStyles.detailRow}>
            <span className={subscriptionStyles.detailLabel}>Variant</span>
            <span className={subscriptionStyles.detailValue}>{subscription.variantName}</span>
          </div>
          <div className={subscriptionStyles.detailRow}>
            <span className={subscriptionStyles.detailLabel}>Quantity</span>
            <span className={subscriptionStyles.detailValue}>{subscription.quantity}</span>
          </div>
          <div className={subscriptionStyles.detailRow}>
            <span className={subscriptionStyles.detailLabel}>Unit Price</span>
            <span className={subscriptionStyles.detailValue}>{formatPrice(subscription.unitPrice)}</span>
          </div>
        </div>

        {/* Subscription Details */}
        <div className={subscriptionStyles.detailCard}>
          <h3>Subscription Details</h3>
          <div className={subscriptionStyles.detailRow}>
            <span className={subscriptionStyles.detailLabel}>Frequency</span>
            <span className={subscriptionStyles.detailValue}>
              {getIntervalLabel(subscription.intervalCount, subscription.intervalUnit)}
            </span>
          </div>
          <div className={subscriptionStyles.detailRow}>
            <span className={subscriptionStyles.detailLabel}>Price per Delivery</span>
            <span className={subscriptionStyles.detailValue}>
              {formatPrice(subscription.unitPrice * subscription.quantity)}
            </span>
          </div>
          <div className={subscriptionStyles.detailRow}>
            <span className={subscriptionStyles.detailLabel}>Next Delivery</span>
            <span className={subscriptionStyles.detailValue}>{formatDate(subscription.nextDeliveryAt)}</span>
          </div>
          <div className={subscriptionStyles.detailRow}>
            <span className={subscriptionStyles.detailLabel}>Created</span>
            <span className={subscriptionStyles.detailValue}>{formatDate(subscription.createdAt)}</span>
          </div>
          {subscription.pausedAt && (
            <div className={subscriptionStyles.detailRow}>
              <span className={subscriptionStyles.detailLabel}>Paused At</span>
              <span className={subscriptionStyles.detailValue}>{formatDate(subscription.pausedAt)}</span>
            </div>
          )}
          {subscription.cancelledAt && (
            <div className={subscriptionStyles.detailRow}>
              <span className={subscriptionStyles.detailLabel}>Cancelled At</span>
              <span className={subscriptionStyles.detailValue}>{formatDate(subscription.cancelledAt)}</span>
            </div>
          )}
        </div>

        {/* Shipping Address */}
        <div className={subscriptionStyles.detailCard}>
          <h3>Shipping Address</h3>
          <div className={subscriptionStyles.detailRow}>
            <span className={subscriptionStyles.detailLabel}>Name</span>
            <span className={subscriptionStyles.detailValue}>
              {subscription.shippingFirstName} {subscription.shippingLastName}
            </span>
          </div>
          <div className={subscriptionStyles.detailRow}>
            <span className={subscriptionStyles.detailLabel}>Address</span>
            <span className={subscriptionStyles.detailValue}>
              {subscription.shippingLine1}
              {subscription.shippingLine2 && `, ${subscription.shippingLine2}`}
            </span>
          </div>
          <div className={subscriptionStyles.detailRow}>
            <span className={subscriptionStyles.detailLabel}>City</span>
            <span className={subscriptionStyles.detailValue}>
              {subscription.shippingPostalCode} {subscription.shippingCity}
            </span>
          </div>
          <div className={subscriptionStyles.detailRow}>
            <span className={subscriptionStyles.detailLabel}>Country</span>
            <span className={subscriptionStyles.detailValue}>{subscription.shippingCountry}</span>
          </div>
        </div>
      </div>

      {/* Stripe Info */}
      {subscription.stripeSubscriptionId && (
        <div className={subscriptionStyles.detailCard} style={{ marginBottom: '1.5rem' }}>
          <h3>Stripe</h3>
          <div className={subscriptionStyles.detailRow}>
            <span className={subscriptionStyles.detailLabel}>Subscription ID</span>
            <a 
              href={`https://dashboard.stripe.com/subscriptions/${subscription.stripeSubscriptionId}`}
              target="_blank"
              rel="noopener noreferrer"
              className={subscriptionStyles.stripeLink}
            >
              {subscription.stripeSubscriptionId}
            </a>
          </div>
          {subscription.stripeCustomerId && (
            <div className={subscriptionStyles.detailRow}>
              <span className={subscriptionStyles.detailLabel}>Customer ID</span>
              <a 
                href={`https://dashboard.stripe.com/customers/${subscription.stripeCustomerId}`}
                target="_blank"
                rel="noopener noreferrer"
                className={subscriptionStyles.stripeLink}
              >
                {subscription.stripeCustomerId}
              </a>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <SubscriptionActions 
        subscriptionId={subscription.id}
        currentStatus={subscription.status}
      />
    </div>
  );
}
