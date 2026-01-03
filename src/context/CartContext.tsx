import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Beat } from '@/types';
import { useAuth } from './AuthContext';
import { getLicensePrice } from '@/utils/licenseUtils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Define lightweight Beat type for storage
type LightweightBeat = {
  id: string;
  title: string;
  producer_id: string;
  producer_name: string;
  cover_image_url: string;
  basic_license_price_local: number;
  basic_license_price_diaspora: number;
  premium_license_price_local?: number;
  premium_license_price_diaspora?: number;
  exclusive_license_price_local?: number;
  exclusive_license_price_diaspora?: number;
  selected_license?: string;
  genre?: string;
  producer_wallet_address?: string;
};

interface CartItem {
  beat: LightweightBeat;
  added_at: string;
}

interface CartContextType {
  cartItems: CartItem[];
  totalAmount: number;
  addToCart: (beat: Beat & { selected_license?: string }) => Promise<void>;
  addMultipleToCart: (beats: Beat[]) => void;
  removeFromCart: (beatId: string) => Promise<boolean>;
  clearCart: () => void;
  isInCart: (beatId: string) => boolean;
  getCartItemCount: () => number;
  itemCount: number;
  refreshCart: () => Promise<void>;
  toggleCartItem: (beat: Beat, licenseType: string) => Promise<void>;
}

const CartContext = createContext<CartContextType>({
  cartItems: [],
  totalAmount: 0,
  addToCart: async () => { },
  addMultipleToCart: () => { },
  removeFromCart: async () => false,
  clearCart: () => { },
  isInCart: () => false,
  getCartItemCount: () => 0,
  itemCount: 0,
  refreshCart: async () => { },
  toggleCartItem: async () => { }
});

export const useCart = () => useContext(CartContext);

// Function to create a lightweight version of a beat for storage
const createLightweightBeat = (beat: Beat & { selected_license?: string }): LightweightBeat => {
  // Get the wallet address from producer object first (if available), then from users object
  const walletAddress =
    beat.producer?.wallet_address ||
    beat.users?.wallet_address ||
    undefined;

  return {
    id: beat.id,
    title: beat.title,
    producer_id: beat.producer_id,
    producer_name: beat.producer_name,
    cover_image_url: beat.cover_image_url,
    basic_license_price_local: beat.basic_license_price_local || 0,
    basic_license_price_diaspora: beat.basic_license_price_diaspora || 0,
    premium_license_price_local: beat.premium_license_price_local,
    premium_license_price_diaspora: beat.premium_license_price_diaspora,
    exclusive_license_price_local: beat.exclusive_license_price_local,
    exclusive_license_price_diaspora: beat.exclusive_license_price_diaspora,
    selected_license: beat.selected_license || 'basic',
    genre: beat.genre,
    producer_wallet_address: walletAddress
  };
};

// Helper to safely save to localStorage
const safeLocalStorageSave = (key: string, value: any) => {
  try {
    const stringValue = JSON.stringify(value);
    localStorage.setItem(key, stringValue);
    return true;
  } catch (error) {
    console.error("Error saving to localStorage:", error);
    return false;
  }
};

