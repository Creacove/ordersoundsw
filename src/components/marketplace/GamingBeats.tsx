import { Link } from "react-router-dom";
import { Play, ShoppingCart, ArrowRight, Music } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { mapSupabaseBeatToBeat } from "@/services/beats/utils";
import { SupabaseBeat } from "@/services/beats/types";
import { Badge } from "@/components/ui/badge";
import { usePlayer } from "@/context/PlayerContext";
import { Button } from "@/components/ui/button";
import { ToggleFavoriteButton } from "@/components/buttons/ToggleFavoriteButton";
import { PriceTag } from "@/components/ui/PriceTag";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart } from "@/context/CartContext";

export const GamingBeats = () => {
  const { currentBeat, isPlaying, playBeat } = usePlayer();
  const { toggleCartItem } = useCart();
  
  const { data: gamingBeats = [], isLoading } = useQuery({
    queryKey: ['gaming-beats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('beats')
        .select(`
          id,
          title,
          producer_id,
          users (
            full_name,
            stage_name
          ),
          cover_image,
          audio_preview,
          basic_license_price_local,
          basic_license_price_diaspora,
          genre,
          track_type,
          bpm,
          tags,
          upload_date,
          favorites_count,
          purchase_count,
          status,
          category
        `)
        .eq('status', 'published')
        .eq('category', 'Gaming & Soundtrack')
        .order('upload_date', { ascending: false })
        .limit(10);

      if (error) throw error;

      return data.map(beat => mapSupabaseBeatToBeat(beat as SupabaseBeat));
    }
  });

  return (
    <section className="w-full relative py-2 mb-8">
      <div className="flex items-center justify-between mb-8 px-1">
        <div className="flex items-center gap-3">
          <div className="h-8 w-1.5 bg-[#DC2626] rounded-full shadow-[0_0_15px_rgba(220,38,38,0.5)]" />
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
            Gaming & Soundtrack
          </h2>
          <Badge className="bg-[#DC2626]/10 text-[#DC2626] border border-[#DC2626]/20 px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold">
            Immersive
          </Badge>
        </div>
        <Link to="/gaming-soundtrack">
          <Button variant="ghost" size="sm" className="text-white/50 hover:text-white hover:bg-white/5 group gap-1.5 transition-all">
            See All <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="flex gap-4 p-4 rounded-[1.5rem] bg-white/[0.03] border border-white/[0.05]">
              <Skeleton className="h-20 w-20 rounded-xl" />
              <div className="flex-1 space-y-2 py-1">
                <Skeleton className="h-4 w-3/4 rounded-md" />
                <Skeleton className="h-3 w-1/2 rounded-md" />
                <div className="flex justify-between mt-4">
                  <Skeleton className="h-3.5 w-16 rounded-md" />
                  <Skeleton className="h-3.5 w-12 rounded-md" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : gamingBeats.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {gamingBeats.map((beat) => (
            <div 
              key={beat.id} 
              className="group relative h-28 rounded-[1.5rem] bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.05] hover:border-white/10 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.3)] transition-all duration-300 overflow-hidden"
            >
              <Link to={`/beat/${beat.id}`} className="absolute inset-0 z-10" />
              
              <div className="flex items-center gap-4 p-4 h-full relative z-0">
                <div className="relative h-20 w-20 flex-shrink-0 z-20 overflow-hidden rounded-xl shadow-lg border border-white/5">
                  <img
                    src={beat.cover_image_url || "/placeholder.svg"}
                    alt={beat.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 duration-300">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-10 w-10 text-white hover:scale-110 transition-transform"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        playBeat(beat);
                      }}
                    >
                      <Play className="h-6 w-6 fill-current" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex-1 min-w-0 flex flex-col justify-center z-20">
                  <h4 className="font-semibold text-white truncate text-base mb-0.5 group-hover:text-[#DC2626] transition-colors">{beat.title}</h4>
                  <p className="text-sm text-white/50 truncate mb-2">{beat.producer_name}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-white/40 font-mono tracking-tighter bg-white/5 border border-white/10 px-1.5 py-0.5 rounded leading-none">
                        {beat.bpm} BPM
                      </span>
                    </div>
                    <PriceTag
                      localPrice={beat.basic_license_price_local}
                      diasporaPrice={beat.basic_license_price_diaspora}
                      size="sm"
                      className="bg-transparent font-bold !text-white"
                    />
                  </div>
                </div>
                
                <div className="flex flex-col justify-between items-end py-1 gap-2 z-20">
                  <ToggleFavoriteButton beatId={beat.id} size="sm" className="h-8 w-8 text-white/30 hover:text-white" absolutePosition={false} />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-white/30 hover:text-white hover:bg-white/10 rounded-full"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleCartItem(beat, 'basic');
                    }}
                  >
                    <ShoppingCart className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white/[0.02] border border-dashed border-white/10 rounded-[2rem]">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/5 mb-4 mb-4">
            <Music className="h-6 w-6 text-white/20" />
          </div>
          <p className="text-white font-medium">No gaming soundtracks yet</p>
          <p className="text-white/40 text-sm mt-1">Be the first to upload an epic score!</p>
        </div>
      )}
    </section>
  );
};