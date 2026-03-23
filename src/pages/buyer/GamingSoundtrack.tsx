
import { useEffect, useState, useMemo } from "react";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { BeatCardCompact } from "@/components/marketplace/BeatCardCompact";
import { SoundpackCard } from "@/components/marketplace/SoundpackCard";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { ChevronDown, Music, Package } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Beat } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function GamingSoundtrack() {
  const [displayCount, setDisplayCount] = useState(20);
  const [sortBy, setSortBy] = useState("newest");
  const { isInCart } = useCart();

  // Query for Gaming & Soundtrack beats
  const { data: allGamingBeats = [], isLoading: beatsLoading } = useQuery({
    queryKey: ["gaming-soundtrack-beats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("beats")
        .select(`
          id,
          title,
          producer_id,
          cover_image,
          audio_preview,
          audio_file,
          basic_license_price_local,
          basic_license_price_diaspora,
          genre,
          category,
          track_type,
          bpm,
          status,
          is_featured,
          upload_date,
          tags,
          favorites_count,
          purchase_count
        `)
        .or('genre.ilike.%gaming%,genre.ilike.%soundtrack%,category.ilike.%gaming%,category.ilike.%soundtrack%,tags.cs.{"gaming"},tags.cs.{"soundtrack"},tags.cs.{"cinematic"}')
        .eq("status", "published");

      if (error) throw error;
      if (!data || data.length === 0) return [];

      // Fetch producer names
      const producerIds = Array.from(new Set(data.map((b: any) => b.producer_id)));
      const { data: producers } = await supabase
        .from('users')
        .select('id, full_name, stage_name')
        .in('id', producerIds);

      const producerMap = (producers || []).reduce((acc: any, curr) => {
        acc[curr.id] = curr.stage_name || curr.full_name || 'Unknown Producer';
        return acc;
      }, {});

      return data.map((b: any) => ({
        id: b.id,
        title: b.title,
        producer_id: b.producer_id,
        producer_name: producerMap[b.producer_id] || 'Unknown Producer',
        cover_image_url: b.cover_image || '',
        preview_url: b.audio_preview || b.audio_file || '',
        full_track_url: b.audio_file || '',
        basic_license_price_local: b.basic_license_price_local,
        basic_license_price_diaspora: b.basic_license_price_diaspora,
        genre: b.genre,
        category: b.category,
        track_type: b.track_type || 'beat',
        bpm: b.bpm,
        status: b.status || 'published',
        is_featured: b.is_featured,
        created_at: b.upload_date || new Date().toISOString(),
        tags: b.tags,
        favorites_count: b.favorites_count,
        purchase_count: b.purchase_count,
      } as Beat));
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Query for Gaming & Soundtrack soundpacks
  const { data: gamingSoundpacks = [], isLoading: packsLoading } = useQuery({
    queryKey: ["gaming-soundtrack-packs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("soundpacks")
        .select(`
          id,
          title,
          description,
          producer_id,
          cover_art_url,
          file_count,
          published,
          purchase_count,
          basic_license_price_local,
          basic_license_price_diaspora,
          premium_license_price_local,
          premium_license_price_diaspora,
          exclusive_license_price_local,
          exclusive_license_price_diaspora,
          category
        `)
        .eq("published", true);

      if (error) throw error;

      if (data && data.length > 0) {
        const producerIds = Array.from(new Set(data.map(p => p.producer_id)));
        const { data: producers } = await supabase
          .from('users')
          .select('id, full_name, stage_name')
          .in('id', producerIds);

        const producerMap = (producers || []).reduce((acc: any, curr) => {
          acc[curr.id] = curr.stage_name || curr.full_name || 'Unknown Producer';
          return acc;
        }, {});

        return data.map(p => ({
          ...p,
          producer_name: producerMap[p.producer_id]
        }));
      }

      return data || [];
    }
  });


  // Memoized sorting and slicing
  const sortedBeats = useMemo(() => {
    let result = [...allGamingBeats];
    if (sortBy === "popular") {
      result.sort((a, b) => (b.purchase_count || 0) - (a.purchase_count || 0));
    } else if (sortBy === "oldest") {
      result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    } else {
      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    return result.slice(0, displayCount);
  }, [allGamingBeats, sortBy, displayCount]);

  const loadMore = () => {
    setDisplayCount(prev => Math.min(prev + 20, allGamingBeats.length));
  };

  const hasMore = displayCount < allGamingBeats.length;

  return (
    <div className="container py-8 md:py-12 px-4 md:px-6 max-w-7xl">
      <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#9A3BDC]/10 border border-[#9A3BDC]/20 text-[#9A3BDC] text-[10px] font-black uppercase tracking-widest italic">
            <Music size={12} />
            Immersive Collection
          </div>
          <h1 className="text-2xl sm:text-4xl md:text-6xl font-black text-white tracking-tighter uppercase italic leading-none">
            Gaming & Soundtrack
          </h1>
          <p className="text-base md:text-lg text-white/40 italic font-medium max-w-2xl">
            Epic scores, ambient soundscapes, and high-energy gaming beats designed for creators.
          </p>
        </div>
        
        <div className="flex items-center gap-3 bg-white/[0.02] p-2 rounded-2xl border border-white/5">
          <span className="text-[10px] font-black uppercase tracking-widest text-white/20 ml-2">Sort by</span>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[160px] h-11 rounded-xl bg-white/5 border-none font-bold italic uppercase tracking-tighter text-xs">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className="bg-[#0d101b] border-white/10 rounded-xl overflow-hidden">
              <SelectItem value="newest" className="font-bold italic uppercase tracking-tighter text-xs focus:bg-white/5">Newest</SelectItem>
              <SelectItem value="popular" className="font-bold italic uppercase tracking-tighter text-xs focus:bg-white/5">Most Popular</SelectItem>
              <SelectItem value="oldest" className="font-bold italic uppercase tracking-tighter text-xs focus:bg-white/5">Oldest First</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="beats" className="space-y-8 md:space-y-12">
        <div className="flex items-center justify-center sm:justify-start">
          <TabsList className="bg-white/5 border-white/10 h-12 md:h-14 p-1 rounded-2xl w-full sm:w-auto">
            <TabsTrigger 
              value="beats" 
              className="flex-1 sm:flex-none px-4 sm:px-8 h-10 md:h-12 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest italic data-[state=active]:bg-[#9A3BDC] data-[state=active]:text-white"
            >
              <Music className="w-3.5 h-3.5 mr-2" />
              Beats
            </TabsTrigger>
            <TabsTrigger 
              value="soundpacks" 
              className="flex-1 sm:flex-none px-4 sm:px-8 h-10 md:h-12 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest italic data-[state=active]:bg-[#9A3BDC] data-[state=active]:text-white"
            >
              <Package className="w-3.5 h-3.5 mr-2" />
              Soundpacks
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="beats" className="space-y-6 md:space-y-8 mt-0 border-none p-0 outline-none">
          <div className="flex items-center gap-3">
            <div className="h-1.5 w-1.5 rounded-full bg-[#9A3BDC] shadow-[0_0_10px_#9A3BDC]" />
            <h2 className="text-lg md:text-xl font-black text-white tracking-tight uppercase italic text-white/60">Digital Streams</h2>
          </div>

          {beatsLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="aspect-square rounded-[2rem] bg-white/5" />
                  <div className="space-y-2 px-2">
                    <Skeleton className="h-4 w-3/4 bg-white/5" />
                    <Skeleton className="h-3 w-1/2 bg-white/5" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {sortedBeats.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                  {sortedBeats.map((beat) => (
                    <BeatCardCompact key={beat.id} beat={beat} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 bg-white/[0.01] border border-dashed border-white/5 rounded-[3rem] text-center">
                  <Music size={40} className="text-white/10 mb-4" />
                  <h3 className="text-xl font-bold italic text-white/60">No beats available</h3>
                  <p className="text-sm text-white/20 max-w-xs mx-auto mt-2 italic">
                    We currently don't have any beats in this category.
                  </p>
                </div>
              )}

              {hasMore && (
                <div className="mt-12 flex justify-center">
                  <Button 
                    variant="ghost" 
                    onClick={loadMore}
                    className="rounded-2xl border border-white/5 bg-white/5 text-white/40 hover:text-white px-12 h-14 font-black uppercase italic tracking-tighter"
                  >
                    Load More Content
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="soundpacks" className="space-y-6 md:space-y-8 mt-0 border-none p-0 outline-none">
          <div className="flex items-center gap-3">
            <div className="h-1.5 w-1.5 rounded-full bg-[#9A3BDC] shadow-[0_0_10px_#9A3BDC]" />
            <h2 className="text-lg md:text-xl font-black text-white tracking-tight uppercase italic text-white/60">Bundled Assets</h2>
          </div>
          
          {packsLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-48 md:h-64 rounded-[1.5rem] md:rounded-[2rem] bg-white/5" />
              ))}
            </div>
          ) : gamingSoundpacks.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {gamingSoundpacks.map((pack: any) => (
                <SoundpackCard key={pack.id} soundpack={pack} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 bg-white/[0.01] border border-dashed border-white/5 rounded-[3rem] text-center">
              <Package size={40} className="text-white/10 mb-4" />
              <h3 className="text-lg md:text-xl font-bold italic text-white/60">No soundpacks found</h3>
              <p className="text-sm text-white/20 max-w-xs mx-auto mt-2 italic">
                Curated gaming soundpacks will be available soon.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
