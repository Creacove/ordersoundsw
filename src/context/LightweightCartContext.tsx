import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';

interface LightweightCartItem {
    itemId: string;
    itemType: 'beat' | 'soundpack';
    licenseType: string;
    addedAt: string;
}

interface LightweightCartContextType {
    cartItems: LightweightCartItem[];
    itemCount: number;
    isInCart: (itemId: string, itemType?: 'beat' | 'soundpack') => boolean;
    addToCart: (itemId: string, licenseType?: string, itemType?: 'beat' | 'soundpack') => void;
    removeFromCart: (itemId: string, itemType?: 'beat' | 'soundpack') => void;
    clearCart: () => void;
    refreshCartFromStorage: () => void;
}

const LightweightCartContext = createContext<LightweightCartContextType | undefined>(undefined);

// Helper function to load cart from localStorage
const loadCartFromStorage = (userId: string | undefined): LightweightCartItem[] => {
    try {
        const cartKey = userId ? `cart_${userId}` : 'cart_guest';
        const stored = localStorage.getItem(cartKey);

        if (!stored) return [];

        const parsed = JSON.parse(stored);

        if (Array.isArray(parsed)) {
            return parsed.map((item: any) => {
                // Migrate old format (beatId) to new format (itemId + itemType)
                if (item.beatId && !item.itemId) {
                    return {
                        itemId: item.beatId,
                        itemType: 'beat' as const,
                        licenseType: item.licenseType || 'basic',
                        addedAt: item.addedAt || new Date().toISOString()
                    };
                }
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

// Helper to save cart to localStorage
const saveCartToStorage = (userId: string | undefined, items: LightweightCartItem[]) => {
    const cartKey = userId ? `cart_${userId}` : 'cart_guest';
    localStorage.setItem(cartKey, JSON.stringify(items));
};

export function LightweightCartProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const currentUserIdRef = useRef<string | undefined>(user?.id);

    const [cartItems, setCartItems] = useState<LightweightCartItem[]>(() => {
        return loadCartFromStorage(user?.id);
    });

    const [itemCount, setItemCount] = useState(() => {
        return loadCartFromStorage(user?.id).length;
    });

    // Reload cart when user changes
    useEffect(() => {
        if (currentUserIdRef.current === user?.id) return;

        console.log('🔄 LightweightCartContext: User changed from', currentUserIdRef.current, 'to', user?.id);
        currentUserIdRef.current = user?.id;

        const newItems = loadCartFromStorage(user?.id);
        setCartItems(newItems);
        setItemCount(newItems.length);
    }, [user?.id]);

    const refreshCartFromStorage = useCallback(() => {
        const newItems = loadCartFromStorage(user?.id);
        setCartItems(newItems);
        setItemCount(newItems.length);
    }, [user?.id]);

    const isInCart = useCallback((itemId: string, itemType: 'beat' | 'soundpack' = 'beat'): boolean => {
        return cartItems.some(item => item.itemId === itemId && item.itemType === itemType);
    }, [cartItems]);

    const addToCart = useCallback((itemId: string, licenseType: string = 'basic', itemType: 'beat' | 'soundpack' = 'beat') => {
        const guestCartEnabled = import.meta.env.VITE_ENABLE_GUEST_CART === 'true';
        if (!user && !guestCartEnabled) {
            console.log('addToCart - No user and guest cart disabled');
            return;
        }

        setCartItems(prev => {
            const existingIndex = prev.findIndex(item => item.itemId === itemId && item.itemType === itemType);

            let newItems: LightweightCartItem[];
            if (existingIndex >= 0) {
                newItems = [...prev];
                newItems[existingIndex] = { ...newItems[existingIndex], licenseType };
            } else {
                newItems = [...prev, { itemId, itemType, licenseType, addedAt: new Date().toISOString() }];
            }

            saveCartToStorage(user?.id, newItems);
            setItemCount(newItems.length);
            return newItems;
        });
    }, [user]);

    const removeFromCart = useCallback((itemId: string, itemType?: 'beat' | 'soundpack') => {
        setCartItems(prev => {
            const filtered = itemType
                ? prev.filter(item => !(item.itemId === itemId && item.itemType === itemType))
                : prev.filter(item => item.itemId !== itemId);

            saveCartToStorage(user?.id, filtered);
            setItemCount(filtered.length);
            return filtered;
        });
    }, [user]);

    const clearCart = useCallback(() => {
        const cartKey = user ? `cart_${user.id}` : 'cart_guest';
        localStorage.removeItem(cartKey);
        setCartItems([]);
        setItemCount(0);
    }, [user]);

    return (
        <LightweightCartContext.Provider value={{
            cartItems,
            itemCount,
            isInCart,
            addToCart,
            removeFromCart,
            clearCart,
            refreshCartFromStorage
        }}>
            {children}
        </LightweightCartContext.Provider>
    );
}

export function useLightweightCart() {
    const context = useContext(LightweightCartContext);
    if (!context) {
        throw new Error('useLightweightCart must be used within LightweightCartProvider');
    }
    return context;
}
