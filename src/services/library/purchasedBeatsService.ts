
import { supabase } from '@/integrations/supabase/client';
import { Beat } from '@/types';
import { mapSupabaseBeatToBeat } from '@/services/beats/utils';
import { SupabaseBeat } from '@/services/beats/types';

interface PurchasedBeatData {
  beats: Beat[];
  purchaseDetails: Record<string, { licenseType: string, purchaseDate: string }>;
}

export async function fetchPurchasedBeatsOptimized(userId: string): Promise<PurchasedBeatData> {
  console.log('Fetching purchased beats optimized for user:', userId);
  
  try {
    // Single optimized query using JOIN to get all data at once
    const { data, error } = await supabase
      .from('user_purchased_beats')
      .select(`
        beat_id,
        license_type,
        purchase_date,
        beats:beat_id (
          id,
          title,
          producer_id,
          producer_name:users!beats_producer_id_fkey(stage_name, full_name),
          cover_image,
          audio_preview,
          audio_file,
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
        )
      `)
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching purchased beats:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      console.log('No purchased beats found');
      return { beats: [], purchaseDetails: {} };
    }

    // Transform data efficiently in a single pass
    const beats: Beat[] = [];
    const purchaseDetails: Record<string, { licenseType: string, purchaseDate: string }> = {};

    data.forEach(item => {
      if (item.beats) {
        const beatData = item.beats as any;
        
        // Create the beat object with correct field mapping
        const beat: Beat = {
          id: beatData.id,
          title: beatData.title || 'Untitled',
          producer_id: beatData.producer_id,
          producer_name: Array.isArray(beatData.producer_name) 
            ? beatData.producer_name[0]?.stage_name || beatData.producer_name[0]?.full_name || 'Unknown Producer'
            : beatData.producer_name?.stage_name || beatData.producer_name?.full_name || 'Unknown Producer',
          cover_image_url: beatData.cover_image || '',
          preview_url: beatData.audio_preview || '',
          full_track_url: beatData.audio_file || '',
          stems_url: beatData.stems_url || undefined,
          genre: beatData.genre || '',
          track_type: beatData.track_type || '',
          bpm: beatData.bpm || 0,
          tags: beatData.tags || [],
          created_at: beatData.upload_date || new Date().toISOString(),
          favorites_count: beatData.favorites_count || 0,
          purchase_count: beatData.purchase_count || 0,
          plays: beatData.plays || 0,
          status: (beatData.status === 'draft' || beatData.status === 'published') ? beatData.status : 'published',
          basic_license_price_local: beatData.basic_license_price_local,
          basic_license_price_diaspora: beatData.basic_license_price_diaspora,
          premium_license_price_local: beatData.premium_license_price_local,
          premium_license_price_diaspora: beatData.premium_license_price_diaspora,
          exclusive_license_price_local: beatData.exclusive_license_price_local,
          exclusive_license_price_diaspora: beatData.exclusive_license_price_diaspora
        };
        
        beats.push(beat);
        
        purchaseDetails[item.beat_id] = {
          licenseType: item.license_type || 'basic',
          purchaseDate: item.purchase_date
        };
      }
    });

    console.log(`Successfully fetched ${beats.length} purchased beats optimized`);
    console.log('Sample beat cover image URL:', beats[0]?.cover_image_url);
    
    return { beats, purchaseDetails };
  } catch (error) {
    console.error('Error in fetchPurchasedBeatsOptimized:', error);
    throw error;
  }
}
