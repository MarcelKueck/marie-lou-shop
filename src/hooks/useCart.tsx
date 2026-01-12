'use client';

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from 'react';
import { CartItem, CartItemWithProduct } from '@/lib/products';

interface CartState {
  items: CartItem[];
  isOpen: boolean;
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM'; payload: { productId: string; variantId: string; rewardId?: string } }
  | { type: 'UPDATE_QUANTITY'; payload: { productId: string; variantId: string; quantity: number; rewardId?: string } }
  | { type: 'CLEAR_CART' }
  | { type: 'SET_CART'; payload: CartItem[] }
  | { type: 'OPEN_CART' }
  | { type: 'CLOSE_CART' }
  | { type: 'TOGGLE_CART' };

// Product type for DB products in cart cache
interface DbProduct {
  id: string;
  slug: string;
  brand: 'coffee' | 'tea';
  active?: boolean;
  name: { en: string; de: string };
  origin?: { en: string | null; de: string | null } | null;
  notes?: { en: string | null; de: string | null } | null;
  description?: { en: string | null; de: string | null } | null;
  basePrice: number;
  currency?: string;
  image?: string | null;
  badge?: string | null;
  variants: {
    id: string;
    name: { en: string; de: string };
    priceModifier: number;
    weight?: string | null;
  }[];
}

interface CartContextValue {
  items: CartItem[];
  itemsWithProducts: CartItemWithProduct[];
  isOpen: boolean;
  itemCount: number;
  subtotal: number;
  isLoading: boolean;
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, variantId: string, rewardId?: string) => void;
  updateQuantity: (productId: string, variantId: string, quantity: number, rewardId?: string) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

const CART_STORAGE_KEY = 'marie-lou-cart';

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      // Free reward items should never be combined with regular items
      // They are tracked separately by rewardId
      if (action.payload.isFreeReward) {
        // Check if this specific reward is already in cart
        const existingRewardIndex = state.items.findIndex(
          (item) =>
            item.isFreeReward &&
            item.rewardId === action.payload.rewardId
        );
        
        if (existingRewardIndex >= 0) {
          // Reward already claimed, don't add again
          return state;
        }
        
        // Add as new item (free rewards are always separate)
        return { ...state, items: [...state.items, action.payload] };
      }
      
      // For regular items, find existing non-reward item with same product/variant
      const existingIndex = state.items.findIndex(
        (item) =>
          !item.isFreeReward &&
          item.productId === action.payload.productId &&
          item.variantId === action.payload.variantId
      );

      if (existingIndex >= 0) {
        const newItems = [...state.items];
        newItems[existingIndex] = {
          ...newItems[existingIndex],
          quantity: newItems[existingIndex].quantity + action.payload.quantity,
        };
        return { ...state, items: newItems };
      }

      return { ...state, items: [...state.items, action.payload] };
    }

    case 'REMOVE_ITEM': {
      const { productId, variantId, rewardId } = action.payload;
      
      return {
        ...state,
        items: state.items.filter((item) => {
          // If rewardId is specified, only remove that specific reward item
          if (rewardId) {
            return !(item.rewardId === rewardId);
          }
          // Otherwise, remove the non-reward item with matching product/variant
          return !(
            !item.isFreeReward &&
            item.productId === productId &&
            item.variantId === variantId
          );
        }),
      };
    }

    case 'UPDATE_QUANTITY': {
      const { productId, variantId, quantity, rewardId } = action.payload;
      
      if (quantity <= 0) {
        return {
          ...state,
          items: state.items.filter((item) => {
            if (rewardId) {
              return !(item.rewardId === rewardId);
            }
            return !(
              !item.isFreeReward &&
              item.productId === productId &&
              item.variantId === variantId
            );
          }),
        };
      }

      return {
        ...state,
        items: state.items.map((item) => {
          // If rewardId specified, only update that reward item
          if (rewardId) {
            return item.rewardId === rewardId
              ? { ...item, quantity }
              : item;
          }
          // Otherwise update the non-reward item
          return (!item.isFreeReward &&
            item.productId === productId &&
            item.variantId === variantId)
            ? { ...item, quantity }
            : item;
        }),
      };
    }

    case 'CLEAR_CART':
      return { ...state, items: [] };

    case 'SET_CART':
      return { ...state, items: action.payload };

    case 'OPEN_CART':
      return { ...state, isOpen: true };

    case 'CLOSE_CART':
      return { ...state, isOpen: false };

    case 'TOGGLE_CART':
      return { ...state, isOpen: !state.isOpen };

    default:
      return state;
  }
}

