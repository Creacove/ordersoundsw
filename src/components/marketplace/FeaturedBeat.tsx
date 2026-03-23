import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Play, Pause, Sparkles, User2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fetchFeaturedBeats } from "@/services/beats/queryService";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { cn } from "@/lib/utils";

export const FeaturedBeat = () => {
  const { data: featuredBeat, isLoading } = useQuery({
    queryKey: ["featured-beat"],
    queryFn: async () => {
      const beats = await fetchFeaturedBeats(1);
      return beats[0];
    },
  });

  const { handlePlayBeat, isCurrentlyPlaying } = useAudioPlayer();

  if (isLoading) {
    return <div className="h-[350px] md:h-[450px] w-full rounded-[2rem] bg-white/[0.03] animate-pulse border border-white/5" />;
  }

  if (!featuredBeat) return null;

  const isPlaying = isCurrentlyPlaying(featuredBeat.id);

  return (
    <section className="relative w-full h-[380px] md:h-[500px] overflow-hidden rounded-[2.5rem] border border-white/10 group shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)]">
      {/* Immersive Background Image */}
      <img
        src={featuredBeat.cover_image_url || "/placeholder.svg"}
        alt={featuredBeat.title}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-105"
      />
      
      {/* Premium Gradients for Depth and Text Legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#030407] via-[#030407]/40 to-transparent opacity-95" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#030407]/90 via-[#030407]/30 to-transparent" />
      <div className="absolute inset-0 bg-accent/5 mix-blend-overlay opacity-50" />
      
      {/* Content Layer (Bottom Left) */}
      <div className="absolute inset-0 p-6 md:p-12 flex flex-col justify-end z-10">
        <div className="space-y-4 max-w-3xl">
          {/* Eyebrow */}
          <Badge className="bg-white/5 text-white/60 border border-white/10 tracking-[0.3em] uppercase text-[9px] md:text-[10px] shadow-2xl backdrop-blur-2xl px-4 py-1.5 rounded-full font-bold">
            <Sparkles className="h-3 w-3 mr-2 text-accent" />
            Spotlight Release
          </Badge>
          
          {/* Title - Massive & Bold */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1] text-balance drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]">
            {featuredBeat.title}
          </h1>
          
          {/* Minimal Meta Info */}
          <div className="flex flex-wrap items-center gap-3 text-white/80 text-sm md:text-base font-medium mt-2">
            <span className="flex items-center gap-1.5 text-white">
              <User2 className="h-4 w-4" />
              {featuredBeat.producer_name}
            </span>
            {featuredBeat.genre && (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
                <span>{featuredBeat.genre}</span>
              </>
            )}
            {featuredBeat.bpm > 0 && (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
                <span>{featuredBeat.bpm} BPM</span>
              </>
            )}
          </div>
          
          {/* Clean Action Buttons */}
          <div className="flex flex-row items-center gap-4 pt-6">
            <Button 
              size="lg" 
              rounded="full" 
              onClick={() => handlePlayBeat(featuredBeat)}
              className={cn(
                "px-8 h-12 md:h-14 font-bold shadow-2xl transition-all hover:scale-105 shrink-0",
                isPlaying ? "bg-white text-black" : "bg-accent text-white hover:bg-accent/90"
              )}
            >
              {isPlaying ? <Pause className="h-5 w-5 mr-2" /> : <Play className="h-5 w-5 mr-2 -ml-1 fill-current" />}
              <span className="truncate">{isPlaying ? "Pause Preview" : "Play Preview"}</span>
            </Button>
            <Button 
              asChild 
              variant="outline" 
              size="lg" 
              rounded="full" 
              className="border-white/10 bg-white/5 text-white hover:bg-white/15 h-12 md:h-14 px-8 backdrop-blur-2xl transition-all shrink-0 font-bold"
            >
              <Link to={`/beat/${featuredBeat.id}`}>Details</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
