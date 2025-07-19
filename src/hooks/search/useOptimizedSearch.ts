
import { useState, useMemo, useCallback } from 'react';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { useDebounce } from '@/hooks/useDebounce';
import { 
  optimizedSearchBeats, 
  optimizedSearchProducers, 
  getPopularSearchTerms, 
  getGenres,
  getMoods, 
  OptimizedSearchParams, 
  OptimizedSearchResults 
} from '@/services/search/optimizedSearchService';

export function useOptimizedSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Omit<OptimizedSearchParams, 'query' | 'limit' | 'offset'>>({
    sortBy: 'relevance'
  });
  const [activeTab, setActiveTab] = useState<'all' | 'beats' | 'producers'>('all');

  // Debounce search term to avoid excessive API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Memoize search parameters
  const searchParams = useMemo(() => ({
    query: debouncedSearchTerm,
    ...filters
  }), [debouncedSearchTerm, filters]);

  // Optimized infinite query for beats with pagination
  const {
    data: beatsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingBeats,
    error: beatsError
  } = useInfiniteQuery({
    queryKey: ['optimized-search-beats', searchParams],
    queryFn: ({ pageParam = 0 }) => 
      optimizedSearchBeats({ 
        ...searchParams, 
        limit: 20, 
        offset: (pageParam as number) * 20 
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage: OptimizedSearchResults, allPages) => 
      lastPage.hasMore ? allPages.length : undefined,
    enabled: debouncedSearchTerm.length >= 2 || Object.keys(filters).some(key => key !== 'sortBy' && filters[key as keyof typeof filters]),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Optimized producers search query
  const {
    data: producers = [],
    isLoading: isLoadingProducers
  } = useQuery({
    queryKey: ['optimized-search-producers', debouncedSearchTerm],
    queryFn: () => optimizedSearchProducers(debouncedSearchTerm),
    enabled: debouncedSearchTerm.length >= 2,
    staleTime: 5 * 60 * 1000,
  });

  // Popular search terms using actual data
  const {
    data: popularTerms = []
  } = useQuery({
    queryKey: ['optimized-popular-search-terms'],
    queryFn: getPopularSearchTerms,
    staleTime: 60 * 60 * 1000, // 1 hour
  });

  // Optimized genres query
  const {
    data: genres = []
  } = useQuery({
    queryKey: ['optimized-search-genres'],
    queryFn: getGenres,
    staleTime: 60 * 60 * 1000, // 1 hour
  });

  // Optimized moods query
  const {
    data: moods = []
  } = useQuery({
    queryKey: ['optimized-search-moods'],
    queryFn: getMoods,
    staleTime: 60 * 60 * 1000, // 1 hour
  });

  // Flatten beats data from infinite query
  const allBeats = useMemo(() => {
    return beatsData?.pages.flatMap(page => page.beats) || [];
  }, [beatsData]);

  // Filter results based on active tab
  const filteredResults = useMemo(() => {
    switch (activeTab) {
      case 'beats':
        return { beats: allBeats, producers: [] };
      case 'producers':
        return { beats: [], producers };
      default:
        return { beats: allBeats, producers };
    }
  }, [activeTab, allBeats, producers]);

  // Actions
  const updateSearchTerm = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  const updateFilters = useCallback((newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({ sortBy: 'relevance' });
  }, []);

  const loadMoreBeats = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return {
    // State
    searchTerm,
    debouncedSearchTerm,
    filters,
    activeTab,
    
    // Data
    beats: filteredResults.beats,
    producers: filteredResults.producers,
    popularTerms,
    genres,
    moods,
    totalResults: allBeats.length,
    
    // Loading states
    isLoading: isLoadingBeats || isLoadingProducers,
    isLoadingBeats,
    isLoadingProducers,
    isFetchingNextPage,
    hasNextPage,
    
    // Errors
    error: beatsError,
    
    // Actions
    updateSearchTerm,
    updateFilters,
    clearFilters,
    setActiveTab,
    loadMoreBeats,
    
    // Helpers
    hasResults: allBeats.length > 0 || producers.length > 0,
    showMinimumLengthMessage: searchTerm.length > 0 && searchTerm.length < 2,
    showNoResults: debouncedSearchTerm.length >= 2 && !isLoadingBeats && allBeats.length === 0 && producers.length === 0
  };
}
