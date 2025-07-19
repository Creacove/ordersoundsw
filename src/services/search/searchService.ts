
import { supabase } from '@/integrations/supabase/client';
import { Beat } from '@/types';
import { mapSupabaseBeatToBeat } from '@/services/beats/utils';
import { 
  optimizedSearchBeats, 
  optimizedSearchProducers,
  getPopularSearchTerms as getOptimizedPopularSearchTerms,
  getGenres as getOptimizedGenres,
  getMoods as getOptimizedMoods,
  OptimizedSearchParams,
  OptimizedSearchResults 
} from './optimizedSearchService';

export interface SearchParams {
  query?: string;
  genre?: string;
  mood?: string;
  minPrice?: number;
  maxPrice?: number;
  bpmMin?: number;
  bpmMax?: number;
  trackType?: string;
  limit?: number;
  offset?: number;
}

export interface SearchResults {
  beats: Beat[];
  producers: any[];
  totalCount: number;
  hasMore: boolean;
}

// Use the optimized search by default
export async function searchBeats(params: SearchParams): Promise<SearchResults> {
  return optimizedSearchBeats(params as OptimizedSearchParams);
}

export async function searchProducers(query: string, limit = 10): Promise<any[]> {
  return optimizedSearchProducers(query, limit);
}

export async function getPopularSearchTerms(): Promise<string[]> {
  return getOptimizedPopularSearchTerms();
}

export async function getGenres(): Promise<string[]> {
  return getOptimizedGenres();
}

export async function getMoods(): Promise<string[]> {
  return getOptimizedMoods();
}
