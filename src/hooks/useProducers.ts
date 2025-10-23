
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export interface Producer {
  id: string;
  stage_name: string | null;
  full_name: string;
  bio: string | null;
  profile_picture: string | null;
  follower_count: number;
  beatCount: number;
}

export function useProducers() {
  // Get only active producers (those with published beats) with reliable query pattern
  const {
    data: producers = [],
    isLoading,
    refetch,
    isError,
    error
  } = useQuery({
    queryKey: ['producers'],
    queryFn: async () => {
      try {
        console.log("Fetching active producers data...");

        // First, get all producers from the users table (reliable approach)
        const { data: producersData, error } = await supabase
          .from('users')
          .select('id, stage_name, full_name, bio, profile_picture, follower_count')
          .eq('role', 'producer')
          .order('follower_count', { ascending: false });

        if (error) throw error;

        if (!producersData) return [];

        // For each producer, get their beat count in parallel (proven working pattern)
        const producersWithBeats = await Promise.all(
          producersData.map(async (producer) => {
            const { count, error: beatError } = await supabase
              .from('beats')
              .select('id', { count: 'exact', head: true })
              .eq('producer_id', producer.id)
              .eq('status', 'published')
              .is('soundpack_id', null); // Only count individual beats, not soundpack beats

            if (beatError) {
              console.error('Error getting beat count:', beatError);
              return { ...producer, beatCount: 0 };
            }

            return {
              ...producer,
              beatCount: count || 0
            };
          })
        );

        // Filter out producers with 0 beats and sort by activity (most active first)
        const activeProducers = producersWithBeats
          .filter(producer => producer.beatCount > 0)
          .sort((a, b) => b.beatCount - a.beatCount);

        console.log(`Fetched ${activeProducers.length} active producers`);
        return activeProducers as Producer[];
      } catch (error) {
        console.error("Error fetching producers:", error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // Keep data fresh for 5 minutes
    refetchOnMount: false // Don't refetch automatically when component mounts
  });

  // Function to trigger a prefetch of producer data
  const prefetchProducers = () => {
    console.log("Prefetching producers data...");
    refetch();
  };

  return {
    producers,
    isLoading,
    isError,
    error,
    prefetchProducers
  };
}
