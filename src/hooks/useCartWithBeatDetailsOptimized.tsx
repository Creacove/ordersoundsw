
import { useState, useEffect, useMemo } from 'react';
import { useCartLightweight } from './useCartLightweight';
import { supabase } from '@/integrations/supabase/client';
import { Beat } from '@/types';
import { useAuth } from '@/context/AuthContext';

interface CartItemWithDetails {
  itemId: string;
  itemType: 'beat' | 'soundpack';
  licenseType: string;
  addedAt: string;
  beat?: Beat;
  soundpack?: any;
}

interface CachedBeatData {
  beat: Beat;
  cachedAt: number;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const CACHE_KEY = 'cart_beat_details_cache';

// Helper to get cached beat data
const getCachedBeatData = (beatId: string): Beat | null => {
  try {
    const cache = sessionStorage.getItem(CACHE_KEY);
    if (!cache) return null;
    
    const parsed = JSON.parse(cache);
    const cachedData: CachedBeatData = parsed[beatId];
    
    if (!cachedData) return null;
    
    // Check if cache is still valid
    if (Date.now() - cachedData.cachedAt > CACHE_DURATION) {
      return null;
    }
    
    return cachedData.beat;
  } catch {
    return null;
  }
};

// Helper to cache beat data
const cacheBeatData = (beatId: string, beat: Beat) => {
  try {
    const cache = sessionStorage.getItem(CACHE_KEY);
    const parsed = cache ? JSON.parse(cache) : {};
    
    parsed[beatId] = {
      beat,
      cachedAt: Date.now()
    };
    
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(parsed));
  } catch {
    // Silent fail
  }
};

