
import { useState, useEffect } from 'react';
import { useCartLightweight } from './useCartLightweight';
import { supabase } from '@/integrations/supabase/client';
import { Beat } from '@/types';

interface CartItemWithDetails {
  itemId: string;
  itemType: 'beat' | 'soundpack';
  licenseType: string;
  addedAt: string;
  beat?: Beat;
  soundpack?: any;
}

export function useCartWithBeatDetails() {
  const { cartItems: lightweightItems, itemCount, removeFromCart, clearCart, addToCart, refreshCartFromStorage } = useCartLightweight();
  const [cartItemsWithDetails, setCartItemsWithDetails] = useState<CartItemWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);

  // Fetch beat details for cart items
  useEffect(() => {
    const fetchBeatDetails = async () => {
      console.log('🛒 Starting fetchBeatDetails with lightweight items:', lightweightItems);
      
      if (lightweightItems.length === 0) {
        console.log('🛒 No lightweight items, clearing cart details');
        setCartItemsWithDetails([]);
        setTotalAmount(0);
        return;
      }

      setIsLoading(true);
      try {
        // Extract beat IDs from lightweight items (filter only beats)
        const beatItems = lightweightItems.filter(item => item.itemType === 'beat');
        const beatIds = beatItems.map(item => item.itemId);
        console.log('🛒 Beat IDs to fetch:', beatIds);
        
        if (beatIds.length === 0) {
          console.log('🛒 No beats to fetch');
          setCartItemsWithDetails([]);
          setTotalAmount(0);
          setIsLoading(false);
          return;
        }
        
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
          .in('id', beatIds);

        if (error) {
          console.error('🛒 Error fetching beat details:', error);
          return;
        }

        console.log('🛒 Fetched beats from database:', beats);

        // Map lightweight items with beat details
        const itemsWithDetails = beatItems.map(lightweightItem => {
          console.log('🛒 Processing lightweight item:', lightweightItem);
          
          const beat = beats?.find(b => b.id === lightweightItem.itemId);
          if (!beat) {
            console.warn('🛒 Beat not found for ID:', lightweightItem.itemId);
            return null;
          }

          console.log('🛒 Found beat for item:', beat);

          const userData = beat.users;
          const producerName = userData?.stage_name || userData?.full_name || 'Unknown Producer';
          
          const detailedItem: CartItemWithDetails = {
            itemId: lightweightItem.itemId,
            itemType: 'beat',
            licenseType: lightweightItem.licenseType,
            addedAt: lightweightItem.addedAt,
            beat: {
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
            } as Beat
          };

          console.log('🛒 Created detailed item:', detailedItem);
          return detailedItem;
        }).filter((item): item is CartItemWithDetails => item !== null);

        console.log('🛒 Final items with details:', itemsWithDetails);
        setCartItemsWithDetails(itemsWithDetails);

        // Calculate total amount
        const total = itemsWithDetails.reduce((sum, item) => {
          if (!item.beat) return sum;
          
          const licenseType = item.licenseType;
          let price = 0;
          
          if (licenseType === 'basic') {
            price = item.beat.basic_license_price_diaspora || 0;
          } else if (licenseType === 'premium') {
            price = item.beat.premium_license_price_diaspora || 0;
          } else if (licenseType === 'exclusive') {
            price = item.beat.exclusive_license_price_diaspora || 0;
          }
          
          return sum + price;
        }, 0);
        
        console.log('🛒 Calculated total amount:', total);
        setTotalAmount(total);
      } catch (error) {
        console.error('🛒 Error fetching beat details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBeatDetails();
  }, [lightweightItems]);

  // Add debugging for state changes
  useEffect(() => {
    console.log('🛒 Cart items with details updated:', cartItemsWithDetails);
  }, [cartItemsWithDetails]);

  useEffect(() => {
    console.log('🛒 Item count updated:', itemCount);
  }, [itemCount]);

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
