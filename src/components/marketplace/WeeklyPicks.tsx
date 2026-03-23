import { Link } from "react-router-dom";
import { Play, ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { usePlayer } from "@/context/PlayerContext";
import { Button } from "@/components/ui/button";
import { ToggleFavoriteButton } from "@/components/buttons/ToggleFavoriteButton";
import { PriceTag } from "@/components/ui/PriceTag";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart } from "@/context/CartContext";
import { useBeatsQuery } from "@/hooks/useBeatsQuery";

export const WeeklyPicks = () => {
  const { currentBeat, isPlaying, playBeat } = usePlayer();
  const { toggleCartItem } = useCart();
  const { weeklyPicks, isLoading } = useBeatsQuery();
  
  // Use isLoading state from useBeatsQuery since it aggregates all loading states
  const isLoadingWeeklyPicks = isLoading;

  return (
    <section className="w-full relative py-2">
      <div className="flex items-center justify-between mb-8 px-1">
        <div className="flex items-center gap-3">
          <div className="h-8 w-1.5 bg-[#9A3BDC] rounded-full shadow-[0_0_15px_rgba(154,59,220,0.5)]" />
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Weekly Picks</h2>
          <Badge className="bg-[#9A3BDC]/10 text-[#9A3BDC] border border-[#9A3BDC]/20 px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold">
            Curated
          </Badge>
        </div>
      </div>

      {isLoadingWeeklyPicks ? (
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {weeklyPicks.map((beat) => (
            <div 
              key={beat.id} 
              className="group relative h-28 rounded-[1.5rem] bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.05] hover:border-white/10 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.3)] transition-all duration-300 overflow-hidden"
            >
              <Link to={`/beat/${beat.id}`} className="absolute inset-0 z-10" />
              
              <div className="flex items-center gap-4 p-4 h-full relative z-0">
                <div className="relative h-20 w-20 flex-shrink-0 z-20 overflow-hidden rounded-xl shadow-lg">
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
              
              <div className="flex-1 min-w-0 flex flex-col justify-center z-10">
                <h3 className="font-semibold text-white truncate text-base mb-0.5 group-hover:text-[#9A3BDC] transition-colors">{beat.title}</h3>
                <p className="text-sm text-white/50 truncate mb-3">{beat.producer_name}</p>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-[10px] bg-white/5 border-white/10 text-white/50 px-2 py-0">
                    {beat.genre?.toLowerCase()}
                  </Badge>
                  <PriceTag
                    localPrice={beat.basic_license_price_local}
                    diasporaPrice={beat.basic_license_price_diaspora}
                    size="sm"
                    className="bg-transparent font-bold !text-white"
                  />
                </div>
              </div>
              
                <div className="flex flex-col justify-between items-end py-1 gap-2 z-20">
                  <ToggleFavoriteButton beatId={beat.id} size="sm" className="h-8 w-8 text-white/30 hover:text-white" />
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
      )}
    </section>
  );
};
