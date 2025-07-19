
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { MainLayoutWithPlayer } from "@/components/layout/MainLayoutWithPlayer";
import { Search, MusicIcon, UserIcon, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BeatCard } from "@/components/ui/BeatCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useCart } from "@/context/CartContext";
import { useOptimizedSearch } from "@/hooks/search/useOptimizedSearch";

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

  const handleTabChange = (value: 'all' | 'beats' | 'producers') => {
    setActiveTab(value);
  };

  const handleSearch = (e: React.FormEvent) => {
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
    <MainLayoutWithPlayer>
      <div className={cn(
        "container py-4 sm:py-6",
        isMobile ? "px-3 sm:px-6" : ""
      )}>
        <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Search</h1>
        
        <div className="relative mb-4 sm:mb-6">
          <form onSubmit={handleSearch} className="relative flex items-center">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
            <Input 
              id="search-input"
              type="text"
              placeholder="Search beats, producers, genres, moods..."
              className="pl-10 pr-12 py-5 h-10 sm:h-12 bg-background border-input"
              value={searchTerm}
              onChange={(e) => updateSearchTerm(e.target.value)}
              autoFocus
            />
            {searchTerm && (
              <Button 
                type="button"
                variant="ghost" 
                size="sm" 
                className="absolute right-2 rounded-full"
                onClick={() => updateSearchTerm("")}
              >
                Clear
              </Button>
            )}
          </form>
        </div>

        <Tabs defaultValue="all" value={activeTab} onValueChange={handleTabChange} className="mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
            <TabsList className="tabs-mobile w-full sm:w-auto">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="beats">Beats</TabsTrigger>
              <TabsTrigger value="producers">Producers</TabsTrigger>
            </TabsList>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2 w-full sm:w-auto"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={16} />
              <span>Filter</span>
            </Button>
          </div>
          
          {/* Genre filters */}
          <div className="mb-4 overflow-x-auto pb-2">
            <div className="flex gap-2 flex-nowrap">
              {genres.map((genre) => (
                <Button
                  key={genre}
                  variant={filters.genre === genre ? "default" : "outline"}
                  size="sm"
                  className="rounded-full whitespace-nowrap"
                  onClick={() => handleGenreSelect(genre)}
                >
                  {genre}
                </Button>
              ))}
            </div>
          </div>
          
          {/* Mood filters */}
          {moods.length > 0 && (
            <div className="mb-4 overflow-x-auto pb-2">
              <h3 className="text-sm font-medium mb-2">Mood</h3>
              <div className="flex gap-2 flex-nowrap">
                {moods.slice(0, 12).map((mood) => (
                  <Button
                    key={mood}
                    variant={filters.mood === mood ? "default" : "outline"}
                    size="sm"
                    className="rounded-full whitespace-nowrap"
                    onClick={() => {
                      if (filters.mood === mood) {
                        updateFilters({ mood: undefined });
                      } else {
                        updateFilters({ mood });
                      }
                    }}
                  >
                    {mood}
                  </Button>
                ))}
              </div>
            </div>
          )}
          
          {showFilters && (
            <div className="bg-card rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 animate-slide-down shadow-sm border">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
                <div>
                  <label className="text-xs font-medium mb-1 block">Price Range</label>
                  <select 
                    className="w-full rounded-md bg-muted border-border p-2 text-xs sm:text-sm"
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === 'under-5000') {
                        updateFilters({ minPrice: 0, maxPrice: 5000 });
                      } else if (value === '5000-10000') {
                        updateFilters({ minPrice: 5000, maxPrice: 10000 });
                      } else if (value === '10000-15000') {
                        updateFilters({ minPrice: 10000, maxPrice: 15000 });
                      } else if (value === 'over-15000') {
                        updateFilters({ minPrice: 15000, maxPrice: undefined });
                      } else {
                        updateFilters({ minPrice: undefined, maxPrice: undefined });
                      }
                    }}
                  >
                    <option value="">Any price</option>
                    <option value="under-5000">Under ₦5,000</option>
                    <option value="5000-10000">₦5,000 - ₦10,000</option>
                    <option value="10000-15000">₦10,000 - ₦15,000</option>
                    <option value="over-15000">Over ₦15,000</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Genre</label>
                  <select 
                    className="w-full rounded-md bg-muted border-border p-2 text-xs sm:text-sm"
                    value={filters.genre || ""}
                    onChange={(e) => updateFilters({ genre: e.target.value || undefined })}
                  >
                    <option value="">All genres</option>
                    {genres.map((genre) => (
                      <option key={genre} value={genre}>{genre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Sort By</label>
                  <select 
                    className="w-full rounded-md bg-muted border-border p-2 text-xs sm:text-sm"
                    value={filters.sortBy || 'relevance'}
                    onChange={(e) => handleSortChange(e.target.value as any)}
                  >
                    <option value="relevance">Most Relevant</option>
                    <option value="newest">Newest</option>
                    <option value="popular">Most Popular</option>
                    <option value="price_low">Price: Low to High</option>
                    <option value="price_high">Price: High to Low</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Mood</label>
                  <select 
                    className="w-full rounded-md bg-muted border-border p-2 text-xs sm:text-sm"
                    value={filters.mood || ""}
                    onChange={(e) => updateFilters({ mood: e.target.value || undefined })}
                  >
                    <option value="">All moods</option>
                    {moods.map((mood) => (
                      <option key={mood} value={mood}>{mood}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">BPM Range</label>
                  <select 
                    className="w-full rounded-md bg-muted border-border p-2 text-xs sm:text-sm"
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '80-90') {
                        updateFilters({ bpmMin: 80, bpmMax: 90 });
                      } else if (value === '90-100') {
                        updateFilters({ bpmMin: 90, bpmMax: 100 });
                      } else if (value === '100-120') {
                        updateFilters({ bpmMin: 100, bpmMax: 120 });
                      } else if (value === '120+') {
                        updateFilters({ bpmMin: 120, bpmMax: undefined });
                      } else {
                        updateFilters({ bpmMin: undefined, bpmMax: undefined });
                      }
                    }}
                  >
                    <option value="">Any BPM</option>
                    <option value="80-90">80-90 BPM</option>
                    <option value="90-100">90-100 BPM</option>
                    <option value="100-120">100-120 BPM</option>
                    <option value="120+">120+ BPM</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end mt-3 sm:mt-4">
                <Button 
                  size="sm" 
                  className="shadow-sm text-xs sm:text-sm"
                  onClick={handleSearch}
                >
                  Apply Filters
                </Button>
              </div>
            </div>
          )}

          <TabsContent value="all" className="mt-0">
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                {[...Array(10)].map((_, i) => (
                  <div 
                    key={i} 
                    className="bg-card rounded-lg aspect-square animate-pulse"
                    style={{ animationDelay: `${i * 0.1}s` }}
                  />
                ))}
              </div>
            ) : showNoResults ? (
              <div className="text-center py-8 sm:py-12">
                <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-muted mb-3 sm:mb-4">
                  <Search size={24} className="text-muted-foreground" />
                </div>
                <h3 className="text-base sm:text-lg font-medium mb-1 sm:mb-2">No results found</h3>
                <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6">
                  We couldn't find anything matching "{debouncedSearchTerm}". Try different keywords.
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Beats Results */}
                {beats.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Beats</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
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

                {/* Producers Results */}
                {producers.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Producers</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {producers.map((producer) => (
                        <Link 
                          key={producer.id}
                          to={`/producer/${producer.id}`}
                          className="bg-card rounded-lg p-4 flex flex-col items-center text-center hover:shadow-md transition-shadow"
                        >
                          <div className="w-24 h-24 rounded-full bg-muted overflow-hidden mb-3">
                            <img 
                              src={producer.profile_picture || '/placeholder.svg'} 
                              alt={producer.stage_name || producer.full_name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <h3 className="font-medium">{producer.stage_name || producer.full_name}</h3>
                          <p className="text-sm text-muted-foreground mb-2">Producer</p>
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{producer.country || 'Unknown location'}</p>
                          <Button variant="outline" size="sm" className="w-full">View Profile</Button>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="beats" className="mt-0">
            {isLoadingBeats ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {[...Array(10)].map((_, i) => (
                  <div 
                    key={i} 
                    className="bg-card rounded-lg aspect-square animate-pulse"
                    style={{ animationDelay: `${i * 0.1}s` }}
                  />
                ))}
              </div>
            ) : beats.length > 0 ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                  {beats.map((beat) => (
                    <BeatCard 
                      key={beat.id} 
                      beat={beat}
                      isInCart={isInCart(beat.id)}
                    />
                  ))}
                </div>
                
                {/* Load more button */}
                {hasNextPage && (
                  <div className="flex justify-center mt-6">
                    <Button 
                      onClick={loadMoreBeats} 
                      disabled={isFetchingNextPage}
                      variant="outline"
                    >
                      {isFetchingNextPage ? 'Loading...' : 'Load More'}
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                  <MusicIcon size={24} className="text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">No beats found</h3>
                <p className="text-muted-foreground mb-6">
                  We couldn't find any beats matching "{debouncedSearchTerm}".
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="producers" className="mt-0">
            {isLoadingProducers ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <div 
                    key={i} 
                    className="bg-card rounded-lg h-48 animate-pulse"
                    style={{ animationDelay: `${i * 0.1}s` }}
                  />
                ))}
              </div>
            ) : producers.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {producers.map((producer) => (
                  <Link 
                    key={producer.id}
                    to={`/producer/${producer.id}`}
                    className="bg-card rounded-lg p-4 flex flex-col items-center text-center hover:shadow-md transition-shadow"
                  >
                    <div className="w-24 h-24 rounded-full bg-muted overflow-hidden mb-3">
                      <img 
                        src={producer.profile_picture || '/placeholder.svg'} 
                        alt={producer.stage_name || producer.full_name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h3 className="font-medium">{producer.stage_name || producer.full_name}</h3>
                    <p className="text-sm text-muted-foreground mb-2">Producer</p>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{producer.country || 'Unknown location'}</p>
                    <Button variant="outline" size="sm" className="w-full">View Profile</Button>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                  <UserIcon size={24} className="text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">No producers found</h3>
                <p className="text-muted-foreground mb-6">
                  We couldn't find any producers matching "{debouncedSearchTerm}".
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {!searchTerm && !filters.genre && (
          <div className="mt-6 sm:mt-8">
            <h2 className="text-base sm:text-lg font-medium mb-3 sm:mb-4">Popular Searches</h2>
            <div className="flex flex-wrap gap-2">
              {['Afrobeat', 'Hip Hop', 'Amapiano', 'R&B', 'Trap', 'Chill', 'Dancehall'].map((term) => (
                <Button
                  key={term}
                  variant="outline"
                  size="sm"
                  className="rounded-full text-xs"
                  onClick={() => updateSearchTerm(term)}
                >
                  {term}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </MainLayoutWithPlayer>
  );
}
