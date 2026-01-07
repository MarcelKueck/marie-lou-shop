'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import Navigation from '@/components/layout/Navigation';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/cart/CartDrawer';
import styles from './orderDetails.module.css';

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface OrderDetails {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  total: number;
  subtotal: number;
  shippingCost: number;
  currency: string;
  createdAt: string;
  shippedAt: string | null;
  deliveredAt: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  shippingAddress: {
    firstName: string;
    lastName: string;
    company: string | null;
    line1: string;
    line2: string | null;
    city: string;
    state: string | null;
    postalCode: string;
    country: string;
  } | null;
  items: OrderItem[];
}

export default function OrderDetailsPage() {
  const t = useTranslations('account');
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isDownloadingInvoice, setIsDownloadingInvoice] = useState(false);

  const handleDownloadInvoice = async () => {
    if (!order || isDownloadingInvoice) return;
    
    setIsDownloadingInvoice(true);
    try {
      const response = await fetch(`/api/account/orders/${orderId}/invoice`);
      if (!response.ok) {
        throw new Error('Failed to download invoice');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `RE-${order.orderNumber.replace('ML', '')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Invoice download error:', err);
      alert(t('orders.invoiceError') || 'Failed to download invoice');
    } finally {
      setIsDownloadingInvoice(false);
    }
  };

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await fetch(`/api/account/orders/${orderId}`);
        if (response.status === 401) {
          router.push('/account/login');
          return;
        }
        if (response.status === 404) {
          setError('Order not found');
          setIsLoading(false);
          return;
        }
        if (!response.ok) {
          setError('Failed to load order');
          setIsLoading(false);
          return;
        }
        const data = await response.json();
        setOrder({ ...data.order, items: data.items });
      } catch (err) {
        console.error('Failed to fetch order:', err);
        setError('Failed to load order');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (orderId) {
      fetchOrder();
    }
  }, [orderId, router]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const getStatusClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered': return styles.statusDelivered;
      case 'shipped': return styles.statusShipped;
      case 'processing': return styles.statusProcessing;
      case 'paid': return styles.statusPaid;
      default: return styles.statusPending;
    }
  };

  if (isLoading) {
    return (
      <>
        <Navigation onCartClick={() => setIsCartOpen(true)} />
        <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
        <main className={styles.page}>
          <div className={styles.container}>
            <div className={styles.loading}>{t('loading')}</div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (error || !order) {
    return (
      <>
        <Navigation onCartClick={() => setIsCartOpen(true)} />
        <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
        <main className={styles.page}>
          <div className={styles.container}>
            <div className={styles.error}>
              <h1>{error || 'Order not found'}</h1>
              <Link href="/account" className={styles.backLink}>
                ← {t('backToAccount') || 'Back to Account'}
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navigation onCartClick={() => setIsCartOpen(true)} />
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      
      <main className={styles.page}>
        <div className={styles.container}>
          <Link href="/account" className={styles.backLink}>
            ← {t('backToAccount') || 'Back to Account'}
          </Link>
          
          <div className={styles.header}>
            <div className={styles.headerMain}>
              <h1>{t('orders.orderNumber') || 'Order'} #{order.orderNumber}</h1>
              <span className={`${styles.status} ${getStatusClass(order.status)}`}>
                {t(`orders.status.${order.status.toLowerCase()}`) || order.status}
              </span>
            </div>
            <div className={styles.headerMeta}>
              <p className={styles.orderDate}>
                {t('orders.placedOn') || 'Placed on'} {formatDate(order.createdAt)}
              </p>
              {order.paymentStatus === 'paid' && (
                <button 
                  className={styles.invoiceButton}
                  onClick={handleDownloadInvoice}
                  disabled={isDownloadingInvoice}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="12" y1="18" x2="12" y2="12" />
                    <line x1="9" y1="15" x2="12" y2="18" />
                    <line x1="15" y1="15" x2="12" y2="18" />
                  </svg>
                  {isDownloadingInvoice 
                    ? (t('orders.downloadingInvoice') || 'Downloading...') 
                    : (t('orders.downloadInvoice') || 'Download Invoice')}
                </button>
              )}
            </div>
          </div>

          <div className={styles.content}>
            {/* Order Items */}
            <section className={styles.section}>
              <h2>{t('orders.items') || 'Items'}</h2>
              <div className={styles.itemsList}>
                {order.items.map((item) => (
                  <div key={item.id} className={styles.item}>
                    <div className={styles.itemInfo}>
                      <span className={styles.itemName}>{item.productName}</span>
                      <span className={styles.itemQuantity}>× {item.quantity}</span>
                    </div>
                    <span className={styles.itemPrice}>
                      {formatCurrency(item.totalPrice, order.currency)}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* Order Summary */}
            <section className={styles.section}>
              <h2>{t('orders.summary') || 'Summary'}</h2>
              <div className={styles.summary}>
                <div className={styles.summaryRow}>
                  <span>{t('orders.subtotal') || 'Subtotal'}</span>
                  <span>{formatCurrency(order.subtotal, order.currency)}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span>{t('orders.shipping') || 'Shipping'}</span>
                  <span>
                    {order.shippingCost === 0 
                      ? (t('orders.freeShipping') || 'Free') 
                      : formatCurrency(order.shippingCost, order.currency)}
                  </span>
                </div>
                <div className={`${styles.summaryRow} ${styles.summaryTotal}`}>
                  <span>{t('orders.total') || 'Total'}</span>
                  <span>{formatCurrency(order.total, order.currency)}</span>
                </div>
              </div>
            </section>

            {/* Shipping Address */}
            {order.shippingAddress && (
              <section className={styles.section}>
                <h2>{t('orders.shippingAddress') || 'Shipping Address'}</h2>
                <address className={styles.address}>
                  <p>{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
                  {order.shippingAddress.company && <p>{order.shippingAddress.company}</p>}
                  <p>{order.shippingAddress.line1}</p>
                  {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
                  <p>{order.shippingAddress.postalCode} {order.shippingAddress.city}</p>
                  {order.shippingAddress.state && <p>{order.shippingAddress.state}</p>}
                  <p>{order.shippingAddress.country}</p>
                </address>
              </section>
            )}

            {/* Tracking Info */}
            {(order.trackingNumber || order.shippedAt || order.deliveredAt) && (
              <section className={styles.section}>
                <h2>{t('orders.tracking') || 'Tracking'}</h2>
                <div className={styles.tracking}>
                  {order.shippedAt && (
                    <p>
                      <strong>{t('orders.shippedOn') || 'Shipped on'}:</strong>{' '}
                      {formatDate(order.shippedAt)}
                    </p>
                  )}
                  {order.deliveredAt && (
                    <p>
                      <strong>{t('orders.deliveredOn') || 'Delivered on'}:</strong>{' '}
                      {formatDate(order.deliveredAt)}
                    </p>
                  )}
                  {order.trackingNumber && (
                    <p>
                      <strong>{t('orders.trackingNumber') || 'Tracking number'}:</strong>{' '}
                      {order.trackingUrl ? (
                        <a 
                          href={order.trackingUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className={styles.trackingLink}
                        >
                          {order.trackingNumber}
                        </a>
                      ) : (
                        order.trackingNumber
                      )}
                    </p>
                  )}
                </div>
              </section>
            )}
          </div>
        </div>
      </main>
      
      <Footer />
    </>
  );
}
