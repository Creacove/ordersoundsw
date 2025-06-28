
import { useEffect, useState, useMemo } from "react";
import { MainLayoutWithPlayer } from "@/components/layout/MainLayoutWithPlayer";
import { BeatCardCompact } from "@/components/marketplace/BeatCardCompact";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { fetchMetricBasedTrending } from "@/services/beats/queryService";
import { useAuth } from "@/context/AuthContext";
import { useBeats } from "@/hooks/useBeats";
import { Beat } from "@/types";

export default function Trending() {
  const [displayCount, setDisplayCount] = useState(30);
  const { isInCart } = useCart();
  const { toggleFavorite, isFavorite, isPurchased } = useBeats();
  const { user } = useAuth();
  
  // Smart caching: Single cache key, slice client-side
  const { data: allTrendingBeats = [], isLoading } = useQuery({
    queryKey: ['metrics-trending-beats'], // Single key regardless of display count
    queryFn: () => fetchMetricBasedTrending(200), // Fetch more upfront
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000, // Proper garbage collection
    placeholderData: keepPreviousData, // Updated syntax for TanStack Query v5
  }) as { data: Beat[], isLoading: boolean };

  // Memoized slicing - no re-computation on re-renders
  const trendingBeats = useMemo(() => 
    allTrendingBeats.slice(0, displayCount), 
    [allTrendingBeats, displayCount]
  );

  useEffect(() => {
    document.title = "Trending Beats | OrderSOUNDS";
  }, []);

  const loadMoreBeats = () => {
    setDisplayCount(prevCount => Math.min(prevCount + 30, allTrendingBeats.length));
  };

  const hasMore = displayCount < allTrendingBeats.length;

  return (
    <MainLayoutWithPlayer activeTab="trending">
      <div className="container py-4 md:py-8 px-4 md:px-6">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">Trending Beats</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Discover the hottest beats based on plays, favorites, and purchases
          </p>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {[...Array(30)].map((_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <Skeleton className="aspect-square rounded-lg" />
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {trendingBeats.map((beat) => (
                <BeatCardCompact 
                  key={beat.id} 
                  beat={beat}
                />
              ))}
            </div>
            
            {hasMore && (
              <div className="flex justify-center mt-8">
                <Button 
                  variant="outline" 
                  size="lg" 
                  onClick={loadMoreBeats}
                  className="gap-2"
                >
                  See More <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            {trendingBeats.length === 0 && (
              <div className="text-center py-10">
                <p className="text-muted-foreground">No trending beats available at the moment.</p>
              </div>
            )}
          </>
        )}
      </div>
    </MainLayoutWithPlayer>
  );
}