interface CartProviderProps {
  children: ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    isOpen: false,
  });
  const [productsCache, setProductsCache] = useState<Map<string, DbProduct>>(new Map());
  const [isLoading, setIsLoading] = useState(false);

  // Fetch products for cart items
  useEffect(() => {
    async function fetchCartProducts() {
      if (state.items.length === 0) {
        return;
      }
      
      const productIds = [...new Set(state.items.map(item => item.productId))];
      
      setIsLoading(true);
      try {
        // Fetch all products and filter to find the ones we need
        const res = await fetch('/api/products');
        if (res.ok) {
          const data = await res.json();
          const newCache = new Map<string, DbProduct>();
          for (const product of data.products) {
            if (productIds.includes(product.id)) {
              newCache.set(product.id, product);
            }
          }
          setProductsCache(newCache);
        }
      } catch (error) {
        console.error('Failed to fetch cart products:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchCartProducts();
  }, [state.items]);

  // Load cart from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        try {
          const items = JSON.parse(stored);
          dispatch({ type: 'SET_CART', payload: items });
        } catch (e) {
          console.error('Failed to parse cart from localStorage:', e);
        }
      }
    }
  }, []);

  // Save cart to localStorage when items change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.items));
    }
  }, [state.items]);

  const addItem = useCallback((item: CartItem) => {
    dispatch({ type: 'ADD_ITEM', payload: item });
  }, []);

  const removeItem = useCallback((productId: string, variantId: string, rewardId?: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { productId, variantId, rewardId } });
  }, []);

  const updateQuantity = useCallback(
    (productId: string, variantId: string, quantity: number, rewardId?: string) => {
      dispatch({ type: 'UPDATE_QUANTITY', payload: { productId, variantId, quantity, rewardId } });
    },
    []
  );

  const clearCart = useCallback(() => {
    dispatch({ type: 'CLEAR_CART' });
  }, []);

  const openCart = useCallback(() => {
    dispatch({ type: 'OPEN_CART' });
  }, []);

  const closeCart = useCallback(() => {
    dispatch({ type: 'CLOSE_CART' });
  }, []);

  const toggleCart = useCallback(() => {
    dispatch({ type: 'TOGGLE_CART' });
  }, []);

  // Calculate items with product details from cache
  const itemsWithProducts = state.items
    .map((item) => {
      const product = productsCache.get(item.productId);
      if (!product) return null;

      const variant = product.variants.find((v) => v.id === item.variantId);
      if (!variant) return null;

      const unitPrice = product.basePrice + variant.priceModifier;
      const totalPrice = unitPrice * item.quantity;

      // Convert DB product to expected format
      const productForCart = {
        id: product.id,
        slug: product.slug,
        brand: product.brand,
        active: product.active ?? true,
        name: product.name,
        origin: product.origin,
        notes: product.notes,
        description: product.description,
        basePrice: product.basePrice,
        currency: 'EUR' as const,
        image: product.image,
        badge: product.badge,
        variants: product.variants.map((v) => ({
          id: v.id,
          sku: '',
          name: v.name,
          priceModifier: v.priceModifier,
          weight: v.weight || '250g',
        })),
      };

      const variantForCart = {
        id: variant.id,
        sku: '',
        name: variant.name,
        priceModifier: variant.priceModifier,
        weight: variant.weight || '250g',
      };

      return {
        ...item,
        product: productForCart,
        variant: variantForCart,
        totalPrice,
      } as CartItemWithProduct;
    })
    .filter((item): item is CartItemWithProduct => item !== null);

  const itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);

  // Subtotal excludes free reward items
  const subtotal = itemsWithProducts.reduce((sum, item) => {
    if (item.isFreeReward) return sum;
    return sum + item.totalPrice;
  }, 0);

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        itemsWithProducts,
        isOpen: state.isOpen,
        itemCount,
        subtotal,
        isLoading,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        openCart,
        closeCart,
        toggleCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
