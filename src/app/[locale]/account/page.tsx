'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { generateShareLink } from '@/lib/referral';
import { useCart } from '@/hooks/useCart';
import Navigation from '@/components/layout/Navigation';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/cart/CartDrawer';
import styles from './account.module.css';

interface OrderData {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  total: number;
  currency: string;
  createdAt: string;
  shippedAt: string | null;
  deliveredAt: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
}

interface PendingReward {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  variantId: string;
  variantName: string;
  createdAt: string;
  expiresAt: string | null;
}

interface PurchasedGiftCard {
  id: string;
  code: string;
  amount: number;
  balance: number;
  currency: string;
  status: string;
  recipientEmail: string | null;
  recipientName: string | null;
  personalMessage: string | null;
  deliveryMethod: string;
  createdAt: string;
  activatedAt: string | null;
}

interface Subscription {
  id: string;
  productName: string;
  variantName: string;
  quantity: number;
  unitPrice: number;
  intervalCount: number;
  intervalUnit: string;
  status: string;
  nextDeliveryAt: string | null;
  shippingFirstName: string;
  shippingLastName: string;
  shippingLine1: string;
  shippingCity: string;
  shippingPostalCode: string;
  shippingCountry: string;
}

interface ReviewRequest {
  id: string;
  productId: string;
  productName: string;
  productImage: string | null;
  orderNumber: string;
  token: string;
  status: 'pending' | 'reviewed';
  rewardCode: string | null;
  rewardAmount: number;
  createdAt: string;
  expiresAt: string;
  reviewedAt: string | null;
}

interface UserData {
  customer: {
    id: string;
    email: string;
    name: string | null;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
    createdAt: string;
  };
  referral: {
    code: string;
    discountPercent: number;
    isActive: boolean;
  } | null;
  stats: {
    totalReferrals: number;
    completedReferrals: number;
    totalRewardsEarned: number;
    pendingRewards: number;
  };
  orders: OrderData[];
}

type TabType = 'orders' | 'subscriptions' | 'reviews' | 'giftCards' | 'profile' | 'referrals';

