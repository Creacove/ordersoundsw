import { Link } from "react-router-dom";
import { Play, ShoppingCart } from "lucide-react";
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
    <section className="w-full bg-[#111]/80 backdrop-blur-sm p-6 rounded-lg border border-white/[0.02]">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-white">🎮 Gaming & Soundtrack Beats</h2>
          <Badge className="bg-blue-600/20 text-blue-500 border-0">
            Latest
          </Badge>
        </div>
        <Link to="/gaming-soundtrack">
          <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300">
            See More
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="flex gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.02]">
              <Skeleton className="h-16 w-16 rounded-lg" />
              <div className="flex-1">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-3 w-32 mb-2" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </div>
      ) : gamingBeats.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {gamingBeats.map((beat) => (
            <Link 
              key={beat.id} 
              to={`/beat/${beat.id}`}
              className="group"
            >
              <div className="flex gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.02] hover:bg-white/[0.04] transition-colors">
                <div className="relative h-16 w-16 flex-shrink-0">
                  <img
                    src={beat.cover_image_url || "/placeholder.svg"}
                    alt={beat.title}
                    className="h-16 w-16 object-cover rounded-lg"
                  />
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute inset-0 m-auto h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 hover:bg-black/75"
                    onClick={() => playBeat(beat)}
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-white truncate">{beat.title}</h3>
                  <p className="text-sm text-gray-400 truncate mb-2">{beat.producer_name}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">
                        🎮 Gaming
                      </span>
                    </div>
                    <PriceTag
                      localPrice={beat.basic_license_price_local}
                      diasporaPrice={beat.basic_license_price_diaspora}
                      size="sm"
                      className="bg-transparent"
                    />
                  </div>
                </div>
                
                <div className="flex flex-col justify-between items-end py-1 gap-2">
                  <ToggleFavoriteButton beatId={beat.id} size="sm" />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={() => toggleCartItem(beat, 'basic')}
                  >
                    <ShoppingCart className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-400">No gaming & soundtrack beats available yet.</p>
          <p className="text-sm text-gray-500 mt-1">Be the first to upload a gaming beat!</p>
        </div>
      )}
    </section>
  );
};