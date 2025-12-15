
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';

interface LightweightCartItem {
  itemId: string;
  itemType: 'beat' | 'soundpack';
  licenseType: string;
  addedAt: string;
}

// Helper function to load cart from localStorage synchronously
const loadCartFromStorage = (userId: string | undefined): LightweightCartItem[] => {
  try {
    const cartKey = userId ? `cart_${userId}` : 'cart_guest';
    const stored = localStorage.getItem(cartKey);

    console.log('🔍 loadCartFromStorage - cartKey:', cartKey, 'raw stored data:', stored);

    if (!stored) {
      console.log('🔍 loadCartFromStorage - No stored data found');
      return [];
    }

    const parsed = JSON.parse(stored);
    console.log('🔍 loadCartFromStorage - Parsed data:', parsed);

    // Migrate old format (beatId) to new format (itemId + itemType)
    if (Array.isArray(parsed)) {
      const migrated = parsed.map((item: any) => {
        // Old format has beatId, new format has itemId + itemType
        if (item.beatId && !item.itemId) {
          console.log('🔍 loadCartFromStorage - Migrating old format item:', item);
          return {
            itemId: item.beatId,
            itemType: 'beat' as const,
            licenseType: item.licenseType || 'basic',
            addedAt: item.addedAt || new Date().toISOString()
          };
        }
        // New format already has itemId and itemType
        console.log('🔍 loadCartFromStorage - Loading item with itemType:', item.itemType, 'itemId:', item.itemId);
        return {
          itemId: item.itemId,
          itemType: item.itemType, // NO FALLBACK - if undefined, we want to know
          licenseType: item.licenseType || 'basic',
          addedAt: item.addedAt || new Date().toISOString()
        };
      });
      console.log('🔍 loadCartFromStorage - Migrated cart items:', migrated);
      return migrated;
    }

    console.log('🔍 loadCartFromStorage - Data is not an array, returning empty');
    return [];
  } catch (error) {
    console.error('Error loading cart from storage:', error);
    return [];
  }
};

export function useCartLightweight() {
  const { user } = useAuth();

  // Initialize with data from localStorage synchronously
  const [cartItems, setCartItems] = useState<LightweightCartItem[]>(() => {
    return loadCartFromStorage(user?.id);
  });

  const [itemCount, setItemCount] = useState(() => {
    const initialCart = loadCartFromStorage(user?.id);
    return initialCart.length;
  });

  // Update cart when user changes
  useEffect(() => {
    const newCartItems = loadCartFromStorage(user?.id);
    setCartItems(newCartItems);
    setItemCount(newCartItems.length);
  }, [user?.id]);

  // Force refresh cart data from localStorage
  const refreshCartFromStorage = useCallback(() => {
    const newCartItems = loadCartFromStorage(user?.id);
    setCartItems(newCartItems);
    setItemCount(newCartItems.length);
  }, [user?.id]);

  // Save to localStorage when cart changes
  useEffect(() => {
    if (!user) return;

    try {
      const cartKey = `cart_${user.id}`;
      console.log('💾 Saving cart to localStorage - key:', cartKey, 'items:', cartItems);
      localStorage.setItem(cartKey, JSON.stringify(cartItems));

      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('cartUpdated', {
        detail: { cartItems, itemCount: cartItems.length }
      }));
    } catch (error) {
      console.error('Error saving cart:', error);
    }
  }, [cartItems, user]);

  // Add localStorage event listener to sync across tabs/components
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (!user) return;

      const cartKey = `cart_${user.id}`;
      if (e.key === cartKey && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setCartItems(parsed);
            setItemCount(parsed.length);
          }
        } catch (error) {
          console.error('Error parsing storage change:', error);
        }
      }
    };

    const handleCartUpdated = (e: CustomEvent) => {
      console.log('⚡ cartUpdated event received:', e.detail);
      if (e.detail) {
        if (e.detail.cartItems) {
          setCartItems(e.detail.cartItems);
        }
        if (typeof e.detail.itemCount === 'number') {
          setItemCount(e.detail.itemCount);
        } else if (e.detail.cartItems) {
          setItemCount(e.detail.cartItems.length);
        } else {
          // Fallback if only signal received
          const current = loadCartFromStorage(user?.id);
          setCartItems(current);
          setItemCount(current.length);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('cartUpdated', handleCartUpdated as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('cartUpdated', handleCartUpdated as EventListener);
    };
  }, [user]);

  const isInCart = useCallback((itemId: string, itemType: 'beat' | 'soundpack' = 'beat'): boolean => {
    return cartItems.some(item => item.itemId === itemId && item.itemType === itemType);
  }, [cartItems]);

  const addToCart = useCallback((itemId: string, licenseType: string = 'basic', itemType: 'beat' | 'soundpack' = 'beat') => {
    console.log('➕ addToCart called - itemId:', itemId, 'itemType:', itemType, 'licenseType:', licenseType);

    if (!user) {
      console.log('➕ addToCart - No user, aborting');
      return;
    }

    const existingIndex = cartItems.findIndex(item => item.itemId === itemId && item.itemType === itemType);

    if (existingIndex >= 0) {
      // Update license type if item exists
      console.log('➕ addToCart - Item exists at index', existingIndex, ', updating license type');
      const updatedItems = [...cartItems];
      updatedItems[existingIndex] = {
        ...updatedItems[existingIndex],
        licenseType
      };
      console.log('➕ addToCart - Updated items:', updatedItems);
      setCartItems(updatedItems);
    } else {
      // Add new item
      const newItem: LightweightCartItem = {
        itemId,
        itemType,
        licenseType,
        addedAt: new Date().toISOString()
      };

      console.log('➕ addToCart - Adding new item:', newItem);
      const newItems = [...cartItems, newItem];
      console.log('➕ addToCart - New cart items array:', newItems);
      setCartItems(newItems);
      setItemCount(newItems.length);
    }
  }, [cartItems, user]);

  const removeFromCart = useCallback((itemId: string, itemType?: 'beat' | 'soundpack') => {
    setCartItems(prev => {
      const filtered = itemType
        ? prev.filter(item => !(item.itemId === itemId && item.itemType === itemType))
        : prev.filter(item => item.itemId !== itemId);
      setItemCount(filtered.length);
      return filtered;
    });
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
    setItemCount(0);
    if (user) {
      localStorage.removeItem(`cart_${user.id}`);
    }
  }, [user]);

  return {
    cartItems,
    itemCount,
    isInCart,
    addToCart,
    removeFromCart,
    clearCart,
    refreshCartFromStorage
  };
}
