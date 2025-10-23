
import { useEffect, useState, useCallback } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
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
      <MainLayout>
        <div className="page-container bg-background text-foreground">
          <div className="w-full max-w-7xl mx-auto">
            <SectionTitle title="Discover Active Producers" className="header-spacing" />
            
            <div className="w-full flex items-center justify-center mb-6">
              <div className="relative w-full max-w-md">
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
            </div>
            
            <div className="mb-10">
              <div className="flex justify-between items-center mb-6">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-8 w-40" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-secondary rounded-lg p-4 flex flex-col items-center">
                    <Skeleton className="h-16 w-16 rounded-full mb-3" />
                    <Skeleton className="h-5 w-24 mb-1" />
                    <Skeleton className="h-4 w-16 mb-3" />
                    <Skeleton className="h-8 w-full rounded-md" />
                  </div>
                ))}
              </div>
            </div>
            
            <Skeleton className="h-1 w-full mb-8" />
            
            <div>
              <div className="flex justify-between items-center mb-6">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-10 w-40 rounded-full" />
              </div>
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-xl" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Determine which producers to show based on current view and search
  const filteredProducers = showingFollowed 
    ? filterProducers(followedProducers || []) 
    : filterProducers(producers || []);

  return (
    <MainLayout>
      <div className="page-container bg-background text-foreground">
        <div className="w-full max-w-7xl mx-auto">
          <SectionTitle
            title="Discover Active Producers"
            className="header-spacing"
          />

          {/* Search Bar */}
          <ProducerSearch 
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
          
          {/* Suggested Producers Section */}
          {!searchQuery && (
            <SuggestedProducers 
              producers={suggestedProducers}
              onDismiss={handleDismissProducer}
              onShuffle={handleShuffleSuggestions}
            />
          )}
          
          <Separator className="my-8" />
          
          {/* All Producers Section */}
          <div className="mb-20">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
              <h2 className="heading-responsive-md">Browse Producers</h2>
              
              <div className="flex bg-secondary rounded-full p-1">
                <Button 
                  variant={!showingFollowed ? "default" : "ghost"} 
                  onClick={() => setShowingFollowed(false)}
                  size="sm"
                  className="rounded-l-full rounded-r-none"
                >
                  All Producers
                </Button>
                <Button 
                  variant={showingFollowed ? "default" : "ghost"} 
                  onClick={() => setShowingFollowed(true)}
                  size="sm"
                  className="rounded-r-full rounded-l-none"
                  disabled={!user}
                >
                  Following
                </Button>
              </div>
            </div>
            
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
    </MainLayout>
  );
}
