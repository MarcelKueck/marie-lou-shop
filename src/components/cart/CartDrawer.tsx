'use client';

import { useEffect, useRef } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useCart } from '@/hooks/useCart';
import styles from './CartDrawer.module.css';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const locale = useLocale() as 'de' | 'en';
  const router = useRouter();
  const t = useTranslations('cart');
  const { items, itemsWithProducts, subtotal, removeItem, updateQuantity, clearCart, isLoading } = useCart();
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // Close when clicking outside
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(locale === 'de' ? 'de-DE' : 'en-US', {
      style: 'currency',
      currency: 'EUR',
    }).format(price / 100);
  };

  return (
    <div
      className={`${styles.overlay} ${isOpen ? styles.open : ''}`}
      onClick={handleBackdropClick}
      aria-hidden={!isOpen}
    >
      <div
        ref={drawerRef}
        className={`${styles.drawer} ${isOpen ? styles.open : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={t('title')}
      >
        <div className={styles.header}>
          <h2 className={styles.title}>{t('title')}</h2>
          <button onClick={onClose} className={styles.closeButton} aria-label={t('close')}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {items.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <path d="M16 10a4 4 0 0 1-8 0"></path>
              </svg>
            </div>
            <p>{t('empty')}</p>
          </div>
        ) : (
          <>
            <div className={styles.items}>
              {isLoading && itemsWithProducts.length === 0 ? (
                <div className={styles.loading}>
                  <p>{locale === 'de' ? 'Laden...' : 'Loading...'}</p>
                </div>
              ) : (
                itemsWithProducts.map((item) => {
                  const { product, variant } = item;
                  const unitPrice = product.basePrice + variant.priceModifier;
                  // Use rewardId for unique key if it's a free reward
                  const itemKey = item.isFreeReward && item.rewardId 
                    ? `reward-${item.rewardId}` 
                    : `${item.productId}-${item.variantId}`;

                  return (
                    <div key={itemKey} className={`${styles.item} ${item.isFreeReward ? styles.freeItem : ''}`}>
                      <div className={styles.itemImage}>
                        {product.image ? (
                          <Image src={product.image} alt={product.name[locale]} width={80} height={80} />
                        ) : (
                          <div className={styles.itemPlaceholder} />
                        )}
                        {item.isFreeReward && (
                          <span className={styles.freeBadge}>FREE</span>
                        )}
                      </div>
                      <div className={styles.itemDetails}>
                        <h3>{product.name[locale]}</h3>
                        <p className={styles.itemVariant}>{variant.name[locale]}</p>
                        <p className={styles.itemPrice}>
                          {item.isFreeReward ? (
                            <span className={styles.freePrice}>
                              <span className={styles.strikethrough}>{formatPrice(unitPrice)}</span>
                              <span className={styles.free}>{locale === 'de' ? 'Gratis' : 'Free'}</span>
                            </span>
                          ) : (
                            formatPrice(unitPrice)
                          )}
                        </p>
                      </div>
                      <div className={styles.itemActions}>
                        {!item.isFreeReward && (
                          <div className={styles.quantity}>
                            <button
                              onClick={() => updateQuantity(item.productId, item.variantId, item.quantity - 1)}
                              aria-label={t('decrease')}
                              disabled={item.quantity <= 1}
                            >
                              −
                            </button>
                            <span>{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}
                              aria-label={t('increase')}
                            >
                              +
                            </button>
                          </div>
                        )}
                        {item.isFreeReward && (
                          <span className={styles.rewardQty}>×1</span>
                        )}
                        <button
                          onClick={() => removeItem(item.productId, item.variantId, item.rewardId)}
                          className={styles.removeButton}
                          aria-label={t('remove')}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className={styles.footer}>
              <div className={styles.subtotal}>
                <span>{t('subtotal')}</span>
                <span className={styles.subtotalValue}>{formatPrice(subtotal)}</span>
              </div>
              <p className={styles.shipping}>{t('shippingNote')}</p>
              <button 
                className={`${styles.checkoutButton} btn btn-primary`}
                onClick={() => {
                  onClose();
                  router.push(`/${locale}/checkout`);
                }}
              >
                {t('checkout')}
              </button>
              <button onClick={clearCart} className={styles.clearButton}>
                {t('clear')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default CartDrawer;