// Helper to safely get from localStorage
const safeLocalStorageGet = (key: string) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error("Error reading from localStorage:", error);
    return null;
  }
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loadingCart, setLoadingCart] = useState(false);
  const { user, currency } = useAuth();
  const [totalAmount, setTotalAmount] = useState(0);
  const [itemCount, setItemCount] = useState(0);
  const [initComplete, setInitComplete] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Track user ID to prevent cart reload on user object reference changes
  const previousUserIdRef = React.useRef<string | undefined>(undefined);

  // Load cart from localStorage - only when user ID changes, not on every user object update
  useEffect(() => {
    const currentUserId = user?.id;
    
    // Skip if user ID hasn't changed (prevents reload on wallet sync, etc.)
    if (previousUserIdRef.current === currentUserId && initComplete) {
      return;
    }
    
    previousUserIdRef.current = currentUserId;
    
    const loadCart = () => {
      if (!currentUserId) {
        setCartItems([]);
        setItemCount(0);
        setInitComplete(true);
        return;
      }

      try {
        setLoadingCart(true);
        const savedCart = safeLocalStorageGet(`cart_${currentUserId}`);

        if (savedCart && Array.isArray(savedCart)) {
          // Filter out any malformed cart items
          const validCartItems = savedCart.filter(item =>
            item && item.beat && typeof item.beat === 'object' && item.beat.id
          );
          setCartItems(validCartItems);
          setItemCount(validCartItems.length);
        } else {
          setCartItems([]);
          setItemCount(0);
        }
      } catch (error) {
        console.error("Error loading cart:", error);
        setCartItems([]);
        setItemCount(0);
      } finally {
        setLoadingCart(false);
        setInitComplete(true);
      }
    };

    loadCart();
  }, [user?.id, initComplete]);

  // Calculate total amount when cart or currency changes
  useEffect(() => {
    if (cartItems.length === 0) {
      setTotalAmount(0);
      setItemCount(0);
      return;
    }

    setItemCount(cartItems.length);

    const newTotal = cartItems.reduce((total, item) => {
      // Add null checks to prevent undefined errors
      if (!item || !item.beat) {
        console.warn('Invalid cart item found:', item);
        return total;
      }

      const licenseType = item.beat.selected_license || 'basic';
      const price = getLicensePrice(item.beat as any, licenseType, currency === 'USD');
      return total + price;
    }, 0);

    setTotalAmount(newTotal);
  }, [cartItems, currency]);

  // Save cart to localStorage when it changes
  useEffect(() => {
    if (!initComplete || !user || loadingCart) return;

    const saveCart = () => {
      if (cartItems.length > 0) {
        const success = safeLocalStorageSave(`cart_${user.id}`, cartItems);

        if (!success && cartItems.length > 5) {
          // If storage fails, try with a reduced cart
          const reducedCart = cartItems.slice(0, 5);
          safeLocalStorageSave(`cart_${user.id}`, reducedCart);
          setCartItems(reducedCart);
          toast.warning("Cart was limited to 5 items due to storage constraints");
        }
      } else {
        // Clear cart in localStorage when cart is empty
        localStorage.removeItem(`cart_${user.id}`);
      }

      // Dispatch event to notify other components immediately (same-tab sync)
      window.dispatchEvent(new CustomEvent('cartUpdated', {
        detail: { cartItems, itemCount: cartItems.length }
      }));
    };

    saveCart();
  }, [cartItems, user, loadingCart, initComplete]);

  const addToCart = async (beat: Beat & { selected_license?: string }) => {
    if (!user) {
      toast.error("Please log in to add items to cart");
      return;
    }

    // Basic validation
    if (!beat || !beat.id) {
      toast.error("Invalid beat information");
      return;
    }

    const existingItem = cartItems.find(item => item.beat.id === beat.id);
    const lightweightBeat = createLightweightBeat(beat);

    try {
      if (existingItem) {
        if (existingItem.beat.selected_license !== beat.selected_license) {
          // Update existing item with new license
          const updatedItems = cartItems.map(item =>
            item.beat.id === beat.id
              ? { ...item, beat: { ...lightweightBeat } }
              : item
          );
          setCartItems(updatedItems);
        }
      } else {
        // Check if cart is getting too large
        if (cartItems.length >= 20) {
          toast.warning("Maximum cart size reached (20 items)");
          return;
        }

        // Add new item to cart
        const newItem = {
          beat: lightweightBeat,
          added_at: new Date().toISOString()
        };

        setCartItems(prev => [...prev, newItem]);
        toast.success("Added to cart");
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error("Failed to add item to cart");
    }
  };

  const addMultipleToCart = useCallback((beats: Beat[]) => {
    if (!user) {
      toast.error("Please log in to add items to cart");
      return;
    }

    // Basic validation
    if (!beats || !Array.isArray(beats) || beats.length === 0) {
      toast.error("No valid beats to add");
      return;
    }

    const now = new Date().toISOString();
    const newItems: CartItem[] = [];

    // Limit to prevent storage issues
    const availableSlots = Math.max(0, 20 - cartItems.length);

    beats.slice(0, availableSlots).forEach(beat => {
      if (!cartItems.some(item => item.beat.id === beat.id)) {
        newItems.push({
          beat: createLightweightBeat({ ...beat, selected_license: 'basic' }),
          added_at: now
        });
      }
    });

    if (newItems.length > 0) {
      setCartItems(prev => [...prev, ...newItems]);
      toast.success(`Added ${newItems.length} beat${newItems.length > 1 ? 's' : ''} to cart`);
    } else if (beats.length > availableSlots) {
      toast.info('Cart limit reached. Some beats could not be added.');
    } else {
      toast.info('All selected beats are already in your cart');
    }
  }, [cartItems, user]);

  const removeFromCart = async (beatId: string): Promise<boolean> => {
    if (!beatId) {
      return false;
    }

    try {
      setCartItems(prev => prev.filter(item => item.beat.id !== beatId));
      return true;
    } catch (error) {
      console.error("Error removing from cart:", error);
      toast.error("Failed to remove item from cart");
      return false;
    }
  };

  const clearCart = useCallback(() => {
    try {
      setCartItems([]);

      // Clear from localStorage
      if (user) {
        localStorage.removeItem(`cart_${user.id}`);
      }
    } catch (error) {
      console.error("Error clearing cart:", error);
      toast.error("Failed to clear cart");
    }
  }, [user]);

  const isInCart = useCallback((beatId: string): boolean => {
    return cartItems.some(item => item.beat.id === beatId);
  }, [cartItems]);

  const getCartItemCount = useCallback((): number => {
    return cartItems.length;
  }, [cartItems]);

  const refreshCart = async () => {
    if (!user) return;
    if (cartItems.length === 0) return;

    // Prevent multiple concurrent refreshes
    if (isRefreshing) {
      console.log('Cart refresh already in progress, skipping...');
      return;
    }

    setIsRefreshing(true);
    setLoadingCart(true);

    try {
      console.log('Starting cart refresh...');

      // Check if beats still exist (with timeout)
      const beatIds = cartItems.map(item => item.beat.id);
      const producerIds = cartItems.map(item => item.beat.producer_id);

      // Create promise with timeout for beat validation
      const beatCheckPromise = async () => {
        try {
          const response = await supabase
            .from('beats')
            .select('id')
            .in('id', beatIds);

          const existingBeats = response?.data || [];
          console.log(`Beat check: ${existingBeats.length}/${beatIds.length} beats still exist`);

          return {
            existingIds: existingBeats.map(beat => beat.id)
          };
        } catch (err) {
          console.warn('Beat check failed, keeping all beats:', err);
          return { existingIds: beatIds };
        }
      };

      // Create promise with timeout for wallet addresses
      const walletCheckPromise = async () => {
        try {
          const response = await supabase
            .from('users')
            .select('id, wallet_address')
            .in('id', producerIds);

          const producerData = response?.data || [];
          console.log(`Wallet check: Retrieved data for ${producerData.length}/${producerIds.length} producers`);

          // Create wallet address map
          const walletAddressMap: { [key: string]: string | null } = {};
          producerData.forEach(producer => {
            walletAddressMap[producer.id] = producer.wallet_address;
          });

          return { walletAddressMap };
        } catch (err) {
          console.warn('Wallet check failed, returning empty map:', err);
          return { walletAddressMap: {} };
        }
      };

      // Set timeout for entire operation
      const timeoutPromise = new Promise<'timeout'>((resolve) => {
        setTimeout(() => {
          console.log('Cart refresh timed out after 3 seconds');
          resolve('timeout');
        }, 3000);
      });

      // Race the promises and handle the result properly - FIX: Handle timeout case correctly
      const result = await Promise.race([
        Promise.all([beatCheckPromise(), walletCheckPromise()]),
        timeoutPromise
      ]);

      let existingIds: string[];
      let walletAddressMap: { [key: string]: string | null };

      if (result === 'timeout') {
        console.log('Cart refresh timed out, keeping existing data');
        existingIds = beatIds;
        walletAddressMap = {};
      } else {
        // FIX: Properly handle the array result from Promise.all
        const [beatCheck, walletCheck] = result;
        existingIds = beatCheck.existingIds;
        walletAddressMap = walletCheck.walletAddressMap;
      }

      // Update cart items
      let updatedCart = cartItems;

      // Remove beats that no longer exist
      if (existingIds.length !== beatIds.length) {
        updatedCart = cartItems.filter(item => existingIds.includes(item.beat.id));

        const removedCount = cartItems.length - updatedCart.length;
        if (removedCount > 0) {
          console.log(`Removed ${removedCount} unavailable items from cart`);
          toast.info(`Removed ${removedCount} unavailable item${removedCount !== 1 ? 's' : ''} from your cart.`);
        }
      }

      // Update wallet addresses
      const cartWithUpdatedWallets = updatedCart.map(item => ({
        ...item,
        beat: {
          ...item.beat,
          producer_wallet_address: walletAddressMap[item.beat.producer_id] || item.beat.producer_wallet_address
        }
      }));

      setCartItems(cartWithUpdatedWallets);

      if (user) {
        safeLocalStorageSave(`cart_${user.id}`, cartWithUpdatedWallets);
      }

      console.log('Cart refresh completed successfully');
    } catch (err) {
      console.error('Error during cart refresh:', err);
      // Don't show error toast to avoid spam
    } finally {
      setLoadingCart(false);
      setIsRefreshing(false);
    }
  };

  const toggleCartItem = async (beat: Beat, licenseType: string) => {
    if (!user) {
      toast.error('Please log in to add items to cart');
      return;
    }

    const isItemInCart = isInCart(beat.id);

    try {
      if (isItemInCart) {
        await removeFromCart(beat.id);
      } else {
        const beatWithLicense = {
          ...beat,
          selected_license: licenseType
        };
        await addToCart(beatWithLicense);
      }
    } catch (error) {
      console.error("Error toggling cart item:", error);
      toast.error("Failed to update cart");
    }
  };

  const contextValue = {
    cartItems,
    addToCart,
    addMultipleToCart,
    removeFromCart,
    clearCart,
    totalAmount,
    refreshCart,
    isInCart,
    getCartItemCount,
    itemCount,
    toggleCartItem
  };

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
};

export default CartProvider;
