import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, MusicIcon, UserIcon, Filter, X, ChevronRight, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BeatCard } from "@/components/ui/BeatCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useCart } from "@/context/CartContext";
import { useOptimizedSearch } from "@/hooks/search/useOptimizedSearch";
import { Badge } from "@/components/ui/badge";

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || "";
  const initialGenre = searchParams.get('genre') || "";
  
  const [showFilters, setShowFilters] = useState(false);
  const { isInCart } = useCart();
  const isMobile = useIsMobile();

  const {
    searchTerm,
    debouncedSearchTerm,
    filters,
    activeTab,
    beats,
    producers,
    genres,
    moods,
    isLoading,
    isLoadingBeats,
    isLoadingProducers,
    hasResults,
    showNoResults,
    updateSearchTerm,
    updateFilters,
    clearFilters,
    setActiveTab,
    loadMoreBeats,
    hasNextPage,
    isFetchingNextPage
  } = useOptimizedSearch();

  // Set the search term when query parameter changes
  useEffect(() => {
    if (initialQuery) {
      updateSearchTerm(initialQuery);
    }
    if (initialGenre) {
      updateFilters({ genre: initialGenre });
    }
  }, [initialQuery, initialGenre, updateSearchTerm, updateFilters]);

  const handleTabChange = (value: string) => {
    setActiveTab(value as any);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Update URL parameters
    const params = new URLSearchParams();
    if (searchTerm.trim()) {
      params.set('q', searchTerm.trim());
    }
    if (filters.genre) {
      params.set('genre', filters.genre);
    }
    if (filters.mood) {
      params.set('mood', filters.mood);
    }
    setSearchParams(params);
  };

  const handleGenreSelect = (genre: string) => {
    if (filters.genre === genre) {
      updateFilters({ genre: undefined });
    } else {
      updateFilters({ genre });
    }
  };

  const handleSortChange = (sortBy: 'relevance' | 'newest' | 'popular' | 'price_low' | 'price_high') => {
    updateFilters({ sortBy });
  };

  return (
    <div className="min-h-screen bg-[#030407]">
      <div className="container py-12 px-6 md:px-8 max-w-7xl mx-auto">
        {/* Command Center Search Bar */}
        <div className="flex flex-col items-center mb-16">
          <Badge className="mb-6 bg-white/5 text-white/60 border-white/10 px-4 py-1.5 rounded-full text-[10px] uppercase tracking-[0.2em] font-bold">
            Sonic Intelligence Search
          </Badge>
          
          <div className="w-full max-w-3xl relative">
            <form onSubmit={handleSearchSubmit} className="relative group">
              <div className="absolute inset-0 bg-accent/20 blur-3xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-700 -z-10" />
              <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 text-white/20 group-focus-within:text-accent transition-colors duration-300" size={24} />
              <Input 
                id="search-input"
                type="text"
                placeholder="Find your sound: beats, producers, genres..."
                className="w-full pl-16 pr-20 py-8 h-20 text-xl md:text-2xl bg-white/[0.03] border-white/10 rounded-[2.5rem] focus:ring-accent/50 focus:border-accent transition-all duration-300 placeholder:text-white/10 text-white font-medium"
                value={searchTerm}
                onChange={(e) => updateSearchTerm(e.target.value)}
                autoFocus
              />
              {searchTerm && (
                <button 
                  type="button"
                  className="absolute right-6 top-1/2 transform -translate-y-1/2 bg-white/5 hover:bg-white/10 p-2 rounded-full transition-colors duration-300"
                  onClick={() => updateSearchTerm("")}
                >
                  <X size={20} className="text-white/40" />
                </button>
              )}
            </form>
          </div>
          
          <div className="flex flex-wrap justify-center items-center gap-3 mt-8">
            <span className="text-white/20 text-xs font-bold uppercase tracking-widest mr-2">Quick Access:</span>
            {['Afrobeat', 'Hip Hop', 'Trap', 'Amapiano'].map((term) => (
              <button
                key={term}
                onClick={() => updateSearchTerm(term)}
                className="px-4 py-1.5 rounded-full bg-white/[0.02] border border-white/5 text-white/40 hover:text-white hover:border-white/20 hover:bg-white/5 transition-all text-xs font-bold"
              >
                {term}
              </button>
            ))}
          </div>
        </div>

        <Tabs defaultValue="all" value={activeTab} onValueChange={handleTabChange} className="mb-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 border-b border-white/5 pb-6">
            <TabsList className="bg-transparent h-auto p-0 gap-8">
              <TabsTrigger 
                value="all" 
                className="p-0 bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-white text-white/40 text-lg font-bold transition-all relative after:absolute after:bottom-[-25px] after:left-0 after:right-0 after:h-[2px] after:bg-accent after:opacity-0 data-[state=active]:after:opacity-100"
              >
                All Results
              </TabsTrigger>
              <TabsTrigger 
                value="beats" 
                className="p-0 bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-white text-white/40 text-lg font-bold transition-all relative after:absolute after:bottom-[-25px] after:left-0 after:right-0 after:h-[2px] after:bg-accent after:opacity-0 data-[state=active]:after:opacity-100"
              >
                Beats
              </TabsTrigger>
              <TabsTrigger 
                value="producers" 
                className="p-0 bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-white text-white/40 text-lg font-bold transition-all relative after:absolute after:bottom-[-25px] after:left-0 after:right-0 after:h-[2px] after:bg-accent after:opacity-0 data-[state=active]:after:opacity-100"
              >
                Producers
              </TabsTrigger>
            </TabsList>
            
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  "rounded-2xl h-11 px-6 font-bold transition-all duration-300 gap-2 border border-white/5",
                  showFilters ? "bg-white/10 text-white" : "text-white/40 hover:text-white hover:bg-white/5"
                )}
              >
                <Filter size={18} />
                Filters
                {Object.values(filters).filter(Boolean).length > 0 && (
                  <span className="ml-1 bg-accent text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px]">
                    {Object.values(filters).filter(Boolean).length}
                  </span>
                )}
              </Button>
            </div>
          </div>
          
          {showFilters && (
            <div className="bg-white/[0.02] border border-white/10 rounded-[2rem] p-8 mb-12 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Genre</label>
                  <div className="flex flex-wrap gap-2">
                    {genres.map((genre) => (
                      <button
                        key={genre}
                        onClick={() => handleGenreSelect(genre)}
                        className={cn(
                          "px-3 py-1.5 rounded-xl text-xs font-bold transition-all border",
                          filters.genre === genre 
                            ? "bg-accent/20 text-accent border-accent/50" 
                            : "bg-white/5 text-white/60 border-white/5 hover:border-white/20"
                        )}
                      >
                        {genre}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Mood</label>
                  <div className="flex flex-wrap gap-2">
                    {moods.slice(0, 8).map((mood) => (
                      <button
                        key={mood}
                        onClick={() => updateFilters({ mood: filters.mood === mood ? undefined : mood })}
                        className={cn(
                          "px-3 py-1.5 rounded-xl text-xs font-bold transition-all border",
                          filters.mood === mood 
                            ? "bg-accent/20 text-accent border-accent/50" 
                            : "bg-white/5 text-white/60 border-white/5 hover:border-white/20"
                        )}
                      >
                        {mood}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Sort Preference</label>
                  <div className="flex flex-col gap-2">
                    {[
                      { l: 'Most Relevant', v: 'relevance' },
                      { l: 'Newly Listed', v: 'newest' },
                      { l: 'Most Popular', v: 'popular' },
                    ].map((opt) => (
                      <button
                        key={opt.v}
                        onClick={() => handleSortChange(opt.v as any)}
                        className={cn(
                          "text-left px-4 py-2 rounded-xl text-xs font-bold transition-all border",
                          filters.sortBy === opt.v || (!filters.sortBy && opt.v === 'relevance')
                            ? "bg-accent/20 text-accent border-accent/50" 
                            : "bg-white/5 text-white/40 border-transparent hover:bg-white/10"
                        )}
                      >
                        {opt.l}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Price Filter</label>
                  <div className="flex flex-col gap-2">
                    {[
                      { l: 'Under ₦5k', v: 'under-5000' },
                      { l: '₦5k - ₦15k', v: '5000-15000' },
                      { l: 'Over ₦15k', v: 'over-15000' },
                    ].map((opt) => (
                      <button
                        key={opt.v}
                        onClick={() => {
                          if (opt.v === 'under-5000') updateFilters({ minPrice: 0, maxPrice: 5000 });
                          else if (opt.v === '5000-15000') updateFilters({ minPrice: 5000, maxPrice: 15000 });
                          else updateFilters({ minPrice: 15000, maxPrice: undefined });
                        }}
                        className={cn(
                          "text-left px-4 py-2 rounded-xl text-xs font-bold transition-all border",
                          (opt.v === 'under-5000' && filters.maxPrice === 5000) ||
                          (opt.v === '5000-15000' && filters.maxPrice === 15000) ||
                          (opt.v === 'over-15000' && filters.minPrice === 15000)
                            ? "bg-accent/20 text-accent border-accent/50" 
                            : "bg-white/5 text-white/40 border-transparent hover:bg-white/10"
                        )}
                      >
                        {opt.l}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center mt-10 pt-6 border-t border-white/5">
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-white/40 hover:text-white">
                  Reset All Filters
                </Button>
                <Button size="sm" onClick={() => setShowFilters(false)} className="rounded-xl px-8 bg-white text-black hover:bg-white/90">
                  View Results
                </Button>
              </div>
            </div>
          )}

          <TabsContent value="all" className="mt-0 focus-visible:ring-0">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-white/5 aspect-[4/5] rounded-[2rem] animate-pulse" />
                ))}
              </div>
            ) : showNoResults ? (
              <div className="text-center py-24 rounded-[3rem] bg-white/[0.02] border border-dashed border-white/10">
                <div className="bg-white/5 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search className="text-white/20 h-10 w-10" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Sound not found</h3>
                <p className="text-white/40 max-w-sm mx-auto mb-8">
                  We couldn't find matches for "{debouncedSearchTerm}". Try broadening your search or exploring popular genres.
                </p>
                <Button variant="outline" onClick={() => updateSearchTerm("")}>Clear Search</Button>
              </div>
            ) : (
              <div className="space-y-20">
                {/* Producers Segment */}
                {producers.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-3">
                        <UserIcon className="text-accent" size={20} />
                        <h3 className="text-xl font-black uppercase italic tracking-wider">Top Producers</h3>
                      </div>
                      <Link to="/producers" className="text-white/40 hover:text-white text-sm font-bold flex items-center gap-2 transition-colors">
                        Explore All <ChevronRight size={16} />
                      </Link>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      {producers.slice(0, 4).map((producer) => (
                        <Link 
                          key={producer.id}
                          to={`/producer/${producer.id}`}
                          className="group relative bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 rounded-[2.5rem] p-6 text-center transition-all duration-500 overflow-hidden"
                        >
                          <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="bg-accent/20 p-2 rounded-full backdrop-blur-md">
                              <TrendingUp size={14} className="text-accent" />
                            </div>
                          </div>
                          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-white/10 overflow-hidden mb-6 mx-auto border-4 border-white/5 group-hover:border-accent/20 transition-all duration-500">
                            <img 
                              src={producer.profile_picture || '/placeholder.svg'} 
                              alt={producer.stage_name}
                              className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                            />
                          </div>
                          <h4 className="font-bold text-lg mb-1 group-hover:text-accent transition-colors">{producer.stage_name || producer.full_name}</h4>
                          <p className="text-[10px] text-white/20 uppercase tracking-[0.2em] font-black">{producer.country || 'Global'}</p>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Beats Segment */}
                {beats.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-3">
                        <MusicIcon className="text-accent" size={20} />
                        <h3 className="text-xl font-black uppercase italic tracking-wider">Matched Beats</h3>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                      {beats.map((beat) => (
                        <BeatCard 
                          key={beat.id} 
                          beat={beat}
                          isInCart={isInCart(beat.id)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="beats" className="mt-0 focus-visible:ring-0">
            {isLoadingBeats ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-white/5 aspect-[4/5] rounded-[2rem] animate-pulse" />
                ))}
              </div>
            ) : beats.length > 0 ? (
              <div className="space-y-12">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                  {beats.map((beat) => (
                    <BeatCard 
                      key={beat.id} 
                      beat={beat}
                      isInCart={isInCart(beat.id)}
                    />
                  ))}
                </div>
                {hasNextPage && (
                  <div className="flex justify-center pt-8">
                    <Button 
                      onClick={loadMoreBeats} 
                      disabled={isFetchingNextPage}
                      variant="outline"
                      className="rounded-2xl px-12 h-14 border-white/10 hover:bg-white hover:text-black transition-all font-bold"
                    >
                      {isFetchingNextPage ? 'Extracting more...' : 'Load more sounds'}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-24">
                <p className="text-white/40 italic">No beats found for "{searchTerm}"</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="producers" className="mt-0 focus-visible:ring-0">
            {isLoadingProducers ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-white/5 h-48 rounded-[2.5rem] animate-pulse" />
                ))}
              </div>
            ) : producers.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {producers.map((producer) => (
                  <Link 
                    key={producer.id}
                    to={`/producer/${producer.id}`}
                    className="group relative bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 rounded-[2.5rem] p-6 text-center transition-all duration-500"
                  >
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-white/10 overflow-hidden mb-6 mx-auto border-4 border-white/5 group-hover:border-accent/20 transition-all duration-500">
                      <img 
                        src={producer.profile_picture || '/placeholder.svg'} 
                        alt={producer.stage_name}
                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                      />
                    </div>
                    <h4 className="font-bold text-lg mb-1 group-hover:text-accent transition-colors">{producer.stage_name || producer.full_name}</h4>
                    <p className="text-[10px] text-white/20 uppercase tracking-[0.2em] font-black">{producer.country || 'Global'}</p>
                    <div className="mt-6">
                       <Button variant="ghost" className="h-9 rounded-xl text-xs font-bold text-white/40 group-hover:text-white transition-colors bg-white/5">View Profile</Button>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-24">
                <p className="text-white/40 italic">No producers found for "{searchTerm}"</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {!searchTerm && !filters.genre && !isLoading && (
          <div className="mt-24 pt-12 border-t border-white/5">
            <h2 className="text-sm font-bold text-white/20 uppercase tracking-[0.3em] mb-8 text-center">Curated Collections</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
              {['Afrobeat', 'Amapiano', 'Hip Hop', 'Trap', 'R&B', 'Dancehall', 'Chill'].map((term) => (
                <button
                  key={term}
                  onClick={() => updateSearchTerm(term)}
                  className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:border-accent/40 hover:bg-accent/5 transition-all text-sm font-bold text-center flex flex-col items-center gap-3 group"
                >
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                    <MusicIcon size={16} className="text-white/20 group-hover:text-accent" />
                  </div>
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
