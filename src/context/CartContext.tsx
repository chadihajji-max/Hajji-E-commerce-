import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, Product } from '../types';
import { useToast } from './ToastContext';
import { useLanguage } from './LanguageContext';

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity?: number, selectedSize?: string, selectedColor?: string) => void;
  removeItem: (productId: string, selectedSize?: string) => void;
  updateQuantity: (productId: string, quantity: number, selectedSize?: string) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  totalItemsCount: number;
  subtotal: number;
  freeShippingThreshold: number;
  remainingForFreeShipping: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'aura_cart_v1';
const FREE_SHIPPING_THRESHOLD = 75.00;

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const { showToast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (err) {
      console.error('Failed to sync cart:', err);
    }
  }, [items]);

  const addItem = (
    product: Product, 
    quantity = 1, 
    selectedSize?: string, 
    selectedColor?: string
  ) => {
    if (product.is_shein_affiliate) {
      showToast('SHEIN affiliate products redirect to external destination', 'info');
      if (product.shein_affiliate_url) {
        window.open(product.shein_affiliate_url, '_blank', 'noopener,noreferrer');
      }
      return;
    }

    setItems((prev) => {
      const matchIndex = prev.findIndex(
        (i) => i.product.id === product.id && i.selectedSize === selectedSize
      );

      if (matchIndex > -1) {
        const next = [...prev];
        const existing = next[matchIndex];
        const newQty = existing.quantity + quantity;
        next[matchIndex] = { ...existing, quantity: newQty };
        return next;
      } else {
        return [...prev, { product, quantity, selectedSize, selectedColor }];
      }
    });

    showToast(t('itemAdded'), 'success');
  };

  const removeItem = (productId: string, selectedSize?: string) => {
    setItems((prev) => 
      prev.filter((i) => !(i.product.id === productId && i.selectedSize === selectedSize))
    );
    showToast(t('itemRemoved'), 'info');
  };

  const updateQuantity = (productId: string, quantity: number, selectedSize?: string) => {
    if (quantity <= 0) {
      removeItem(productId, selectedSize);
      return;
    }

    setItems((prev) =>
      prev.map((item) => {
        if (item.product.id === productId && item.selectedSize === selectedSize) {
          return { ...item, quantity };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItemsCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = Number(items.reduce((acc, item) => acc + item.product.price * item.quantity, 0).toFixed(2));
  const remainingForFreeShipping = Math.max(0, Number((FREE_SHIPPING_THRESHOLD - subtotal).toFixed(2)));

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        totalItemsCount,
        subtotal,
        freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
        remainingForFreeShipping,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
