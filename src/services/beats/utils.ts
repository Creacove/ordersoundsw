
import { Beat } from '@/types';
import { SupabaseBeat } from './types';

/**
 * Maps a SupabaseBeat object to the application's Beat type
 * @param beat The SupabaseBeat object from the database
 * @returns Mapped Beat object
 */
export const mapSupabaseBeatToBeat = (beat: SupabaseBeat): Beat => {
  const userData = beat.users;
  const producerName = userData && userData.stage_name ? userData.stage_name : 
                     userData && userData.full_name ? userData.full_name : 'Unknown Producer';
  
  const status = beat.status === 'published' ? 'published' : 'draft';
  
  return {
    id: beat.id,
    title: beat.title,
    producer_id: beat.producer_id,
    producer_name: producerName,
    cover_image_url: beat.cover_image || '',
    preview_url: beat.audio_preview || '',
    full_track_url: beat.audio_file || '',
    basic_license_price_local: beat.basic_license_price_local || 0,
    basic_license_price_diaspora: beat.basic_license_price_diaspora || 0,
    premium_license_price_local: beat.premium_license_price_local || 0,
    premium_license_price_diaspora: beat.premium_license_price_diaspora || 0,
    exclusive_license_price_local: beat.exclusive_license_price_local || 0,
    exclusive_license_price_diaspora: beat.exclusive_license_price_diaspora || 0,
    custom_license_price_local: beat.custom_license_price_local || 0,
    custom_license_price_diaspora: beat.custom_license_price_diaspora || 0,
    genre: beat.genre || '',
    category: beat.category || 'Music Beat', // Add category mapping
    track_type: beat.track_type || 'Beat',
    bpm: beat.bpm || 0,
    tags: beat.tags || [],
    description: beat.description,
    created_at: beat.upload_date || new Date().toISOString(),
    favorites_count: beat.favorites_count || 0,
    purchase_count: beat.purchase_count || 0,
    status: status,
    is_featured: beat.is_featured || false,
    is_trending: beat.is_trending || false,
    is_weekly_pick: beat.is_weekly_pick || false,
  };
};

/**
 * Filters beats by producer ID
 * @param beats Array of beats to filter
 * @param producerId The producer ID to filter by
 * @returns Filtered array of beats that match the producer ID
 */
export const getProducerBeats = (beats: Beat[], producerId: string): Beat[] => {
  return beats.filter(beat => beat.producer_id === producerId);
};

/**
 * Checks if a beat is published
 * @param beatId The ID of the beat to check
 * @returns Promise resolving to boolean indicating if beat is published
 */
export const isBeatPublished = async (beatId: string): Promise<boolean> => {
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    
    const { data, error } = await supabase
      .from('beats')
      .select('status')
      .eq('id', beatId)
      .eq('status', 'published')
      .maybeSingle();
      
    if (error) {
      console.error('Error checking beat published status:', error);
      return false;
    }
    
    return !!data;
  } catch (error) {
    console.error('Failed to check beat published status:', error);
    return false;
  }
};

/**
 * Filters beats array to only include favorites
 * @param beats Array of beats to filter
 * @param favoriteIds Array of beat IDs that are favorites
 * @returns Filtered array of favorite beats
 */
export const getUserFavoriteBeats = (beats: Beat[], favoriteIds: string[]): Beat[] => {
  if (!favoriteIds || !Array.isArray(favoriteIds) || favoriteIds.length === 0) {
    return [];
  }
  
  return beats.filter(beat => favoriteIds.includes(beat.id));
};
