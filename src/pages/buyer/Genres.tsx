
import { useEffect, useState, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { BeatCard } from "@/components/ui/BeatCard";
import { BeatListItem } from "@/components/ui/BeatListItem";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/context/CartContext";
import { useLocation } from "react-router-dom";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { fetchBeatsByGenre, fetchAllGenres } from "@/services/beats/optimizedGenreService";
import { fetchAllBeats } from "@/services/beats/queryService";
import { useAuth } from "@/context/AuthContext";
import { useBeats } from "@/hooks/useBeats";
import { Beat } from "@/types";
import { LayoutGrid, List as ListIcon, Music } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Genres() {
  const { isInCart } = useCart();
  const { toggleFavorite, isFavorite, isPurchased } = useBeats();
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(window.innerWidth < 768 ? 'list' : 'grid');
  const location = useLocation();
  const { user } = useAuth();
  
  // Fetch all genres for the filter
  const { data: genres = [] } = useQuery({
    queryKey: ['genres'],
    queryFn: fetchAllGenres,
    staleTime: 30 * 60 * 1000, // Cache genres for 30 minutes
    gcTime: 60 * 60 * 1000,
  });

  // Smart genre-specific or all beats query
  const { data: beats = [], isLoading } = useQuery({
    queryKey: selectedGenre ? ['beats-by-genre', selectedGenre] : ['all-beats-for-genres'],
    queryFn: () => selectedGenre 
      ? fetchBeatsByGenre(selectedGenre, 100)
      : fetchAllBeats({ limit: 100, includeDrafts: false }),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    placeholderData: keepPreviousData,
  }) as { data: Beat[], isLoading: boolean };

  useEffect(() => {
    // Get genre from URL query parameter if present
    const queryParams = new URLSearchParams(location.search);
    const genreParam = queryParams.get('genre');
    if (genreParam) {
      setSelectedGenre(genreParam);
      document.title = `${genreParam} Beats | OrderSOUNDS`;
    } else {
      document.title = "Genres | OrderSOUNDS";
    }
  }, [location.search]);

  // Memoized filtered beats (only when showing all beats)
  const filteredBeats = useMemo(() => {
    return beats;
  }, [beats]);

  return (
    <div className="min-h-screen bg-[#030407]">
      <div className="container py-12 px-6 md:px-8 max-w-7xl mx-auto">
        {/* Modern Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-2">
            <Badge className="bg-accent/10 text-accent border border-accent/20 tracking-[0.2em] uppercase text-[10px] font-bold px-3 py-1 rounded-full mb-3">
              Explore Collections
            </Badge>
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase italic leading-none">
              {selectedGenre ? selectedGenre : 'Genres'}
            </h1>
            <p className="text-white/40 text-sm md:text-base font-medium max-w-lg">
              Discover unique sounds curated by mood and style. Find your next masterpiece today.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-white/[0.03] border border-white/10 p-1.5 rounded-2xl self-start md:self-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('grid')}
              className={`rounded-xl h-9 px-4 transition-all duration-300 ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'}`}
            >
              <LayoutGrid size={16} className="mr-2" />
              Grid
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('list')}
              className={`rounded-xl h-9 px-4 transition-all duration-300 ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'}`}
            >
              <ListIcon size={16} className="mr-2" />
              List
            </Button>
          </div>
        </div>
        
        {/* Premium Genre Filters */}
        <div className="flex overflow-x-auto pb-6 mb-10 gap-3 hide-scrollbar mask-fade-right">
          <button 
            onClick={() => setSelectedGenre(null)}
            className={`px-8 py-3 rounded-[2rem] text-sm font-bold transition-all duration-300 border backdrop-blur-xl whitespace-nowrap
              ${selectedGenre === null 
                ? 'bg-white text-black border-white shadow-[0_0_30px_rgba(255,255,255,0.2)]' 
                : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white hover:border-white/20'}`}
          >
            All Beats
          </button>
          
          {genres.map(genre => (
            <button 
              key={genre} 
              onClick={() => setSelectedGenre(genre)}
              className={`px-8 py-3 rounded-[2rem] text-sm font-bold transition-all duration-300 border backdrop-blur-xl whitespace-nowrap
                ${selectedGenre === genre 
                  ? 'bg-[#9A3BDC] text-white border-[#9A3BDC] shadow-[0_0_30px_rgba(154,59,220,0.4)]' 
                  : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white hover:border-white/20'}`}
            >
              {genre}
            </button>
          ))}
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="space-y-4 bg-white/[0.02] border border-white/5 p-4 rounded-3xl">
                <Skeleton className="aspect-square w-full rounded-2xl bg-white/5" />
                <div className="space-y-2 px-2">
                  <Skeleton className="h-5 w-2/3 bg-white/5" />
                  <Skeleton className="h-4 w-1/2 bg-white/5" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredBeats.length > 0 ? (
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8 animate-fade-in"
            : "flex flex-col gap-4 animate-fade-in"
          }>
            {filteredBeats.map((beat) => (
              viewMode === 'grid' ? (
                <BeatCard 
                  key={beat.id} 
                  beat={beat} 
                  isFavorite={isFavorite(beat.id)}
                  isInCart={isInCart(beat.id)}
                  isPurchased={isPurchased(beat.id)}
                  onToggleFavorite={user ? toggleFavorite : undefined}
                />
              ) : (
                <BeatListItem 
                  key={beat.id} 
                  beat={beat} 
                  isFavorite={isFavorite(beat.id)}
                  isInCart={isInCart(beat.id)}
                  isPurchased={isPurchased(beat.id)}
                  onToggleFavorite={user ? toggleFavorite : undefined}
                />
              )
            ))}
          </div>
        ) : (
          <div className="text-center py-32 rounded-[3rem] bg-white/[0.02] border border-dashed border-white/10">
            <div className="bg-white/5 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Music className="text-white/20 h-10 w-10" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No beats found</h3>
            <p className="text-white/40 max-w-sm mx-auto">
              We couldn't find any beats in the {selectedGenre} genre. Try exploring other collections.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
