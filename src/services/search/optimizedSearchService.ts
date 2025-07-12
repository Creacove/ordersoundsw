
import { supabase } from '@/integrations/supabase/client';
import { Beat } from '@/types';
import { mapSupabaseBeatToBeat } from '@/services/beats/utils';

export interface OptimizedSearchParams {
  query?: string;
  genre?: string;
  minPrice?: number;
  maxPrice?: number;
  bpmMin?: number;
  bpmMax?: number;
  trackType?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'relevance' | 'newest' | 'popular' | 'price_low' | 'price_high';
}

export interface OptimizedSearchResults {
  beats: Beat[];
  producers: any[];
  totalCount: number;
  hasMore: boolean;
}

export async function optimizedSearchBeats(params: OptimizedSearchParams): Promise<OptimizedSearchResults> {
  const {
    query = '',
    genre,
    minPrice,
    maxPrice,
    bpmMin,
    bpmMax,
    trackType,
    limit = 20,
    offset = 0,
    sortBy = 'relevance'
  } = params;

  try {
    // Build the query to leverage our new indexes
    let beatsQuery = supabase
      .from('beats')
      .select(`
        *,
        users!beats_producer_id_fkey(stage_name, full_name, profile_picture)
      `, { count: 'exact' })
      .eq('status', 'published') // Uses idx_beats_new, idx_beats_trending etc.
      .range(offset, offset + limit - 1);

    // Text search using our new case-insensitive indexes
    if (query.trim()) {
      const searchTerm = query.trim().toLowerCase();
      
      // Use ILIKE for case-insensitive search, leverages idx_beats_title_lower
      beatsQuery = beatsQuery.or(
        `title.ilike.%${searchTerm}%,` +
        `genre.ilike.%${searchTerm}%,` +
        `tags.cs.{${searchTerm}}`
      );
    }

    // Genre filter - uses idx_beats_genre_status
    if (genre) {
      beatsQuery = beatsQuery.eq('genre', genre);
    }

    // Track type filter - uses idx_beats_track_type  
    if (trackType) {
      beatsQuery = beatsQuery.eq('track_type', trackType);
    }

    // BPM range filter - uses idx_beats_bpm_status
    if (bpmMin || bpmMax) {
      if (bpmMin) beatsQuery = beatsQuery.gte('bpm', bpmMin);
      if (bpmMax) beatsQuery = beatsQuery.lte('bpm', bpmMax);
    }

    // Price range filter - uses idx_beats_price_local/diaspora
    if (minPrice || maxPrice) {
      if (minPrice) beatsQuery = beatsQuery.gte('basic_license_price_local', minPrice);
      if (maxPrice) beatsQuery = beatsQuery.lte('basic_license_price_local', maxPrice);
    }

    // Optimized sorting using our indexes
    switch (sortBy) {
      case 'newest':
        // Uses idx_beats_new
        beatsQuery = beatsQuery.order('upload_date', { ascending: false });
        break;
      case 'popular':
        // Uses idx_beats_metrics for trending calculation
        beatsQuery = beatsQuery.order('plays', { ascending: false })
                              .order('favorites_count', { ascending: false });
        break;
      case 'price_low':
        // Uses idx_beats_price_local
        beatsQuery = beatsQuery.order('basic_license_price_local', { ascending: true });
        break;
      case 'price_high':
        // Uses idx_beats_price_diaspora
        beatsQuery = beatsQuery.order('basic_license_price_local', { ascending: false });
        break;
      default: // relevance
        // Uses idx_beats_trending for featured/trending content first
        beatsQuery = beatsQuery.order('is_featured', { ascending: false })
                              .order('is_trending', { ascending: false })
                              .order('upload_date', { ascending: false });
    }

    const { data: beatsData, error, count } = await beatsQuery;

    if (error) throw error;

    // Transform data efficiently
    const beats = (beatsData || []).map(beat => ({
      ...mapSupabaseBeatToBeat(beat),
      producer_name: beat.users?.stage_name || beat.users?.full_name || 'Unknown Producer'
    }));

    return {
      beats,
      producers: [], // Will be fetched separately if needed
      totalCount: count || 0,
      hasMore: (offset + limit) < (count || 0)
    };
  } catch (error) {
    console.error('Error in optimized search:', error);
    throw error;
  }
}

