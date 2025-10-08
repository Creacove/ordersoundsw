
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
    
    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);
    
    // Migrate old format (beatId) to new format (itemId + itemType)
    if (Array.isArray(parsed)) {
      return parsed.map((item: any) => {
        // Old format has beatId, new format has itemId + itemType
        if (item.beatId && !item.itemId) {
          return {
            itemId: item.beatId,
            itemType: 'beat' as const,
            licenseType: item.licenseType || 'basic',
            addedAt: item.addedAt || new Date().toISOString()
          };
        }
        // New format already has itemId and itemType
        return {
          itemId: item.itemId,
          itemType: item.itemType || 'beat',
          licenseType: item.licenseType || 'basic',
          addedAt: item.addedAt || new Date().toISOString()
        };
      });
    }
    
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

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [user]);

  const isInCart = useCallback((itemId: string, itemType: 'beat' | 'soundpack' = 'beat'): boolean => {
    return cartItems.some(item => item.itemId === itemId && item.itemType === itemType);
  }, [cartItems]);

  const addToCart = useCallback((itemId: string, licenseType: string = 'basic', itemType: 'beat' | 'soundpack' = 'beat') => {
    if (!user) {
      return;
    }
    
    const existingIndex = cartItems.findIndex(item => item.itemId === itemId && item.itemType === itemType);
    
    if (existingIndex >= 0) {
      // Update license type if item exists
      const updatedItems = [...cartItems];
      updatedItems[existingIndex] = {
        ...updatedItems[existingIndex],
        licenseType
      };
      setCartItems(updatedItems);
    } else {
      // Add new item
      const newItem: LightweightCartItem = {
        itemId,
        itemType,
        licenseType,
        addedAt: new Date().toISOString()
      };
      
      const newItems = [...cartItems, newItem];
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
