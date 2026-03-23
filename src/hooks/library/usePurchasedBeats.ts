
import { useState, useEffect, useCallback } from 'react';
import { useBeats } from '@/hooks/useBeats';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { hasRecentPurchaseSuccess } from '@/lib/paymentFlowStorage';
import { toast } from 'sonner';
import { Beat } from '@/types';

export function usePurchasedBeats() {
  const { isPurchased, isLoading } = useBeats();
  const { user } = useAuth();
  const [downloadUrls, setDownloadUrls] = useState<Record<string, string>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [purchaseDetails, setPurchaseDetails] = useState<Record<string, { licenseType: string, purchaseDate: string }>>({});
  const [beatsLoaded, setBeatsLoaded] = useState(false);
  const [purchasedBeatsData, setPurchasedBeatsData] = useState<Beat[]>([]);
  const location = useLocation();
  
  // Fetch purchased beat details directly from database
  const fetchPurchasedBeatDetails = useCallback(async () => {
    if (!user) return [];
    
    try {
      console.log('Fetching purchased beat details for user:', user.id);
      
      // Get purchased beat IDs and purchase details
      const { data: purchasedData, error: purchasedError } = await supabase
        .from('user_purchased_beats')
        .select('beat_id, license_type, purchase_date')
        .eq('user_id', user.id);
        
      if (purchasedError) {
        console.error('Error fetching purchased beats:', purchasedError);
        throw purchasedError;
      }
      
      if (!purchasedData || purchasedData.length === 0) {
        console.log('No purchased beats found');
        return [];
      }
      
      // Extract beat IDs
      const beatIds = purchasedData.map(item => item.beat_id);
      console.log('Found purchased beat IDs:', beatIds);
      
      // Fetch full beat details including stems_url
      const { data: beatsData, error: beatsError } = await supabase
        .from('beats')
        .select(`
          id,
          title,
          producer_id,
          producer_name:users!beats_producer_id_fkey(stage_name),
          cover_image_url:cover_image,
          preview_url:audio_preview,
          full_track_url:audio_file,
          stems_url,
          basic_license_price_local,
          basic_license_price_diaspora,
          premium_license_price_local,
          premium_license_price_diaspora,
          exclusive_license_price_local,
          exclusive_license_price_diaspora,
          bpm,
          genre,
          track_type,
          tags,
          upload_date,
          plays,
          purchase_count,
          favorites_count,
          status
        `)
        .in('id', beatIds);
        
      if (beatsError) {
        console.error('Error fetching beat details:', beatsError);
        throw beatsError;
      }
      
      // Transform the data to match Beat interface
      const transformedBeats: Beat[] = (beatsData || []).map(beat => ({
        ...beat,
        producer_name: Array.isArray(beat.producer_name) 
          ? beat.producer_name[0]?.stage_name || 'Unknown Producer'
          : beat.producer_name?.stage_name || 'Unknown Producer',
        cover_image_url: beat.cover_image_url || '',
        preview_url: beat.preview_url || '',
        full_track_url: beat.full_track_url || '',
        stems_url: beat.stems_url || undefined,
        genre: beat.genre || '',
        track_type: beat.track_type || '',
        created_at: beat.upload_date || new Date().toISOString(),
        status: (beat.status === 'draft' || beat.status === 'published') ? beat.status : 'published'
      }));
      
      // Create purchase details map
      const detailsMap: Record<string, { licenseType: string, purchaseDate: string }> = {};
      purchasedData.forEach(item => {
        detailsMap[item.beat_id] = {
          licenseType: item.license_type || 'basic',
          purchaseDate: item.purchase_date
        };
      });
      
      console.log('Successfully fetched', transformedBeats.length, 'purchased beats with details');
      setPurchaseDetails(detailsMap);
      setPurchasedBeatsData(transformedBeats);
      
      return transformedBeats;
    } catch (error) {
      console.error('Error in fetchPurchasedBeatDetails:', error);
      throw error;
    }
  }, [user]);

  const refreshPurchasedBeats = useCallback(async () => {
    if (isRefreshing) {
      console.log('Refresh already in progress, skipping...');
      return;
    }
    
    setIsRefreshing(true);
    try {
      console.log('Refreshing purchased beats...');
      
      // Force fetch fresh data
      await fetchPurchasedBeatDetails();
      
      setBeatsLoaded(true);
      
      console.log('Library refresh completed successfully');
      toast.success('Your library has been refreshed');
    } catch (error) {
      console.error('Error refreshing library:', error);
      toast.error('Failed to refresh your library');
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchPurchasedBeatDetails, isRefreshing]);

  // Enhanced real-time subscription for purchases
  useEffect(() => {
    if (!user) return;
    
    console.log('Setting up real-time subscription for purchases for user:', user.id);
    
    const channel = supabase
      .channel('purchased-beats-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_purchased_beats',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Real-time: New purchase detected:', payload);
          // Force immediate refresh of purchased beats
          refreshPurchasedBeats();
          
          // Show success message
          toast.success('New beat added to your library!');
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `buyer_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Real-time: Order status updated:', payload);
          if (payload.new?.status === 'completed') {
            // Delay refresh slightly to ensure all related data is inserted
            setTimeout(() => {
              console.log('Order completed, refreshing library...');
              refreshPurchasedBeats();
            }, 1000);
          }
        }
      )
      .subscribe();
      
    return () => {
      console.log('Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [refreshPurchasedBeats, user]);

  const purchasedBeats = purchasedBeatsData;

  // Enhanced initial loading
  useEffect(() => {
    if (user) {
      console.log('Initial load of purchased beats for user:', user.id);
      
      const loadData = async () => {
        try {
          await fetchPurchasedBeatDetails();
          setBeatsLoaded(true);
          console.log('Initial purchased beats loaded successfully');
        } catch (error) {
          console.error('Error in initial purchased beats load:', error);
          setBeatsLoaded(true); // Set to true even on error to prevent infinite loading
        }
      };
      
      loadData();
      
      // If we came from a purchase, force refresh after a short delay
      const fromPurchase = location.state?.fromPurchase || hasRecentPurchaseSuccess();
      if (fromPurchase) {
        console.log('Coming from a purchase, forcing refresh...');
        setTimeout(() => {
          refreshPurchasedBeats();
        }, 1500);
      }
    }
  }, [fetchPurchasedBeatDetails, location.state, refreshPurchasedBeats, user]);

  const getDownloadUrl = async (beatId: string, fileUrl: string, fileType: 'track' | 'stems' = 'track') => {
    try {
      // Check if we already have the URL cached
      const cacheKey = `${beatId}-${fileType}`;
      if (downloadUrls[cacheKey]) {
        return downloadUrls[cacheKey];
      }

      // Extract the file path from the full URL
      const filePath = fileUrl.replace('https://uoezlwkxhbzajdivrlby.supabase.co/storage/v1/object/public/beats/', '');
      
      // Add loading toast
      toast.loading(`Generating ${fileType} download link...`);
      
      // Get a secure download URL that expires after some time
      const { data, error } = await supabase.storage.from('beats').createSignedUrl(filePath, 3600);

      if (error) {
        throw error;
      }

      // Cache the URL
      setDownloadUrls(prev => ({
        ...prev,
        [cacheKey]: data.signedUrl
      }));

      toast.dismiss();
      return data.signedUrl;
    } catch (error) {
      console.error(`Error getting ${fileType} download URL:`, error);
      toast.dismiss();
      toast.error(`Unable to generate ${fileType} download link`);
      return null;
    }
  };

  const handleDownload = async (beat: Beat, downloadType: 'track' | 'stems' = 'track') => {
    try {
      // Only allow download if the beat is actually purchased
      if (!isPurchased(beat.id)) {
        toast.error('You need to purchase this beat first');
        return;
      }

      // For stems download, check if stems are available
      if (downloadType === 'stems' && !beat.stems_url) {
        toast.error('Stems are not available for this beat');
        return;
      }

      const fileUrl = downloadType === 'stems' ? beat.stems_url! : beat.full_track_url;
      
      // Get the download URL
      const downloadUrl = await getDownloadUrl(beat.id, fileUrl, downloadType);
      
      if (!downloadUrl) {
        toast.error(`Failed to generate ${downloadType} download link`);
        return;
      }

      // Create an invisible anchor and trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      
      // Get the license type for this beat
      const license = purchaseDetails[beat.id]?.licenseType || 'basic';
      
      // Create a clean filename with license type included
      const fileExtension = downloadType === 'stems' ? 'zip' : 'mp3';
      const fileTypeSuffix = downloadType === 'stems' ? '_stems' : '';
      link.download = `${beat.title.replace(/\s+/g, '_')}_${license}${fileTypeSuffix}.${fileExtension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`${downloadType === 'stems' ? 'Stems' : 'Track'} download started!`);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download file');
    }
  };

  return {
    purchasedBeats,
    isLoading,
    isRefreshing,
    beatsLoaded,
    purchaseDetails,
    refreshPurchasedBeats,
    handleDownload
  };
}
