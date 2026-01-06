'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { useBrand } from '@/hooks/useBrand';
import { useCart } from '@/hooks/useCart';
import Navigation from '@/components/layout/Navigation';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/cart/CartDrawer';
import styles from './cart.module.css';

export default function CartPage() {
  const { brand } = useBrand();
  const locale = useLocale() as 'de' | 'en';
  const t = useTranslations('cartPage');
  const tCart = useTranslations('cart');
  const { itemsWithProducts, removeItem, updateQuantity, subtotal } = useCart();
  const [isCartOpen, setIsCartOpen] = useState(false);

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat(locale === 'de' ? 'de-DE' : 'en-US', {
      style: 'currency',
      currency: 'EUR',
    }).format(cents / 100);
  };

  const isEmpty = itemsWithProducts.length === 0;

  return (
    <div className={`theme-${brand.id}`}>
      <Navigation onCartClick={() => setIsCartOpen(true)} />

      <main className={styles.main}>
        <div className={styles.container}>
          <h1 className={styles.title}>{tCart('title')}</h1>

          {isEmpty ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <path d="M16 10a4 4 0 0 1-8 0"></path>
                </svg>
              </div>
              <h2>{tCart('empty')}</h2>
              <p>{t('emptyDescription')}</p>
              <Link href="/shop" className={styles.continueButton}>
                {tCart('continueShopping')}
              </Link>
            </div>
          ) : (
            <div className={styles.cartGrid}>
              {/* Cart Items */}
              <div className={styles.itemsSection}>
                <div className={styles.itemsList}>
                  {itemsWithProducts.map((item) => (
                    <div key={`${item.productId}-${item.variantId}`} className={styles.cartItem}>
                      <div className={styles.itemImage}>
                        {item.product.image ? (
                          <Image
                            src={item.product.image}
                            alt={item.product.name[locale]}
                            fill
                            className={styles.image}
                          />
                        ) : (
                          <div className={styles.imagePlaceholder} />
                        )}
                      </div>

                      <div className={styles.itemDetails}>
                        <div className={styles.itemHeader}>
                          <div>
                            <h3 className={styles.itemName}>{item.product.name[locale]}</h3>
                            <p className={styles.itemVariant}>{item.variant.name[locale]}</p>
                          </div>
                          <button
                            className={styles.removeButton}
                            onClick={() => removeItem(item.productId, item.variantId)}
                            aria-label={tCart('remove')}
                          >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="18" y1="6" x2="6" y2="18"></line>
                              <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                          </button>
                        </div>

                        <div className={styles.itemFooter}>
                          <div className={styles.quantityControls}>
                            <button
                              className={styles.quantityButton}
                              onClick={() => updateQuantity(item.productId, item.variantId, item.quantity - 1)}
                            >
                              −
                            </button>
                            <span className={styles.quantityValue}>{item.quantity}</span>
                            <button
                              className={styles.quantityButton}
                              onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}
                            >
                              +
                            </button>
                          </div>
                          <p className={styles.itemPrice}>{formatPrice(item.totalPrice)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div className={styles.summarySection}>
                <div className={styles.summaryCard}>
                  <h2 className={styles.summaryTitle}>{t('orderSummary')}</h2>
                  
                  <div className={styles.summaryRows}>
                    <div className={styles.summaryRow}>
                      <span>{tCart('subtotal')}</span>
                      <span>{formatPrice(subtotal)}</span>
                    </div>
                    <div className={styles.summaryRow}>
                      <span>{tCart('shipping')}</span>
                      <span className={styles.shippingNote}>{tCart('calculatedAtCheckout')}</span>
                    </div>
                  </div>

                  <div className={styles.summaryTotal}>
                    <span>{tCart('total')}</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>

                  <Link href="/checkout" className={styles.checkoutButton}>
                    {tCart('checkout')}
                  </Link>

                  <Link href="/shop" className={styles.continueLink}>
                    {tCart('continueShopping')}
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
}
