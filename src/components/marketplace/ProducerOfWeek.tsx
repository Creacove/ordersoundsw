import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Play, Pause, Heart, UserCheck, Music, Star, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { usePlayer } from "@/context/PlayerContext";
import { useBeats } from "@/hooks/useBeats";
import { useFollows } from "@/hooks/useFollows";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export function ProducerOfWeek() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { playBeat, isPlaying, currentBeat } = usePlayer();
  const { toggleFavorite, isFavorite } = useBeats();
  const { followProducer, unfollowProducer, useFollowStatus } = useFollows();
  
  const [producer, setProducer] = useState<any>(null);
  const [producerBeats, setProducerBeats] = useState<any[]>([]);
  const [isLoadingProducer, setIsLoadingProducer] = useState(true);
  const [isLoadingBeats, setIsLoadingBeats] = useState(true);

  // Call the hook at the top level - this will return false if producer is null
  const { data: isFollowing = false } = useFollowStatus(producer?.id);

  // Fetch the producer of the week
  useEffect(() => {
    const fetchProducerOfWeek = async () => {
      setIsLoadingProducer(true);
      try {
        const { data, error } = await supabase
          .rpc('get_producer_of_week');

        if (error) {
          console.error('Error fetching producer of the week:', error);
          return;
        }

        if (data && data.length > 0) {
          setProducer(data[0]);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setIsLoadingProducer(false);
      }
    };

    fetchProducerOfWeek();
  }, []);

  // Fetch the producer's beats
  useEffect(() => {
    if (!producer) return;

    const fetchProducerBeats = async () => {
      setIsLoadingBeats(true);
      try {
        const { data, error } = await supabase
          .from('beats')
          .select(`
            id, 
            title, 
            producer_id,
            cover_image,
            audio_preview,
            audio_file,
            genre,
            track_type,
            bpm,
            tags,
            description,
            upload_date,
            favorites_count,
            purchase_count,
            status,
            basic_license_price_local,
            basic_license_price_diaspora,
            premium_license_price_local,
            premium_license_price_diaspora,
            exclusive_license_price_local,
            exclusive_license_price_diaspora
          `)
          .eq('producer_id', producer.id)
          .eq('status', 'published')
          .order('favorites_count', { ascending: false })
          .limit(4);

        if (error) {
          console.error('Error fetching producer beats:', error);
          return;
        }

        // Transform the beats data to match our Beat interface
        const transformedBeats = data.map(beat => ({
          id: beat.id,
          title: beat.title,
          producer_id: beat.producer_id,
          producer_name: producer.stage_name || producer.full_name,
          cover_image_url: beat.cover_image,
          preview_url: beat.audio_preview,
          full_track_url: beat.audio_file,
          genre: beat.genre,
          track_type: beat.track_type,
          bpm: beat.bpm,
          tags: beat.tags || [],
          description: beat.description,
          created_at: beat.upload_date,
          favorites_count: beat.favorites_count || 0,
          purchase_count: beat.purchase_count || 0,
          status: beat.status as 'draft' | 'published',
          is_featured: false,
          basic_license_price_local: beat.basic_license_price_local || 0,
          basic_license_price_diaspora: beat.basic_license_price_diaspora || 0,
          premium_license_price_local: beat.premium_license_price_local || 0,
          premium_license_price_diaspora: beat.premium_license_price_diaspora || 0,
          exclusive_license_price_local: beat.exclusive_license_price_local || 0,
          exclusive_license_price_diaspora: beat.exclusive_license_price_diaspora || 0
        }));

        setProducerBeats(transformedBeats);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setIsLoadingBeats(false);
      }
    };

    fetchProducerBeats();
  }, [producer]);

  const handleToggleFollow = async () => {
    if (!user) {
      toast.error("Please log in to follow producers");
      navigate('/login');
      return;
    }

    if (!producer) return;

    try {
      if (isFollowing) {
        await unfollowProducer(producer.id);
        toast.success(`Unfollowed ${producer.stage_name || producer.full_name}`);
      } else {
        await followProducer(producer.id);
        toast.success(`Now following ${producer.stage_name || producer.full_name}`);
      }
    } catch (error) {
      console.error('Error toggling follow status:', error);
      toast.error("Failed to update follow status");
    }
  };

  const handlePlayBeat = (beat) => {
    playBeat(beat);
  };

  const handleToggleFavorite = async (beatId) => {
    if (!user) {
      toast.error("Please log in to add favorites");
      navigate('/login');
      return;
    }
    
    try {
      await toggleFavorite(beatId);
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error("Failed to update favorite status");
    }
  };

  const navigateToProducerProfile = () => {
    if (producer) {
      navigate(`/producer/${producer.id}`);
    }
  };

  const navigateToBeat = (beatId) => {
    navigate(`/beat/${beatId}`);
  };

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num;
  };

  if (isLoadingProducer) {
    return (
      <div className="h-[300px] bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-xl flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 animate-pulse">
          <div className="w-16 h-16 rounded-full bg-primary/20"></div>
          <div className="h-4 w-40 bg-primary/20 rounded"></div>
          <div className="text-sm text-muted-foreground">Loading featured producer...</div>
        </div>
      </div>
    );
  }

  if (!producer) {
    return (
      <div className="bg-card/60 border rounded-lg p-6 text-center">
        <div className="flex flex-col items-center gap-3">
          <Music size={32} className="text-muted-foreground" />
          <div className="text-lg font-medium">No featured producer this week</div>
          <div className="text-sm text-muted-foreground">Check back later for updates</div>
        </div>
      </div>
    );
  }

  const producerName = producer.stage_name || producer.full_name;
  const producerImage = producer.profile_picture || '/lovable-uploads/1e3e62c4-f6ef-463f-a731-1e7c7224d873.png';

  return (
    <section className="overflow-hidden rounded-[2.5rem] border border-white/5 bg-[#030407] shadow-2xl relative">
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[500px]">
        {/* Left side - Producer Identity Spotlight */}
        <div className="lg:col-span-4 relative group overflow-hidden border-r border-white/5">
          {/* Immersive Background */}
          <div className="absolute inset-0">
            <img 
              src={producerImage} 
              alt={producerName}
              className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110"
            />
            {/* Multi-layered overlays for depth */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#030407] via-[#030407]/60 to-transparent" />
            <div className="absolute inset-0 bg-[#9A3BDC]/10 mix-blend-overlay" />
          </div>

          {/* Identity Content */}
          <div className="relative z-10 flex flex-col h-full p-8 md:p-10 justify-end">
            <Badge className="absolute top-8 left-8 bg-[#9A3BDC] text-white hover:bg-[#9A3BDC] border-none shadow-[0_0_20px_rgba(154,59,220,0.4)] px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase">
              <Star size={12} fill="currentColor" className="mr-1.5" />
              Producer Spotlight
            </Badge>

            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tighter leading-tight drop-shadow-xl">
                    {producerName}
                  </h2>
                  {producer.status === 'active' && (
                    <CheckCircle2 size={24} className="text-[#9A3BDC] mt-1" />
                  )}
                </div>
                <div className="flex items-center gap-4 text-white/50 text-sm font-medium">
                  <span className="flex items-center gap-1.5">
                    <Music size={14} className="text-[#9A3BDC]/70" />
                    {formatNumber(producerBeats.length)} Beats
                  </span>
                  <span className="h-1 w-1 rounded-full bg-white/20" />
                  <span>Nigeria</span>
                </div>
              </div>

              <p className="text-white/60 text-sm leading-relaxed line-clamp-3">
                {producer.bio || "Crafting sonic landscapes that define the next generation of sound. Specializing in high-energy Afrobeat and futuristic Amapiano."}
              </p>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  onClick={handleToggleFollow}
                  variant={isFollowing ? "outline" : "default"}
                  className={cn(
                    "flex-1 rounded-full h-12 font-bold transition-all duration-300",
                    isFollowing 
                      ? "border-white/20 text-white hover:bg-white/10" 
                      : "bg-white text-black hover:bg-white/90 shadow-xl"
                  )}
                >
                  {isFollowing ? (
                    <>
                      <UserCheck size={18} className="mr-2" />
                      Following
                    </>
                  ) : (
                    "Follow Producer"
                  )}
                </Button>
                <Button
                  onClick={navigateToProducerProfile}
                  variant="ghost"
                  className="rounded-full h-12 text-white/60 hover:text-white hover:bg-white/5 font-medium px-6"
                >
                  Profile
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - The Tracklist */}
        <div className="lg:col-span-8 bg-white/[0.01] p-0 flex flex-col">
          <div className="flex items-center justify-between px-8 py-8 border-b border-white/5">
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">Essential Beats</h3>
              <p className="text-xs text-white/40 mt-0.5 uppercase tracking-widest font-semibold font-mono">Top Rated Picks</p>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-white/30 hover:text-[#9A3BDC] hover:bg-[#9A3BDC]/5 font-bold tracking-tight rounded-full"
              onClick={navigateToProducerProfile}
            >
              Browse All <ArrowRight size={14} className="ml-1.5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          {isLoadingBeats ? (
            <div className="p-8 space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 bg-white/[0.03] animate-pulse rounded-2xl border border-white/5"></div>
              ))}
            </div>
          ) : producerBeats.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-12">
              <div className="text-center space-y-3">
                <Music size={40} className="mx-auto text-white/10" />
                <p className="text-white/40 font-medium">No tracks available yet</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-between py-4">
              <div className="px-4 space-y-1">
                {producerBeats.map((beat, index) => {
                  const isCurrentlyPlaying = isPlaying && currentBeat?.id === beat.id;
                  const isFav = isFavorite(beat.id);
                  
                  return (
                    <div 
                      key={beat.id} 
                      className={cn(
                        "group relative flex items-center gap-4 p-3 pr-5 rounded-2xl transition-all duration-300 cursor-pointer overflow-hidden border border-transparent",
                        isCurrentlyPlaying ? "bg-[#9A3BDC]/10 border-[#9A3BDC]/20" : "hover:bg-white/[0.03] hover:border-white/5"
                      )}
                      onClick={() => navigateToBeat(beat.id)}
                    >
                      {/* Track Index / Number */}
                      <div className="w-6 text-center text-xs font-mono font-bold text-white/20 group-hover:text-white/40 group-hover:hidden transition-all">
                        {String(index + 1).padStart(2, '0')}
                      </div>
                      
                      {/* Sub-Play Trigger for mobile/desktop UI consistency */}
                      <button 
                        className="w-6 items-center justify-center hidden group-hover:flex text-[#9A3BDC] hover:scale-120 transition-transform"
                        onClick={(e) => { e.stopPropagation(); handlePlayBeat(beat); }}
                      >
                       {isCurrentlyPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                      </button>

                      <div className="relative w-12 h-12 overflow-hidden rounded-xl bg-white/5 flex-shrink-0 shadow-lg border border-white/5">
                        <img 
                          src={beat.cover_image_url || '/placeholder.svg'} 
                          alt={beat.title}
                          className="w-full h-full object-cover transition-transform group-hover:scale-110" 
                        />
                        {isCurrentlyPlaying && (
                          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
                            <div className="flex gap-0.5 items-end h-3">
                              <div className="w-0.5 bg-[#9A3BDC] animate-[bounce_0.8s_infinite] h-full" />
                              <div className="w-0.5 bg-[#9A3BDC] animate-[bounce_1.2s_infinite] h-2/3" />
                              <div className="w-0.5 bg-[#9A3BDC] animate-[bounce_1s_infinite] h-5/6" />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className={cn(
                          "font-bold text-sm tracking-tight truncate transition-colors",
                          isCurrentlyPlaying ? "text-[#9A3BDC]" : "text-white group-hover:text-white"
                        )}>
                          {beat.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] uppercase font-bold tracking-widest text-white/30 truncate">{beat.genre}</span>
                          <span className="h-0.5 w-0.5 rounded-full bg-white/20" />
                          <span className="text-[10px] font-mono text-white/30">{beat.bpm} BPM</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right hidden sm:block">
                          <p className="text-sm font-black text-white px-2 py-1 rounded-lg">
                            ₦{(beat.basic_license_price_local || 0).toLocaleString()}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleFavorite(beat.id);
                            }}
                            size="icon"
                            variant="ghost"
                            className={cn(
                              "h-9 w-9 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10",
                              isFav ? "text-[#9A3BDC]" : "text-white/40"
                            )}
                          >
                            <Heart size={16} fill={isFav ? "currentColor" : "none"} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="px-8 mt-4 pt-4 border-t border-white/5 flex items-center justify-center">
                <Button 
                  variant="link" 
                  className="text-white/30 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest"
                  onClick={navigateToProducerProfile}
                >
                  Enter Full Discography
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
  
  // Helper function to check if a beat is purchased
  function isPurchased(beatId) {
    // This should be implemented based on your app's logic
    // For now, we'll return false as a placeholder
    return false;
  }
}
