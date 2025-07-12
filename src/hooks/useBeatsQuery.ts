
import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Beat } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { 
  fetchAllBeats, fetchTrendingBeats, fetchMetricBasedTrending, fetchWeeklyPicksBeats, fetchNewBeats,
  fetchBeatById, clearBeatsCache
} from '@/services/beats';

export function useBeatsQuery() {
  const { user } = useAuth();
  const [dataFetched, setDataFetched] = useState<boolean>(false);

  // Main beats query
  const { 
    data: beats = [], 
    isLoading: isLoadingBeats, 
    refetch: refetchBeats,
    error: beatsError
  } = useQuery({
    queryKey: ['beats', user?.id, user?.role],
    queryFn: async () => {
      console.log('Fetching beats from useBeatsQuery...');
      
      if (user?.role === 'producer') {
        const producerBeats = await fetchAllBeats({ 
          includeDrafts: true, 
          producerId: user.id, 
          limit: 50
        });
        setDataFetched(true);
        return producerBeats;
      }
      
      const allBeats = await fetchAllBeats({ 
        includeDrafts: true,
        limit: 50
      });
      setDataFetched(true);
      return allBeats;
    },
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  // Curated trending beats query (for homepage)
  const { 
    data: trendingBeats = [], 
    isLoading: isLoadingTrending 
  } = useQuery({
    queryKey: ['curated-trending-beats'],
    queryFn: () => fetchTrendingBeats(30),
    staleTime: 10 * 60 * 1000, // Keep trending data fresh for 10 minutes
  });

  // Metrics-based trending beats query (for trending page)
  const { 
    data: metricsTrendingBeats = [], 
    isLoading: isLoadingMetricsTrending 
  } = useQuery({
    queryKey: ['metrics-trending-beats'],
    queryFn: () => fetchMetricBasedTrending(100),
    staleTime: 5 * 60 * 1000, // Refresh more frequently for dynamic metrics
  });

  // New beats query
  const { 
    data: newBeats = [], 
    isLoading: isLoadingNew 
  } = useQuery({
    queryKey: ['new-beats'],
    queryFn: () => fetchNewBeats(30),
    staleTime: 5 * 60 * 1000,
  });

  // Weekly picks query (curated beats with is_weekly_pick = true)
  const { 
    data: weeklyPicks = [], 
    isLoading: isLoadingWeekly 
  } = useQuery({
    queryKey: ['weekly-picks'],
    queryFn: () => fetchWeeklyPicksBeats(8),
    staleTime: 60 * 60 * 1000, // Keep weekly picks for 1 hour
  });

  // Featured beat (first trending beat)
  const featuredBeat = trendingBeats.length > 0 ? { ...trendingBeats[0], is_featured: true } : null;

  const isLoading = isLoadingBeats || isLoadingTrending || isLoadingNew || isLoadingWeekly;
  const loadingError = beatsError ? `Failed to load beats: ${beatsError.message}` : null;

  const forceRefreshBeats = useCallback(async () => {
    console.log("Force refreshing beats data with React Query...");
    clearBeatsCache();
    setDataFetched(false);
    await refetchBeats();
    console.log("Beats data refreshed");
  }, [refetchBeats]);

  const getBeatById = async (id: string): Promise<Beat | null> => {
    const localBeat = beats.find(beat => beat.id === id);
    if (localBeat) return localBeat;
    
    return fetchBeatById(id);
  };

  const getProducerBeats = (producerId: string): Beat[] => {
    return beats.filter(beat => beat.producer_id === producerId);
  };

  return {
    beats,
    trendingBeats, // Curated trending for homepage
    metricsTrendingBeats, // Metrics-based trending for trending page
    newBeats,
    weeklyPicks,
    featuredBeat,
    isLoading,
    loadingError,
    forceRefreshBeats,
    getBeatById,
    getProducerBeats,
    dataFetched
  };
}