export function useCartWithBeatDetailsOptimized() {
  const { cartItems: lightweightItems, itemCount, removeFromCart, clearCart, addToCart, refreshCartFromStorage } = useCartLightweight();
  const [cartItemsWithDetails, setCartItemsWithDetails] = useState<CartItemWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { currency } = useAuth();

  // Calculate total amount using memoization with currency consideration
  const totalAmount = useMemo(() => {
    return cartItemsWithDetails.reduce((total, item) => {
      let price = 0;
      
      if (item.itemType === 'beat' && item.beat) {
        const licenseType = item.licenseType;
        
        if (currency === 'NGN') {
          if (licenseType === 'basic') price = item.beat.basic_license_price_local || 0;
          else if (licenseType === 'premium') price = item.beat.premium_license_price_local || 0;
          else if (licenseType === 'exclusive') price = item.beat.exclusive_license_price_local || 0;
          else if (licenseType === 'custom') price = item.beat.custom_license_price_local || 0;
        } else {
          if (licenseType === 'basic') price = item.beat.basic_license_price_diaspora || 0;
          else if (licenseType === 'premium') price = item.beat.premium_license_price_diaspora || 0;
          else if (licenseType === 'exclusive') price = item.beat.exclusive_license_price_diaspora || 0;
          else if (licenseType === 'custom') price = item.beat.custom_license_price_diaspora || 0;
        }
      } else if (item.itemType === 'soundpack' && item.soundpack) {
        const licenseType = item.licenseType;
        
        if (currency === 'NGN') {
          if (licenseType === 'basic') price = item.soundpack.basic_license_price_local || 0;
          else if (licenseType === 'premium') price = item.soundpack.premium_license_price_local || 0;
          else if (licenseType === 'exclusive') price = item.soundpack.exclusive_license_price_local || 0;
          else if (licenseType === 'custom') price = item.soundpack.custom_license_price_local || 0;
        } else {
          if (licenseType === 'basic') price = item.soundpack.basic_license_price_diaspora || 0;
          else if (licenseType === 'premium') price = item.soundpack.premium_license_price_diaspora || 0;
          else if (licenseType === 'exclusive') price = item.soundpack.exclusive_license_price_diaspora || 0;
          else if (licenseType === 'custom') price = item.soundpack.custom_license_price_diaspora || 0;
        }
      }
      
      return total + price;
    }, 0);
  }, [cartItemsWithDetails, currency]);

  // Fetch beat details with caching
  useEffect(() => {
    const fetchBeatDetails = async () => {
      if (lightweightItems.length === 0) {
        setCartItemsWithDetails([]);
        return;
      }

      // Separate beats and soundpacks
      const beatItems = lightweightItems.filter(item => item.itemType === 'beat');
      const soundpackItems = lightweightItems.filter(item => item.itemType === 'soundpack');

      // Check cache first for beats
      const cachedItems: CartItemWithDetails[] = [];
      const beatsToFetch: string[] = [];

      beatItems.forEach(item => {
        const cachedBeat = getCachedBeatData(item.itemId);
        if (cachedBeat) {
          cachedItems.push({
            itemId: item.itemId,
            itemType: 'beat',
            licenseType: item.licenseType,
            addedAt: item.addedAt,
            beat: cachedBeat
          });
        } else {
          beatsToFetch.push(item.itemId);
        }
      });

      // Set cached items immediately
      if (cachedItems.length > 0) {
        setCartItemsWithDetails(cachedItems);
      }

      // Fetch missing beats
      if (beatsToFetch.length > 0) {
        setIsLoading(true);
        try {
          const { data: beats, error } = await supabase
            .from('beats')
            .select(`
              id,
              title,
              producer_id,
              cover_image,
              basic_license_price_local,
              basic_license_price_diaspora,
              premium_license_price_local,
              premium_license_price_diaspora,
              exclusive_license_price_local,
              exclusive_license_price_diaspora,
              genre,
              users!beats_producer_id_fkey (
                wallet_address,
                stage_name,
                full_name
              )
            `)
            .in('id', beatsToFetch);

          if (error) {
            console.error('Error fetching beat details:', error);
            return;
          }

          const newItemsWithDetails = beatItems.map(lightweightItem => {
            // First check if we already have this in cached items
            const existingCached = cachedItems.find(c => c.itemId === lightweightItem.itemId);
            if (existingCached) return existingCached;

            const beat = beats?.find(b => b.id === lightweightItem.itemId);
            if (!beat) return null;

            const userData = beat.users;
            const producerName = userData?.stage_name || userData?.full_name || 'Unknown Producer';
            
            const beatData: Beat = {
              id: beat.id,
              title: beat.title,
              producer_id: beat.producer_id,
              producer_name: producerName,
              cover_image_url: beat.cover_image || '',
              preview_url: '',
              full_track_url: '',
              genre: beat.genre || '',
              track_type: 'Beat',
              bpm: 0,
              tags: [],
              created_at: new Date().toISOString(),
              favorites_count: 0,
              purchase_count: 0,
              status: 'published' as const,
              basic_license_price_local: beat.basic_license_price_local || 0,
              basic_license_price_diaspora: beat.basic_license_price_diaspora || 0,
              premium_license_price_local: beat.premium_license_price_local || 0,
              premium_license_price_diaspora: beat.premium_license_price_diaspora || 0,
              exclusive_license_price_local: beat.exclusive_license_price_local || 0,
              exclusive_license_price_diaspora: beat.exclusive_license_price_diaspora || 0,
              selected_license: lightweightItem.licenseType,
              producer_wallet_address: userData?.wallet_address
            };

            // Cache the beat data
            cacheBeatData(lightweightItem.itemId, beatData);

            return {
              itemId: lightweightItem.itemId,
              itemType: 'beat' as const,
              licenseType: lightweightItem.licenseType,
              addedAt: lightweightItem.addedAt,
              beat: beatData
            };
          }).filter((item): item is CartItemWithDetails => item !== null);

          setCartItemsWithDetails(newItemsWithDetails);
        } catch (error) {
          console.error('Error fetching beat details:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchBeatDetails();
  }, [lightweightItems]);

  return {
    cartItems: cartItemsWithDetails,
    itemCount,
    totalAmount,
    isLoading,
    removeFromCart,
    clearCart,
    addToCart,
    refreshCartFromStorage
  };
}
