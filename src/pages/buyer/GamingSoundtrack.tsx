import { useEffect, useState, useMemo } from "react";
import { MainLayoutWithPlayer } from "@/components/layout/MainLayoutWithPlayer";
import { BeatCardCompact } from "@/components/marketplace/BeatCardCompact";
import { SoundpackCard } from "@/components/marketplace/SoundpackCard";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { mapSupabaseBeatToBeat } from "@/services/beats/utils";
import { SupabaseBeat } from "@/services/beats/types";
import { Beat } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function GamingSoundtrack() {
  const [displayCount, setDisplayCount] = useState(30);
  const [sortBy, setSortBy] = useState("newest");
  const { isInCart } = useCart();

  // Query for Gaming & Soundtrack beats
  const { data: allGamingBeats = [], isLoading } = useQuery({
    queryKey: ["gaming-soundtrack-beats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("beats")
        .select(
          `
          id,
          title,
          producer_id,
          users (
            full_name,
            stage_name
          ),
          cover_image,
          audio_preview,
          audio_file,
          basic_license_price_local,
          basic_license_price_diaspora,
          premium_license_price_local,
          premium_license_price_diaspora,
          exclusive_license_price_local,
          exclusive_license_price_diaspora,
          custom_license_price_local,
          custom_license_price_diaspora,
          genre,
          track_type,
          bpm,
          tags,
          description,
          upload_date,
          favorites_count,
          purchase_count,
          status,
          is_featured,
          is_trending,
          is_weekly_pick,
          category,
          key,
          plays
        `,
        )
        .eq("status", "published")
        .eq("category", "Gaming & Soundtrack")
        .order("upload_date", { ascending: false })
        .limit(200);

      if (error) throw error;

      return data.map((beat) => mapSupabaseBeatToBeat(beat as SupabaseBeat));
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    placeholderData: keepPreviousData,
  }) as { data: Beat[]; isLoading: boolean };

  // Query for ALL published soundpacks
  const { data: gamingSoundpacks = [], isLoading: isLoadingSoundpacks } = useQuery({
    queryKey: ["all-published-soundpacks"],
    queryFn: async () => {
      // First, get all published soundpacks
      const { data: soundpacksData, error: soundpacksError } = await supabase
        .from("soundpacks")
        .select(
          `
          id,
          title,
          description,
          cover_art_url,
          producer_id,
          file_count,
          basic_license_price_local,
          basic_license_price_diaspora,
          premium_license_price_local,
          premium_license_price_diaspora,
          exclusive_license_price_local,
          exclusive_license_price_diaspora,
          custom_license_price_local,
          custom_license_price_diaspora,
          category,
          published,
          created_at
        `,
        )
        .eq("published", true)
        .order("created_at", { ascending: false });

      if (soundpacksError) throw soundpacksError;
      if (!soundpacksData || soundpacksData.length === 0) return [];

      // Get unique producer IDs
      const producerIds = [...new Set(soundpacksData.map((pack) => pack.producer_id))];

      // Fetch producer details separately
      const { data: producersData, error: producersError } = await supabase
        .from("users")
        .select("id, full_name, stage_name")
        .in("id", producerIds);

      if (producersError) {
        console.error("Error fetching producers:", producersError);
        // Continue without producer names rather than failing
      }

      // Create a map of producer details
      const producersMap = new Map(
        (producersData || []).map((producer) => [
          producer.id,
          { full_name: producer.full_name, stage_name: producer.stage_name },
        ]),
      );

      // Merge soundpack data with producer details
      return soundpacksData.map((pack) => ({
        ...pack,
        users: producersMap.get(pack.producer_id) || null,
      }));
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Memoized sorting and slicing
  const gamingBeats = useMemo(() => {
    let sortedBeats = [...allGamingBeats];

    switch (sortBy) {
      case "newest":
        sortedBeats.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case "price-low":
        sortedBeats.sort((a, b) => (a.basic_license_price_local || 0) - (b.basic_license_price_local || 0));
        break;
      case "price-high":
        sortedBeats.sort((a, b) => (b.basic_license_price_local || 0) - (a.basic_license_price_local || 0));
        break;
      case "popular":
        sortedBeats.sort((a, b) => (b.favorites_count || 0) - (a.favorites_count || 0));
        break;
      default:
        break;
    }

    return sortedBeats.slice(0, displayCount);
  }, [allGamingBeats, displayCount, sortBy]);

  useEffect(() => {
    document.title = "Gaming & Soundtrack Beats | OrderSOUNDS";
  }, []);

  const loadMoreBeats = () => {
    setDisplayCount((prevCount) => Math.min(prevCount + 30, allGamingBeats.length));
  };

  const hasMore = displayCount < allGamingBeats.length;

  return (
    <MainLayoutWithPlayer activeTab="gaming-soundtrack">
      <div className="container py-4 md:py-8 px-4 md:px-6">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">Gaming & Soundtrack</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Discover beats & Soundpacks that are perfect for gaming content, soundtracks, and cinematic projects
          </p>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {allGamingBeats.length > 0 && (
            <p className="text-sm text-muted-foreground">
              Showing {gamingBeats.length} of {allGamingBeats.length} beats
            </p>
          )}
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
            {/* Soundpacks Section */}
            {gamingSoundpacks.length > 0 && (
              <div className="mb-12">
                <h2 className="text-xl md:text-2xl font-bold mb-4">Soundpacks</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {gamingSoundpacks.map((pack: any) => (
                    <SoundpackCard
                      key={pack.id}
                      soundpack={{
                        id: pack.id,
                        title: pack.title,
                        description: pack.description,
                        cover_art_url: pack.cover_art_url,
                        producer_id: pack.producer_id,
                        producer_name: pack.users?.stage_name || pack.users?.full_name || "Unknown",
                        file_count: pack.file_count,
                        basic_license_price_local: pack.basic_license_price_local,
                        basic_license_price_diaspora: pack.basic_license_price_diaspora,
                        premium_license_price_local: pack.premium_license_price_local,
                        premium_license_price_diaspora: pack.premium_license_price_diaspora,
                        exclusive_license_price_local: pack.exclusive_license_price_local,
                        exclusive_license_price_diaspora: pack.exclusive_license_price_diaspora,
                        custom_license_price_local: pack.custom_license_price_local,
                        custom_license_price_diaspora: pack.custom_license_price_diaspora,
                        published: pack.published,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Beats Section */}
            <div className="mb-4">
              <h2 className="text-xl md:text-2xl font-bold mb-4">Beats</h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {gamingBeats.map((beat) => (
                <BeatCardCompact key={beat.id} beat={beat} />
              ))}
            </div>

            {hasMore && (
              <div className="flex justify-center mt-8">
                <Button variant="outline" size="lg" onClick={loadMoreBeats} className="gap-2">
                  Load More <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
            )}

            {gamingBeats.length === 0 && gamingSoundpacks.length === 0 && (
              <div className="text-center py-20">
                <div className="max-w-md mx-auto">
                  <div className="text-6xl mb-4">🎮</div>
                  <h3 className="text-xl font-semibold mb-2">No Gaming Content Yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Be the first to discover amazing gaming beats and soundpacks!
                  </p>
                  <Button variant="outline" onClick={() => (window.location.href = "/new")}>
                    Explore All Beats
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </MainLayoutWithPlayer>
  );
}
