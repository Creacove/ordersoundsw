
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export function useFollows() {
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const queryClient = useQueryClient();
  
  // Get follow status for a specific producer
  const useFollowStatus = (producerId: string | undefined) => {
    return useQuery({
      queryKey: ['followStatus', producerId],
      queryFn: async () => {
        if (!producerId) return false;
        
        try {
          const { data: session } = await supabase.auth.getSession();
          if (!session || !session.session) return false;
          
          // Direct database query instead of edge function to check follow status
          const { data, error } = await supabase.rpc('check_follow_status', {
            p_follower_id: session.session.user.id,
            p_followee_id: producerId,
          });
          
          if (error) {
            console.error('Error checking follow status:', error);
            return false;
          }
          
          return !!data;
        } catch (error) {
          console.error('Error getting follow status:', error);
          return false;
        }
      },
      enabled: !!producerId,
    });
  };
  
  // Follow a producer
  const followProducer = async (producerId: string) => {
    if (!producerId) return false;
    
    setIsFollowLoading(true);
    
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session || !session.session) {
        toast.error("You must be logged in to follow a producer");
        return false;
      }
      
      // Direct database call instead of edge function
      const { error } = await supabase.rpc('follow_producer', {
        p_follower_id: session.session.user.id,
        p_followee_id: producerId,
      });
      
      if (error) {
        if (error.message.includes("Already following")) {
          toast.error("You're already following this producer");
          return false;
        }
        throw new Error(error.message);
      }
      
      // Optimistically update follow status in cache
      queryClient.setQueryData(['followStatus', producerId], true);
      
      // Invalidate related queries to refresh data
      await queryClient.invalidateQueries({ queryKey: ['followStatus', producerId] });
      await queryClient.invalidateQueries({ queryKey: ['producer', producerId] });
      await queryClient.invalidateQueries({ queryKey: ['producers'] });
      
      toast.success("You're now following this producer");
      return true;
    } catch (error: any) {
      console.error('Error following producer:', error);
      toast.error(error.message || 'Failed to follow producer');
      return false;
    } finally {
      setIsFollowLoading(false);
    }
  };
  
  // Unfollow a producer
  const unfollowProducer = async (producerId: string) => {
    if (!producerId) return false;
    
    setIsFollowLoading(true);
    
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session || !session.session) {
        toast.error("You must be logged in to unfollow a producer");
        return false;
      }
      
      // Direct database call instead of edge function
      const { error } = await supabase.rpc('unfollow_producer', {
        p_follower_id: session.session.user.id,
        p_followee_id: producerId,
      });
      
      if (error) {
        if (error.message.includes("Not following")) {
          toast.error("You're not following this producer");
          return false;
        }
        throw new Error(error.message);
      }
      
      // Optimistically update follow status in cache
      queryClient.setQueryData(['followStatus', producerId], false);
      
      // Invalidate related queries to refresh data
      await queryClient.invalidateQueries({ queryKey: ['followStatus', producerId] });
      await queryClient.invalidateQueries({ queryKey: ['producer', producerId] });
      await queryClient.invalidateQueries({ queryKey: ['producers'] });
      
      toast.success("You've unfollowed this producer");
      return true;
    } catch (error: any) {
      console.error('Error unfollowing producer:', error);
      toast.error(error.message || 'Failed to unfollow producer');
      return false;
    } finally {
      setIsFollowLoading(false);
    }
  };
  
  // Toggle follow status (follow or unfollow)
  const toggleFollow = async (producerId: string, isCurrentlyFollowing: boolean) => {
    if (isCurrentlyFollowing) {
      return await unfollowProducer(producerId);
    } else {
      return await followProducer(producerId);
    }
  };
  
  // Mutation for toggling follow status
  const useToggleFollowMutation = () => {
    return useMutation({
      mutationFn: ({ producerId, isFollowing }: { producerId: string; isFollowing: boolean }) => 
        toggleFollow(producerId, isFollowing),
      onSuccess: () => {
        // You can handle any additional success logic here
      },
    });
  };
  
  // Get recommended beats from followed producers
  const useRecommendedBeats = () => {
    return useQuery({
      queryKey: ['recommendedBeats'],
      queryFn: async () => {
        try {
          const { data: session } = await supabase.auth.getSession();
          if (!session || !session.session) return [];
          
          // Get producers the user follows
          const { data: followedProducers, error: followError } = await supabase
            .from('followers')
            .select('followee_id')
            .eq('follower_id', session.session.user.id);
            
          if (followError || !followedProducers.length) {
            return [];
          }
          
          // Get beats from those producers
          const producerIds = followedProducers.map(f => f.followee_id);
          const { data: beats, error: beatsError } = await supabase
            .from('beats')
            .select('*')
            .in('producer_id', producerIds)
            .eq('status', 'published')
            .order('upload_date', { ascending: false })
            .limit(8);
            
          if (beatsError) {
            console.error('Error fetching recommended beats:', beatsError);
            return [];
          }
          
          return beats;
        } catch (error) {
          console.error('Error getting recommended beats:', error);
          return [];
        }
      },
    });
  };
  
  return {
    isFollowLoading,
    useFollowStatus,
    followProducer,
    unfollowProducer,
    toggleFollow,
    useToggleFollowMutation,
    useRecommendedBeats,
  };
}