export default function AccountPage() {
  const t = useTranslations('account');
  const tSub = useTranslations('subscriptions');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addItem, openCart } = useCart();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [pendingRewards, setPendingRewards] = useState<PendingReward[]>([]);
  const [purchasedGiftCards, setPurchasedGiftCards] = useState<PurchasedGiftCard[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [reviewRequests, setReviewRequests] = useState<ReviewRequest[]>([]);
  const [subscriptionsLoading, setSubscriptionsLoading] = useState(false);
  const [subscriptionActionLoading, setSubscriptionActionLoading] = useState<string | null>(null);
  const [subscriptionError, setSubscriptionError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [copiedGiftCardId, setCopiedGiftCardId] = useState<string | null>(null);
  const [copiedRewardCode, setCopiedRewardCode] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('orders');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [claimingRewardId, setClaimingRewardId] = useState<string | null>(null);

  // Handle tab query parameter
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['orders', 'subscriptions', 'reviews', 'giftCards', 'profile', 'referrals'].includes(tabParam)) {
      setActiveTab(tabParam as TabType);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (!response.ok) {
          router.push('/account/login');
          return;
        }
        const data = await response.json();
        setUserData(data);
        
        // Fetch pending rewards
        const rewardsResponse = await fetch('/api/referral/rewards');
        if (rewardsResponse.ok) {
          const rewardsData = await rewardsResponse.json();
          setPendingRewards(rewardsData.pendingRewards || []);
        }
        
        // Fetch purchased gift cards
        const giftCardsResponse = await fetch('/api/gift-cards/my-purchases');
        if (giftCardsResponse.ok) {
          const giftCardsData = await giftCardsResponse.json();
          setPurchasedGiftCards(giftCardsData.giftCards || []);
        }
        
        // Fetch subscriptions
        const subscriptionsResponse = await fetch('/api/subscriptions');
        if (subscriptionsResponse.ok) {
          const subscriptionsData = await subscriptionsResponse.json();
          setSubscriptions(subscriptionsData.subscriptions || []);
        }
        
        // Fetch review requests
        const reviewsResponse = await fetch('/api/account/reviews');
        if (reviewsResponse.ok) {
          const reviewsData = await reviewsResponse.json();
          setReviewRequests(reviewsData.reviewRequests || []);
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
        router.push('/account/login');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserData();
  }, [router]);

  const fetchSubscriptions = async () => {
    setSubscriptionsLoading(true);
    try {
      const response = await fetch('/api/subscriptions');
      if (response.ok) {
        const data = await response.json();
        setSubscriptions(data.subscriptions || []);
      }
    } catch {
      setSubscriptionError('Could not load subscriptions');
    } finally {
      setSubscriptionsLoading(false);
    }
  };

  const handleSubscriptionAction = async (subscriptionId: string, action: string, data?: object) => {
    setSubscriptionActionLoading(subscriptionId);
    setSubscriptionError('');

    try {
      const response = await fetch('/api/subscriptions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId, action, ...data }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Action failed');
      }

      await fetchSubscriptions();
    } catch (err) {
      setSubscriptionError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubscriptionActionLoading(null);
    }
  };

  const getIntervalLabel = (count: number, unit: string) => {
    if (unit === 'week') {
      return count === 1 ? tSub('everyWeek') : tSub('everyNWeeks', { n: count });
    }
    return count === 1 ? tSub('everyMonth') : tSub('everyNMonths', { n: count });
  };

  const getSubscriptionStatusBadge = (status: string) => {
    const statusConfig: Record<string, { className: string; label: string }> = {
      active: { className: styles.statusActive, label: tSub('statusActive') },
      paused: { className: styles.statusPaused, label: tSub('statusPaused') },
      cancelled: { className: styles.statusCancelled, label: tSub('statusCancelled') },
      past_due: { className: styles.statusWarning, label: tSub('statusPastDue') },
    };
    const config = statusConfig[status] || statusConfig.active;
    return <span className={config.className}>{config.label}</span>;
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const copyReferralLink = async () => {
    if (!userData?.referral) return;
    
    const link = generateShareLink(userData.referral.code);
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClaimReward = async (reward: PendingReward) => {
    setClaimingRewardId(reward.id);
    try {
      // Verify the reward is still available
      const response = await fetch('/api/referral/rewards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rewardId: reward.id,
          action: 'add_to_cart',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || t('referral.claimError'));
        return;
      }

      // Add the free product to cart
      addItem({
        productId: reward.productId,
        variantId: reward.variantId,
        quantity: 1,
        isFreeReward: true,
        rewardId: reward.id,
      });

      // Remove from pending rewards in UI
      setPendingRewards(prev => prev.filter(r => r.id !== reward.id));
      
      // Open cart to show the added item
      openCart();
    } catch (error) {
      console.error('Failed to claim reward:', error);
      alert(t('referral.claimError'));
    } finally {
      setClaimingRewardId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatPrice = (cents: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency,
    }).format(cents / 100);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return styles.statusDelivered;
      case 'shipped': return styles.statusShipped;
      case 'processing': return styles.statusProcessing;
      case 'paid': return styles.statusPaid;
      case 'pending': return styles.statusPending;
      case 'cancelled': return styles.statusCancelled;
      default: return '';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: t('orders.status.pending'),
      paid: t('orders.status.paid'),
      processing: t('orders.status.processing'),
      shipped: t('orders.status.shipped'),
      delivered: t('orders.status.delivered'),
      cancelled: t('orders.status.cancelled'),
    };
    return labels[status] || status;
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

  if (!userData) {
    return null;
  }

  const shareLink = userData.referral 
    ? generateShareLink(userData.referral.code)
    : '';

  return (
    <>
      <Navigation onCartClick={() => setIsCartOpen(true)} />
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      <main className={styles.page}>
        <div className={styles.container}>
          <div className={styles.header}>
            <div className={styles.userInfo}>
              <h1 className={styles.title}>{t('title')}</h1>
              <p className={styles.welcome}>
                {t('welcome', { name: userData.customer.firstName || userData.customer.email })}
              </p>
            </div>
            <button onClick={handleLogout} className={styles.logoutButton}>
              {t('logout')}
            </button>
          </div>

          <div className={styles.tabs}>
            <button 
              className={`${styles.tab} ${activeTab === 'orders' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('orders')}
            >
              {t('tabs.orders')}
            </button>
            <button 
              className={`${styles.tab} ${activeTab === 'subscriptions' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('subscriptions')}
            >
              {t('tabs.subscriptions')}
            </button>
            <button 
              className={`${styles.tab} ${activeTab === 'reviews' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('reviews')}
            >
              {t('tabs.reviews')}
              {reviewRequests.filter(r => r.status === 'pending').length > 0 && (
                <span className={styles.tabBadge}>
                  {reviewRequests.filter(r => r.status === 'pending').length}
                </span>
              )}
            </button>
            <button 
              className={`${styles.tab} ${activeTab === 'giftCards' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('giftCards')}
            >
              {t('tabs.giftCards')}
            </button>
            <button 
              className={`${styles.tab} ${activeTab === 'profile' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              {t('tabs.profile')}
            </button>
            <button 
              className={`${styles.tab} ${activeTab === 'referrals' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('referrals')}
            >
              {t('tabs.referrals')}
            </button>
          </div>

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div className={styles.content}>
              {userData.orders.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>📦</div>
                  <h3>{t('orders.empty')}</h3>
                  <p>{t('orders.emptyDescription')}</p>
                  <Link href="/shop" className={styles.shopButton}>
                    {t('orders.shopNow')}
                  </Link>
                </div>
              ) : (
                <div className={styles.ordersList}>
                  {userData.orders.map((order) => (
                    <div key={order.id} className={styles.orderCard}>
                      <div className={styles.orderHeader}>
                        <div className={styles.orderInfo}>
                          <span className={styles.orderNumber}>
                            {t('orders.orderNumber', { number: order.orderNumber })}
                          </span>
                          <span className={styles.orderDate}>
                            {formatDate(order.createdAt)}
                          </span>
                        </div>
                        <span className={`${styles.orderStatus} ${getStatusColor(order.status)}`}>
                          {getStatusLabel(order.status)}
                        </span>
                      </div>
                      <div className={styles.orderDetails}>
                        <div className={styles.orderTotal}>
                          <span className={styles.totalLabel}>{t('orders.total')}</span>
                          <span className={styles.totalValue}>
                            {formatPrice(order.total, order.currency)}
                          </span>
                        </div>
                        {order.trackingNumber && (
                          <div className={styles.tracking}>
                            <span className={styles.trackingLabel}>{t('orders.tracking')}</span>
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
                              <span>{order.trackingNumber}</span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className={styles.orderActions}>
                        <Link 
                          href={`/account/orders/${order.id}`} 
                          className={styles.viewOrderButton}
                        >
                          {t('orders.viewDetails')}
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Subscriptions Tab */}
          {activeTab === 'subscriptions' && (
            <div className={styles.content}>
              {subscriptionError && <div className={styles.error}>{subscriptionError}</div>}
              
              {subscriptionsLoading ? (
                <div className={styles.loading}>{tSub('loading')}</div>
              ) : subscriptions.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>🔄</div>
                  <h3>{tSub('noSubscriptions')}</h3>
                  <p>{tSub('noSubscriptionsDesc')}</p>
                  <Link href="/shop" className={styles.shopButton}>
                    {tSub('browseProducts')}
                  </Link>
                </div>
              ) : (
                <div className={styles.subscriptionsList}>
                  {subscriptions.map((sub) => (
                    <div key={sub.id} className={styles.subscriptionCard}>
                      <div className={styles.subscriptionHeader}>
                        <div>
                          <h3 className={styles.subscriptionProductName}>{sub.productName}</h3>
                          <p className={styles.subscriptionVariantName}>{sub.variantName} × {sub.quantity}</p>
                        </div>
                        {getSubscriptionStatusBadge(sub.status)}
                      </div>

                      <div className={styles.subscriptionDetails}>
                        <div className={styles.subscriptionDetailRow}>
                          <span>{tSub('price')}</span>
                          <span>{formatPrice(sub.unitPrice * sub.quantity)}</span>
                        </div>
                        <div className={styles.subscriptionDetailRow}>
                          <span>{tSub('frequency')}</span>
                          <span>{getIntervalLabel(sub.intervalCount, sub.intervalUnit)}</span>
                        </div>
                        <div className={styles.subscriptionDetailRow}>
                          <span>{tSub('nextDelivery')}</span>
                          <span>{sub.nextDeliveryAt ? new Date(sub.nextDeliveryAt).toLocaleDateString('de-DE') : '-'}</span>
                        </div>
                        <div className={styles.subscriptionDetailRow}>
                          <span>{tSub('shippingTo')}</span>
                          <span>
                            {sub.shippingFirstName} {sub.shippingLastName}, {sub.shippingCity}
                          </span>
                        </div>
                      </div>

                      <div className={styles.subscriptionActions}>
                        {sub.status === 'active' && (
                          <>
                            <button
                              onClick={() => handleSubscriptionAction(sub.id, 'pause')}
                              disabled={subscriptionActionLoading === sub.id}
                              className={styles.secondaryButton}
                            >
                              {tSub('pause')}
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(tSub('confirmCancel'))) {
                                  handleSubscriptionAction(sub.id, 'cancel');
                                }
                              }}
                              disabled={subscriptionActionLoading === sub.id}
                              className={styles.dangerButton}
                            >
                              {tSub('cancel')}
                            </button>
                          </>
                        )}
                        {sub.status === 'paused' && (
                          <button
                            onClick={() => handleSubscriptionAction(sub.id, 'resume')}
                            disabled={subscriptionActionLoading === sub.id}
                            className={styles.primaryButton}
                          >
                            {tSub('resume')}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Reviews Tab */}
          {activeTab === 'reviews' && (
            <div className={styles.content}>
              {reviewRequests.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>⭐</div>
                  <h3>{t('reviews.empty')}</h3>
                  <p>{t('reviews.emptyDescription')}</p>
                </div>
              ) : (
                <>
                  {/* Pending Reviews */}
                  {reviewRequests.filter(r => r.status === 'pending').length > 0 && (
                    <div className={styles.reviewSection}>
                      <h3 className={styles.sectionTitle}>{t('reviews.pendingTitle')}</h3>
                      <p className={styles.sectionDescription}>{t('reviews.pendingDescription')}</p>
                      <div className={styles.reviewRequestsList}>
                        {reviewRequests.filter(r => r.status === 'pending').map((request) => (
                          <div key={request.id} className={styles.reviewRequestCard}>
                            <div className={styles.reviewRequestInfo}>
                              <h4>{request.productName}</h4>
                              <p className={styles.orderNumber}>{t('reviews.order')} #{request.orderNumber}</p>
                              <p className={styles.rewardBanner}>
                                🎁 {t('reviews.earnReward', { amount: `€${(request.rewardAmount / 100).toFixed(2)}` })}
                              </p>
                            </div>
                            <div className={styles.reviewRequestActions}>
                              <Link 
                                href={`/review/${request.token}`}
                                className={styles.primaryButton}
                              >
                                {t('reviews.writeReview')}
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Completed Reviews with Rewards */}
                  {reviewRequests.filter(r => r.status === 'reviewed').length > 0 && (
                    <div className={styles.reviewSection}>
                      <h3 className={styles.sectionTitle}>{t('reviews.completedTitle')}</h3>
                      <div className={styles.reviewRequestsList}>
                        {reviewRequests.filter(r => r.status === 'reviewed').map((request) => (
                          <div key={request.id} className={styles.reviewRequestCard}>
                            <div className={styles.reviewRequestInfo}>
                              <h4>{request.productName}</h4>
                              <p className={styles.orderNumber}>{t('reviews.order')} #{request.orderNumber}</p>
                              <p className={styles.reviewedDate}>
                                {t('reviews.reviewedOn')} {new Date(request.reviewedAt!).toLocaleDateString('de-DE')}
                              </p>
                            </div>
                            {request.rewardCode && (
                              <div className={styles.rewardCodeBox}>
                                <span className={styles.rewardLabel}>{t('reviews.yourReward')}</span>
                                <div className={styles.codeWrapper}>
                                  <span className={styles.rewardCode}>{request.rewardCode}</span>
                                  <button
                                    className={styles.copyButton}
                                    onClick={() => {
                                      navigator.clipboard.writeText(request.rewardCode!);
                                      setCopiedRewardCode(request.id);
                                      setTimeout(() => setCopiedRewardCode(null), 2000);
                                    }}
                                  >
                                    {copiedRewardCode === request.id ? '✓' : t('reviews.copy')}
                                  </button>
                                </div>
                                <span className={styles.rewardAmount}>
                                  €{(request.rewardAmount / 100).toFixed(2)} {t('reviews.discount')}
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Gift Cards Tab */}
          {activeTab === 'giftCards' && (
            <div className={styles.content}>
              {purchasedGiftCards.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>🎁</div>
                  <h3>{t('purchasedGiftCards.empty')}</h3>
                  <p>{t('purchasedGiftCards.emptyDescription')}</p>
                  <Link href="/shop/gift-card" className={styles.shopButton}>
                    {t('purchasedGiftCards.buyGiftCard')}
                  </Link>
                </div>
              ) : (
                <div className={styles.giftCardsList}>
                  {purchasedGiftCards.map((giftCard) => (
                    <div key={giftCard.id} className={styles.giftCardCard}>
                      <div className={styles.giftCardHeader}>
                        <div className={styles.giftCardInfo}>
                          <span className={styles.giftCardCode}>{giftCard.code}</span>
                          <span className={styles.giftCardDate}>
                            {t('purchasedGiftCards.purchasedOn')} {formatDate(giftCard.createdAt)}
                          </span>
                        </div>
                        <span className={`${styles.giftCardStatus} ${
                          giftCard.status === 'active' && giftCard.balance > 0 
                            ? styles.statusActive 
                            : giftCard.balance === 0 
                              ? styles.statusUsed 
                              : styles.statusDisabled
                        }`}>
                          {giftCard.status === 'active' && giftCard.balance > 0 
                            ? t('purchasedGiftCards.statusActive')
                            : giftCard.balance === 0
                              ? t('purchasedGiftCards.statusUsed')
                              : t('purchasedGiftCards.statusDisabled')}
                        </span>
                      </div>
                      <div className={styles.giftCardDetails}>
                        <div className={styles.giftCardAmount}>
                          <span className={styles.amountLabel}>{t('purchasedGiftCards.amount')}</span>
                          <span className={styles.amountValue}>
                            {formatPrice(giftCard.amount, giftCard.currency)}
                          </span>
                        </div>
                        <div className={styles.giftCardBalance}>
                          <span className={styles.balanceLabel}>{t('purchasedGiftCards.balance')}</span>
                          <span className={styles.balanceValue}>
                            {formatPrice(giftCard.balance, giftCard.currency)}
                          </span>
                        </div>
                      </div>
                      {giftCard.recipientEmail && (
                        <div className={styles.giftCardRecipient}>
                          <span className={styles.recipientLabel}>{t('purchasedGiftCards.sentTo')}</span>
                          <span className={styles.recipientValue}>
                            {giftCard.recipientName ? `${giftCard.recipientName} (${giftCard.recipientEmail})` : giftCard.recipientEmail}
                          </span>
                        </div>
                      )}
                      {giftCard.deliveryMethod === 'download' && (
                        <div className={styles.giftCardRecipient}>
                          <span className={styles.recipientValue}>
                            {t('purchasedGiftCards.downloadedPdf')}
                          </span>
                        </div>
                      )}
                      <div className={styles.giftCardActions}>
                        <button
                          onClick={async () => {
                            await navigator.clipboard.writeText(giftCard.code);
                            setCopiedGiftCardId(giftCard.id);
                            setTimeout(() => setCopiedGiftCardId(null), 2000);
                          }}
                          className={styles.copyCodeButton}
                        >
                          {copiedGiftCardId === giftCard.id ? t('purchasedGiftCards.copied') : t('purchasedGiftCards.copyCode')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className={styles.content}>
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>{t('profile.title')}</h2>
                <div className={styles.profileCard}>
                  <div className={styles.profileField}>
                    <span className={styles.label}>{t('profile.email')}</span>
                    <span className={styles.value}>{userData.customer.email}</span>
                  </div>
                  {userData.customer.firstName && (
                    <div className={styles.profileField}>
                      <span className={styles.label}>{t('profile.name')}</span>
                      <span className={styles.value}>
                        {userData.customer.firstName} {userData.customer.lastName}
                      </span>
                    </div>
                  )}
                  {userData.customer.phone && (
                    <div className={styles.profileField}>
                      <span className={styles.label}>{t('profile.phone')}</span>
                      <span className={styles.value}>{userData.customer.phone}</span>
                    </div>
                  )}
                  <div className={styles.profileField}>
                    <span className={styles.label}>{t('profile.memberSince')}</span>
                    <span className={styles.value}>{formatDate(userData.customer.createdAt)}</span>
                  </div>
                </div>
              </section>

              {userData.referral && (
                <section className={styles.section}>
                  <h2 className={styles.sectionTitle}>{t('referral.quickStats')}</h2>
                  <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                      <span className={styles.statValue}>{userData.stats.completedReferrals}</span>
                      <span className={styles.statLabel}>{t('referral.successfulReferrals')}</span>
                    </div>
                    <div className={styles.statCard}>
                      <span className={styles.statValue}>{userData.stats.totalRewardsEarned}</span>
                      <span className={styles.statLabel}>{t('referral.freeBagsEarned')}</span>
                    </div>
                  </div>
                </section>
              )}
            </div>
          )}

          {/* Referrals Tab */}
          {activeTab === 'referrals' && (
            <div className={styles.content}>
              {userData.referral ? (
                <>
                  <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>{t('referral.yourCode')}</h2>
                    <div className={styles.referralCodeCard}>
                      <div className={styles.codeDisplay}>
                        <span className={styles.codeLabel}>{t('referral.shareCode')}</span>
                        <span className={styles.code}>{userData.referral.code}</span>
                      </div>
                      <div className={styles.discount}>
                        {t('referral.friendsGet', { percent: userData.referral.discountPercent })}
                      </div>
                    </div>
                  </section>

                  <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>{t('referral.shareLink')}</h2>
                    <div className={styles.shareLinkBox}>
                      <input 
                        type="text" 
                        value={shareLink} 
                        readOnly 
                        className={styles.linkInput}
                      />
                      <button onClick={copyReferralLink} className={styles.copyButton}>
                        {copied ? t('referral.copied') : t('referral.copy')}
                      </button>
                    </div>
                  </section>

                  <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>{t('referral.stats')}</h2>
                    <div className={styles.statsGrid}>
                      <div className={styles.statCard}>
                        <span className={styles.statValue}>{userData.stats.totalReferrals}</span>
                        <span className={styles.statLabel}>{t('referral.totalClicks')}</span>
                      </div>
                      <div className={styles.statCard}>
                        <span className={styles.statValue}>{userData.stats.completedReferrals}</span>
                        <span className={styles.statLabel}>{t('referral.successfulReferrals')}</span>
                      </div>
                      <div className={styles.statCard}>
                        <span className={styles.statValue}>{userData.stats.totalRewardsEarned}</span>
                        <span className={styles.statLabel}>{t('referral.freeBagsEarned')}</span>
                      </div>
                      <div className={styles.statCard}>
                        <span className={styles.statValue}>{userData.stats.pendingRewards}</span>
                        <span className={styles.statLabel}>{t('referral.pendingRewards')}</span>
                      </div>
                    </div>
                  </section>

                  {/* Pending Rewards Section */}
                  {pendingRewards.length > 0 && (
                    <section className={styles.section}>
                      <h2 className={styles.sectionTitle}>🎁 {t('referral.yourRewards')}</h2>
                      <div className={styles.rewardsList}>
                        {pendingRewards.map((reward) => (
                          <div key={reward.id} className={styles.rewardCard}>
                            <div className={styles.rewardInfo}>
                              <span className={styles.rewardIcon}>☕</span>
                              <div className={styles.rewardDetails}>
                                <span className={styles.rewardName}>
                                  {t('referral.freeBag')}: {reward.productName}
                                </span>
                                <span className={styles.rewardVariant}>{reward.variantName}</span>
                              </div>
                            </div>
                            <button
                              onClick={() => handleClaimReward(reward)}
                              disabled={claimingRewardId === reward.id}
                              className={styles.claimButton}
                            >
                              {claimingRewardId === reward.id
                                ? t('referral.claiming')
                                : t('referral.addToCart')}
                            </button>
                          </div>
                        ))}
                      </div>
                      <p className={styles.rewardHint}>
                        {t('referral.rewardHint')}
                      </p>
                    </section>
                  )}

                  <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>{t('referral.howItWorks')}</h2>
                    <div className={styles.howItWorks}>
                      <div className={styles.step}>
                        <span className={styles.stepNumber}>1</span>
                        <p>{t('referral.step1')}</p>
                      </div>
                      <div className={styles.step}>
                        <span className={styles.stepNumber}>2</span>
                        <p>{t('referral.step2')}</p>
                      </div>
                      <div className={styles.step}>
                        <span className={styles.stepNumber}>3</span>
                        <p>{t('referral.step3')}</p>
                      </div>
                    </div>
                  </section>
                </>
              ) : (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>🎁</div>
                  <h3>{t('referral.noCodeTitle')}</h3>
                  <p>{t('referral.noCode')}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
