
import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/context/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { useProducers } from "@/hooks/useProducers";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { ProducerSearch } from "@/components/producers/ProducerSearch";
import { SuggestedProducers } from "@/components/producers/SuggestedProducers";
import { ProducersList } from "@/components/producers/ProducersList";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Producers() {
  const [showingFollowed, setShowingFollowed] = useState(false);
  const [suggestedProducers, setSuggestedProducers] = useState([]);
  const [dismissedProducerIds, setDismissedProducerIds] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();
  const isMobile = useIsMobile();

  // Use our centralized producer data hook
  const { producers, isLoading } = useProducers();
  
  useEffect(() => {
    document.title = "Active Producers | OrderSOUNDS";
  }, []);

  // Get only followed producers who have published beats
  const { data: followedProducers, isLoading: followedLoading } = useQuery({
    queryKey: ['followedProducers', user?.id],
    queryFn: async () => {
      if (!user) return [];

      try {
        // Get producers that the user follows
        const { data: follows, error: followsError } = await supabase
          .from('followers')
          .select('followee_id')
          .eq('follower_id', user.id);

        if (followsError || !follows.length) return [];

        const followeeIds = follows.map(follow => follow.followee_id);

        // Get followed producers (reliable approach)
        const { data: producersData, error } = await supabase
          .from('users')
          .select('id, stage_name, full_name, bio, profile_picture, follower_count')
          .eq('role', 'producer')
          .in('id', followeeIds);

        if (error) throw error;
        if (!producersData) return [];

        // Get beat counts for followed producers
        const producersWithBeats = await Promise.all(
          producersData.map(async (producer) => {
            const { count, error: beatError } = await supabase
              .from('beats')
              .select('id', { count: 'exact', head: true })
              .eq('producer_id', producer.id)
              .eq('status', 'published')
              .is('soundpack_id', null);

            if (beatError) {
              console.error('Error getting beat count:', beatError);
              return { ...producer, beatCount: 0 };
            }

            return {
              ...producer,
              beatCount: count || 0
            };
          })
        );

        // Filter out followed producers with 0 beats and sort by activity
        const activeFollowedProducers = producersWithBeats
          .filter(producer => producer.beatCount > 0)
          .sort((a, b) => b.beatCount - a.beatCount);

        return activeFollowedProducers;
      } catch (error) {
        console.error("Error fetching followed producers:", error);
        return [];
      }
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000 // Keep data fresh for 5 minutes
  });

  // Generate suggested producers
  const getSuggestedProducers = useCallback(() => {
    if (!producers || producers.length === 0) return [];
    
    // Create a copy of producers excluding dismissed ones
    const availableProducers = producers.filter(
      producer => !dismissedProducerIds.has(producer.id)
    );
    
    // Shuffle the array
    const shuffled = [...availableProducers].sort(() => 0.5 - Math.random());
    
    // Return up to 8 random producers
    return shuffled.slice(0, 8);
  }, [producers, dismissedProducerIds]);
  
  // Initialize suggested producers
  useEffect(() => {
    if (producers && producers.length > 0) {
      setSuggestedProducers(getSuggestedProducers());
    }
  }, [producers, getSuggestedProducers]);

  const handleShuffleSuggestions = () => {
    if (producers && producers.length > 0) {
      setSuggestedProducers(getSuggestedProducers());
      toast.success("Shuffled suggestions");
    }
  };
  
  const handleDismissProducer = (producerId) => {
    // Add producer ID to dismissed set
    setDismissedProducerIds(prev => new Set([...prev, producerId]));
    
    // Remove from current suggestions
    setSuggestedProducers(current => 
      current.filter(producer => producer.id !== producerId)
    );
    
    toast.success("Producer removed from suggestions");
  };

  // Filter producers based on search query
  const filterProducers = (producerList) => {
    if (!producerList) return [];
    if (!searchQuery.trim()) return producerList;
    
    return producerList.filter(producer => {
      const stageName = (producer.stage_name || '').toLowerCase();
      const fullName = (producer.full_name || '').toLowerCase();
      const bio = (producer.bio || '').toLowerCase();
      const query = searchQuery.toLowerCase().trim();
      
      return stageName.includes(query) || fullName.includes(query) || bio.includes(query);
    });
  };

  // Show improved loading state
  if (isLoading) {
    return (
      <div className="container py-8 md:py-12 px-4 md:px-6">
        <div className="w-full max-w-7xl mx-auto space-y-12">
          <div className="h-64 rounded-[3rem] bg-white/[0.02] border border-white/5 animate-pulse" />
          
          <div className="space-y-6">
            <div className="flex justify-between items-center px-4">
              <Skeleton className="h-8 w-48 bg-white/5" />
              <Skeleton className="h-8 w-40 bg-white/5" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4 px-4 text-center">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-3">
                  <Skeleton className="h-16 w-16 rounded-3xl bg-white/5" />
                  <Skeleton className="h-4 w-12 bg-white/5" />
                </div>
              ))}
            </div>
          </div>
          
          <div className="space-y-4 px-4">
            <Skeleton className="h-12 w-full rounded-2xl bg-white/5" />
            <div className="flex justify-between items-center mb-6">
              <Skeleton className="h-8 w-48 bg-white/5" />
              <Skeleton className="h-10 w-40 rounded-full bg-white/5" />
            </div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-28 w-full rounded-2xl bg-white/5" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Determine which producers to show based on current view and search
  const filteredProducers = showingFollowed 
    ? filterProducers(followedProducers || []) 
    : filterProducers(producers || []);

  return (
    <div className="container py-8 md:py-12 px-4 md:px-6 max-w-7xl pb-32">
      <div className="w-full mx-auto space-y-12">
        {/* Premium Header */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-[#9A3BDC] to-purple-600 rounded-[3.1rem] blur opacity-10 group-hover:opacity-15 transition duration-1000"></div>
          <div className="relative p-[1px] rounded-[3rem] bg-gradient-to-br from-white/20 to-transparent">
            <div className="bg-[#030407] rounded-[2.9rem] p-8 md:p-14 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-96 h-96 bg-[#9A3BDC]/10 blur-[120px] -mr-48 -mt-48 rounded-full pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#9A3BDC]/5 blur-[100px] -ml-32 -mb-32 rounded-full pointer-events-none" />
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
                <div className="space-y-4 text-center md:text-left">
                  <div className="flex justify-center md:justify-start">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#9A3BDC] flex items-center gap-2 bg-[#9A3BDC]/10 px-4 py-2 rounded-full border border-[#9A3BDC]/20 w-fit italic">
                      <Sparkles size={12} fill="#9A3BDC" /> Producer Directory
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl md:text-5xl font-black text-white italic tracking-tighter uppercase leading-none">
                    Discover <br className="hidden md:block" /> Producers
                  </h1>
                  <p className="text-white/40 text-sm md:text-lg italic max-w-xl mx-auto md:mx-0">Connect with the minds behind the most impactful sound waves on the platform.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar - Stylized */}
        <div className="relative z-20">
          <ProducerSearch 
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        </div>
        
        {/* Suggested Producers Section */}
        {!searchQuery && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
            <SuggestedProducers 
              producers={suggestedProducers}
              onDismiss={handleDismissProducer}
              onShuffle={handleShuffleSuggestions}
            />
          </div>
        )}
        
        <Separator className="bg-white/5 h-px" />
        
        {/* All Producers Section */}
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-center md:text-left">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white italic tracking-tighter uppercase">Browse Producers</h2>
              <p className="text-white/30 text-[8px] sm:text-[10px] font-black uppercase tracking-widest italic mt-1">Filtering {filteredProducers.length} entries</p>
            </div>
            
            <div className="p-1 rounded-[1.25rem] border border-white/10 bg-white/[0.05] flex gap-1 backdrop-blur-xl">
              <Button 
                variant="ghost" 
                onClick={() => setShowingFollowed(false)}
                size="sm"
                className={cn(
                  "rounded-xl px-6 h-10 font-black uppercase italic tracking-widest text-[10px] transition-all",
                  !showingFollowed ? 'bg-white text-black hover:bg-white/90 shadow-[0_10px_20px_rgba(255,255,255,0.1)]' : 'text-white/40 hover:text-white hover:bg-white/5'
                )}
              >
                All Producers
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => setShowingFollowed(true)}
                size="sm"
                className={cn(
                  "rounded-xl px-6 h-10 font-black uppercase italic tracking-widest text-[10px] transition-all",
                  showingFollowed ? 'bg-[#9A3BDC] text-white hover:bg-[#9A3BDC]/90 shadow-[0_10px_20px_rgba(154,59,220,0.3)] border-transparent' : 'text-white/40 hover:text-white hover:bg-white/5'
                )}
                disabled={!user}
              >
                Following
              </Button>
            </div>
          </div>
          
          <div className="relative">
            <ProducersList 
              producers={filteredProducers}
              isLoading={followedLoading && showingFollowed}
              isMobile={isMobile}
              searchQuery={searchQuery}
              showFollowedContent={showingFollowed}
              user={user}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
