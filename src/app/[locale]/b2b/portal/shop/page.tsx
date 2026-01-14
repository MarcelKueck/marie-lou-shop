'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import styles from './shop.module.css';

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  weightGrams: number;
  brand: string;
  imageUrl: string;
  available: boolean;
}

interface CartItem {
  product: Product;
  quantity: number;
}

export default function B2BShopPage() {
  const t = useTranslations('b2b.portal');
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'coffee' | 'tea'>('all');
  const [orderSuccess, setOrderSuccess] = useState(false);
  
  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await fetch('/api/b2b/products');
        const data = await response.json();
        if (data.products) {
          setProducts(data.products);
        }
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchProducts();
  }, []);
  
  const filteredProducts = products.filter(p => {
    if (activeTab === 'all') return true;
    return p.brand === activeTab;
  });
  
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };
  
  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) {
      setCart(prev => prev.filter(item => item.product.id !== productId));
    } else {
      setCart(prev => prev.map(item =>
        item.product.id === productId
          ? { ...item, quantity }
          : item
      ));
    }
  };
  
  const cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const cartWeight = cart.reduce((sum, item) => sum + item.product.weightGrams * item.quantity, 0);
  
  // Calculate volume discount
  const cartWeightKg = cartWeight / 1000;
  let discountPercent = 0;
  if (cartWeightKg >= 50) discountPercent = 20;
  else if (cartWeightKg >= 25) discountPercent = 15;
  else if (cartWeightKg >= 10) discountPercent = 10;
  else if (cartWeightKg >= 5) discountPercent = 5;
  
  const discountAmount = Math.round(cartTotal * (discountPercent / 100));
  const finalTotal = cartTotal - discountAmount;
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount / 100);
  };
  
  const submitOrder = async () => {
    if (cart.length === 0) return;
    
    setSubmitting(true);
    try {
      const response = await fetch('/api/b2b/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map(item => ({
            productId: item.product.id,
            quantity: item.quantity,
          })),
        }),
      });
      
      if (response.ok) {
        setOrderSuccess(true);
        setCart([]);
      }
    } catch (error) {
      console.error('Order failed:', error);
    } finally {
      setSubmitting(false);
    }
  };
  
  if (orderSuccess) {
    return (
      <div className={styles.page}>
        <div className={styles.successCard}>
          <span className={styles.successIcon}>✓</span>
          <h2 className={styles.successTitle}>Order Submitted!</h2>
          <p className={styles.successText}>
            Your order has been received. You&apos;ll receive a confirmation email shortly.
          </p>
          <button 
            onClick={() => setOrderSuccess(false)} 
            className={styles.continueButton}
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t('nav.shop')}</h1>
        <p className={styles.subtitle}>Browse and order products for your office</p>
      </header>
      
      <div className={styles.content}>
        <div className={styles.productsSection}>
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${activeTab === 'all' ? styles.active : ''}`}
              onClick={() => setActiveTab('all')}
            >
              All Products
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'coffee' ? styles.active : ''}`}
              onClick={() => setActiveTab('coffee')}
            >
              ☕ Coffee
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'tea' ? styles.active : ''}`}
              onClick={() => setActiveTab('tea')}
            >
              🍵 Tea
            </button>
          </div>
          
          {loading ? (
            <div className={styles.loading}>Loading products...</div>
          ) : (
            <div className={styles.productsGrid}>
              {filteredProducts.map((product) => (
                <div key={product.id} className={styles.productCard}>
                  <div className={styles.productImage}>
                    {product.imageUrl ? (
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        style={{ objectFit: 'cover' }}
                      />
                    ) : (
                      <div className={styles.placeholderImage}>
                        {product.brand === 'coffee' ? '☕' : '🍵'}
                      </div>
                    )}
                  </div>
                  <div className={styles.productInfo}>
                    <span className={styles.productBrand}>
                      {product.brand === 'coffee' ? 'Marie Lou Coffee' : 'Marie Lou Tea'}
                    </span>
                    <h3 className={styles.productName}>{product.name}</h3>
                    <p className={styles.productWeight}>{product.weightGrams}g</p>
                    <div className={styles.productFooter}>
                      <span className={styles.productPrice}>{formatCurrency(product.price)}</span>
                      <button
                        className={styles.addButton}
                        onClick={() => addToCart(product)}
                        disabled={!product.available}
                      >
                        {product.available ? 'Add' : 'Out of Stock'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <aside className={styles.cartSection}>
          <div className={styles.cartCard}>
            <h2 className={styles.cartTitle}>Your Order</h2>
            
            {cart.length === 0 ? (
              <p className={styles.emptyCart}>Your cart is empty</p>
            ) : (
              <>
                <div className={styles.cartItems}>
                  {cart.map((item) => (
                    <div key={item.product.id} className={styles.cartItem}>
                      <div className={styles.cartItemInfo}>
                        <span className={styles.cartItemName}>{item.product.name}</span>
                        <span className={styles.cartItemPrice}>
                          {formatCurrency(item.product.price * item.quantity)}
                        </span>
                      </div>
                      <div className={styles.quantityControls}>
                        <button
                          className={styles.quantityButton}
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        >
                          −
                        </button>
                        <span className={styles.quantity}>{item.quantity}</span>
                        <button
                          className={styles.quantityButton}
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className={styles.cartSummary}>
                  <div className={styles.summaryRow}>
                    <span>Total Weight</span>
                    <span>{(cartWeight / 1000).toFixed(1)} kg</span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span>Subtotal</span>
                    <span>{formatCurrency(cartTotal)}</span>
                  </div>
                  {discountPercent > 0 && (
                    <div className={`${styles.summaryRow} ${styles.discount}`}>
                      <span>Volume Discount ({discountPercent}%)</span>
                      <span>-{formatCurrency(discountAmount)}</span>
                    </div>
                  )}
                  <div className={`${styles.summaryRow} ${styles.total}`}>
                    <span>Total</span>
                    <span>{formatCurrency(finalTotal)}</span>
                  </div>
                </div>
                
                {discountPercent === 0 && cartWeightKg < 5 && (
                  <div className={styles.discountHint}>
                    Add {(5 - cartWeightKg).toFixed(1)} kg more for 5% off!
                  </div>
                )}
                
                <button
                  className={styles.checkoutButton}
                  onClick={submitOrder}
                  disabled={submitting || cart.length === 0}
                >
                  {submitting ? 'Submitting...' : 'Submit Order'}
                </button>
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
