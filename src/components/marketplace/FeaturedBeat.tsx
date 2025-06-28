
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { fetchFeaturedBeats } from "@/services/beats/queryService";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { Play, Pause } from "lucide-react";

export const FeaturedBeat = () => {
  const { data: featuredBeat, isLoading } = useQuery({
    queryKey: ['featured-beat'],
    queryFn: async () => {
      const beats = await fetchFeaturedBeats(1);
      return beats[0];
    }
  });

  const { handlePlayBeat, isCurrentlyPlaying } = useAudioPlayer();

  if (isLoading) {
    return (
      <div className="w-full h-[300px] rounded-lg bg-muted/40 animate-pulse mb-8 flex items-center justify-center">
        <div className="text-muted-foreground">Loading featured beat...</div>
      </div>
    );
  }

  if (!featuredBeat) return null;

  const isPlaying = isCurrentlyPlaying(featuredBeat.id);

  const handleListenNow = () => {
    handlePlayBeat(featuredBeat);
  };

  return (
    <section className="relative w-full h-[300px] rounded-lg overflow-hidden mb-8">
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${featuredBeat.cover_image_url || '/placeholder.svg'})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20" />
      </div>
      
      <div className="relative h-full flex flex-col justify-end p-6 text-white">
        <div className="bg-purple-600 text-white text-xs px-3 py-1 rounded-full w-fit mb-3">
          Featured Beat
        </div>
        <h1 className="text-3xl font-bold mb-1">{featuredBeat.title}</h1>
        <p className="text-base opacity-90 mb-2">{featuredBeat.producer_name}</p>
        <div className="flex items-center gap-4">
          <p className="text-sm opacity-70">{featuredBeat.bpm} BPM • {featuredBeat.genre}</p>
        </div>
        <div className="flex gap-3 mt-4">
          <Button 
            className="bg-purple-600 hover:bg-purple-700 flex items-center gap-2"
            onClick={handleListenNow}
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4" />
                Playing
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Listen now
              </>
            )}
          </Button>
          <Link to={`/beat/${featuredBeat.id}`}>
            <Button 
              variant="outline" 
              className="bg-black/30 backdrop-blur-sm border-white/20 text-white hover:bg-white/10"
            >
              View details
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};