export async function optimizedSearchProducers(query: string, limit = 10): Promise<any[]> {
  try {
    if (!query.trim()) return [];

    const searchTerm = query.trim().toLowerCase();

    // Use our new producer indexes for fast lookups
    const { data, error } = await supabase
      .from('users')
      .select('id, full_name, stage_name, profile_picture, bio, country, follower_count')
      .eq('role', 'producer') // Uses idx_users_producer_role
      .or(`stage_name.ilike.%${searchTerm}%, full_name.ilike.%${searchTerm}%, country.ilike.%${searchTerm}%`)
      .order('follower_count', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error searching producers:', error);
    return [];
  }
}

export async function getTrendingBeatsOptimized(limit = 30): Promise<Beat[]> {
  try {
    // Uses idx_beats_trending for optimal performance
    const { data, error } = await supabase
      .from('beats')
      .select(`
        *,
        users!beats_producer_id_fkey(stage_name, full_name, profile_picture)
      `)
      .eq('status', 'published')
      .eq('is_trending', true)
      .order('upload_date', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []).map(beat => ({
      ...mapSupabaseBeatToBeat(beat),
      producer_name: beat.users?.stage_name || beat.users?.full_name || 'Unknown Producer'
    }));
  } catch (error) {
    console.error('Error fetching trending beats:', error);
    return [];
  }
}

export async function getNewBeatsOptimized(limit = 20): Promise<Beat[]> {
  try {
    // Uses idx_beats_new for optimal performance
    const { data, error } = await supabase
      .from('beats')
      .select(`
        *,
        users!beats_producer_id_fkey(stage_name, full_name, profile_picture)
      `)
      .eq('status', 'published')
      .neq('category', 'Gaming & Soundtrack')
      .order('upload_date', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []).map(beat => ({
      ...mapSupabaseBeatToBeat(beat),
      producer_name: beat.users?.stage_name || beat.users?.full_name || 'Unknown Producer'
    }));
  } catch (error) {
    console.error('Error fetching new beats:', error);
    return [];
  }
}

export async function getFeaturedBeatsOptimized(limit = 1): Promise<Beat[]> {
  try {
    // Uses idx_beats_featured for optimal performance
    const { data, error } = await supabase
      .from('beats')
      .select(`
        *,
        users!beats_producer_id_fkey(stage_name, full_name, profile_picture)
      `)
      .eq('status', 'published')
      .eq('is_featured', true)
      .order('upload_date', { ascending: false })
      .limit(limit);

    if (error) throw error;

    if (!data || data.length === 0) {
      // Fallback to trending beats if no featured beats
      return getTrendingBeatsOptimized(limit);
    }

    return (data || []).map(beat => ({
      ...mapSupabaseBeatToBeat(beat),
      producer_name: beat.users?.stage_name || beat.users?.full_name || 'Unknown Producer'
    }));
  } catch (error) {
    console.error('Error fetching featured beats:', error);
    return [];
  }
}

export async function getMetricBasedTrendingOptimized(limit = 100): Promise<Beat[]> {
  try {
    // Uses idx_beats_metrics for optimal trending calculation
    const { data, error } = await supabase
      .from('beats')
      .select(`
        *,
        users!beats_producer_id_fkey(stage_name, full_name, profile_picture)
      `)
      .eq('status', 'published')
      .not('plays', 'is', null)
      .order('plays', { ascending: false })
      .order('favorites_count', { ascending: false })
      .order('purchase_count', { ascending: false })
      .order('upload_date', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []).map(beat => ({
      ...mapSupabaseBeatToBeat(beat),
      producer_name: beat.users?.stage_name || beat.users?.full_name || 'Unknown Producer'
    }));
  } catch (error) {
    console.error('Error fetching metric-based trending beats:', error);
    return [];
  }
}

export async function getPopularSearchTerms(): Promise<string[]> {
  try {
    // Get popular genres and terms from actual data using our indexes
    const { data: genreData } = await supabase
      .from('beats')
      .select('genre')
      .eq('status', 'published')
      .not('genre', 'is', null)
      .limit(100);

    const genres = [...new Set(genreData?.map(beat => beat.genre).filter(Boolean))];
    
    // Return top genres as popular search terms
    const popularTerms = ['Afrobeat', 'Hip Hop', 'Amapiano', 'R&B', 'Trap', 'Dancehall', 'Pop'];
    return [...new Set([...popularTerms, ...genres.slice(0, 10)])];
  } catch (error) {
    console.error('Error fetching popular search terms:', error);
    return ['Afrobeat', 'Hip Hop', 'Amapiano', 'R&B', 'Trap', 'Dancehall', 'Pop'];
  }
}

export async function getGenres(): Promise<string[]> {
  try {
    // Use our genre index for fast genre lookup
    const { data, error } = await supabase
      .from('beats')
      .select('genre')
      .eq('status', 'published')
      .not('genre', 'is', null);

    if (error) throw error;

    const genres = [...new Set(data?.map(beat => beat.genre).filter(Boolean))];
    return genres.sort();
  } catch (error) {
    console.error('Error fetching genres:', error);
    return ['Afrobeat', 'Amapiano', 'Hip Hop', 'R&B', 'Trap', 'Dancehall', 'Pop'];
  }
}
