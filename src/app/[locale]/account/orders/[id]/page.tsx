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

interface RefundRequest {
  id: string;
  reason: string;
  reasonDetails: string | null;
  requestedAmount: number;
  approvedAmount: number | null;
  status: string;
  adminNotes: string | null;
  createdAt: string;
  reviewedAt: string | null;
  processedAt: string | null;
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
  paidAt: string | null;
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
  const [refundRequests, setRefundRequests] = useState<RefundRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isDownloadingInvoice, setIsDownloadingInvoice] = useState(false);
  
  // Refund request state
  const [showRefundForm, setShowRefundForm] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [refundReasonDetails, setRefundReasonDetails] = useState('');
  const [isSubmittingRefund, setIsSubmittingRefund] = useState(false);
  const [refundError, setRefundError] = useState<string | null>(null);
  const [refundSuccess, setRefundSuccess] = useState(false);

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

  const handleRefundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order || isSubmittingRefund || !refundReason) return;

    setIsSubmittingRefund(true);
    setRefundError(null);

    try {
      const response = await fetch(`/api/account/orders/${orderId}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: refundReason,
          reasonDetails: refundReasonDetails || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit refund request');
      }

      setRefundSuccess(true);
      setShowRefundForm(false);
      // Refresh refund requests
      fetchRefundRequests();
    } catch (err) {
      setRefundError(err instanceof Error ? err.message : 'Failed to submit refund request');
    } finally {
      setIsSubmittingRefund(false);
    }
  };

  const fetchRefundRequests = async () => {
    try {
      const response = await fetch(`/api/account/orders/${orderId}/refund`);
      if (response.ok) {
        const data = await response.json();
        setRefundRequests(data.refundRequests || []);
      }
    } catch (err) {
      console.error('Failed to fetch refund requests:', err);
    }
  };

  // Check if order is eligible for refund
  const canRequestRefund = () => {
    if (!order) return false;
    if (order.paymentStatus !== 'paid') return false;
    if (order.status === 'refunded') return false;
    
    // Check 14 day window
    const paidAt = order.paidAt || order.createdAt;
    const daysSincePaid = Math.floor((Date.now() - new Date(paidAt).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSincePaid > 14) return false;
    
    // Check if there's already a pending request
    const hasPendingRequest = refundRequests.some(r => r.status === 'pending');
    if (hasPendingRequest) return false;
    
    return true;
  };

  const getDaysRemaining = () => {
    if (!order) return 0;
    const paidAt = order.paidAt || order.createdAt;
    const daysSincePaid = Math.floor((Date.now() - new Date(paidAt).getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, 14 - daysSincePaid);
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
        
        // Also fetch refund requests
        fetchRefundRequests();
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

            {/* Refund Request Section */}
            <section className={styles.section}>
              <h2>{t('orders.refund.title') || 'Returns & Refunds'}</h2>
              
              {/* Show success message */}
              {refundSuccess && (
                <div className={styles.refundSuccess}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  <span>{t('orders.refund.submitted') || 'Your refund request has been submitted. We\'ll review it and get back to you soon.'}</span>
                </div>
              )}

              {/* Show existing refund requests */}
              {refundRequests.length > 0 && (
                <div className={styles.refundRequests}>
                  <h3>{t('orders.refund.requests') || 'Your Refund Requests'}</h3>
                  {refundRequests.map((request) => (
                    <div key={request.id} className={`${styles.refundRequest} ${styles[`refundStatus${request.status.charAt(0).toUpperCase()}${request.status.slice(1)}`]}`}>
                      <div className={styles.refundRequestHeader}>
                        <span className={`${styles.refundStatus} ${styles[`status${request.status.charAt(0).toUpperCase()}${request.status.slice(1)}`]}`}>
                          {t(`orders.refund.status.${request.status}`) || request.status}
                        </span>
                        <span className={styles.refundDate}>
                          {new Date(request.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className={styles.refundReason}>
                        <strong>{t('orders.refund.reason') || 'Reason'}:</strong> {t(`orders.refund.reasons.${request.reason}`) || request.reason}
                      </p>
                      {request.reasonDetails && (
                        <p className={styles.refundDetails}>{request.reasonDetails}</p>
                      )}
                      {request.adminNotes && request.status !== 'pending' && (
                        <p className={styles.adminNotes}>
                          <strong>{t('orders.refund.response') || 'Response'}:</strong> {request.adminNotes}
                        </p>
                      )}
                      {request.status === 'processed' && (
                        <p className={styles.refundAmount}>
                          <strong>{t('orders.refund.refunded') || 'Refunded'}:</strong> {formatCurrency(request.approvedAmount || request.requestedAmount, order.currency)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Show refund request form or button */}
              {order.status === 'refunded' ? (
                <p className={styles.refundedNote}>
                  {t('orders.refund.alreadyRefunded') || 'This order has been refunded.'}
                </p>
              ) : canRequestRefund() ? (
                <>
                  {!showRefundForm ? (
                    <div className={styles.refundInfo}>
                      <p>{t('orders.refund.eligible') || 'This order is eligible for a refund.'}</p>
                      <p className={styles.refundWindow}>
                        {t('orders.refund.daysRemaining', { days: getDaysRemaining() }) || `${getDaysRemaining()} days remaining in return window`}
                      </p>
                      <button 
                        onClick={() => setShowRefundForm(true)}
                        className={styles.requestRefundButton}
                      >
                        {t('orders.refund.requestButton') || 'Request Refund'}
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleRefundSubmit} className={styles.refundForm}>
                      <div className={styles.formGroup}>
                        <label htmlFor="refundReason">
                          {t('orders.refund.reasonLabel') || 'Reason for refund'} *
                        </label>
                        <select
                          id="refundReason"
                          value={refundReason}
                          onChange={(e) => setRefundReason(e.target.value)}
                          required
                          className={styles.select}
                        >
                          <option value="">{t('orders.refund.selectReason') || 'Select a reason...'}</option>
                          <option value="not_satisfied">{t('orders.refund.reasons.not_satisfied') || 'Not satisfied with the product'}</option>
                          <option value="damaged">{t('orders.refund.reasons.damaged') || 'Product arrived damaged'}</option>
                          <option value="wrong_item">{t('orders.refund.reasons.wrong_item') || 'Received wrong item'}</option>
                          <option value="never_arrived">{t('orders.refund.reasons.never_arrived') || 'Order never arrived'}</option>
                          <option value="changed_mind">{t('orders.refund.reasons.changed_mind') || 'Changed my mind'}</option>
                          <option value="other">{t('orders.refund.reasons.other') || 'Other'}</option>
                        </select>
                      </div>

                      <div className={styles.formGroup}>
                        <label htmlFor="refundDetails">
                          {t('orders.refund.detailsLabel') || 'Additional details (optional)'}
                        </label>
                        <textarea
                          id="refundDetails"
                          value={refundReasonDetails}
                          onChange={(e) => setRefundReasonDetails(e.target.value)}
                          placeholder={t('orders.refund.detailsPlaceholder') || 'Please provide any additional information...'}
                          rows={3}
                          className={styles.textarea}
                        />
                      </div>

                      {refundError && (
                        <p className={styles.refundError}>{refundError}</p>
                      )}

                      <div className={styles.formActions}>
                        <button 
                          type="button"
                          onClick={() => {
                            setShowRefundForm(false);
                            setRefundReason('');
                            setRefundReasonDetails('');
                            setRefundError(null);
                          }}
                          className={styles.cancelButton}
                          disabled={isSubmittingRefund}
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit"
                          className={styles.submitRefundButton}
                          disabled={isSubmittingRefund || !refundReason}
                        >
                          {isSubmittingRefund 
                            ? (t('orders.refund.submitting') || 'Submitting...') 
                            : (t('orders.refund.submit') || 'Submit Request')}
                        </button>
                      </div>
                    </form>
                  )}
                </>
              ) : (
                <p className={styles.refundNote}>
                  {refundRequests.some(r => r.status === 'pending')
                    ? (t('orders.refund.pendingNote') || 'You have a pending refund request for this order.')
                    : (t('orders.refund.notEligible') || 'This order is no longer eligible for a refund (14-day return window has passed).')}
                </p>
              )}
            </section>
          </div>
        </div>
      </main>
      
      <Footer />
    </>
  );
}
