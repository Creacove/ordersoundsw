import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CurrentBeat {
  id: string;
  title: string;
  producer_name: string | null;
}

interface AdminStats {
  totalBeats: number;
  trendingCount: number;
  featuredCount: number;
  weeklyPicksCount: number;
  publishedCount: number;
  currentProducerOfWeek?: {
    id: string;
    name: string;
    stageName?: string;
    profilePicture?: string;
    followerCount: number;
  } | null;
  currentTrendingBeats?: CurrentBeat[];
  currentFeaturedBeat?: CurrentBeat | null;
}

export function useAdminOperations() {
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<AdminStats | null>(null);
  
  // Fetch current beats statistics and producer of the week
  const fetchBeatStats = async () => {
    try {
      setIsLoading(true);
      
      // Fetch beats data
      const { data: beatsData, error: beatsError } = await supabase
        .from('beats')
        .select('id, title, is_trending, is_featured, is_weekly_pick, status, producer_id')
        .eq('status', 'published');
      
      if (beatsError) throw beatsError;
      
      // Fetch current producer of the week
      const { data: producerData, error: producerError } = await supabase
        .from('users')
        .select('id, full_name, stage_name, profile_picture, follower_count')
        .eq('is_producer_of_week', true)
        .eq('role', 'producer')
        .maybeSingle();
      
      if (producerError) {
        console.error('Error fetching producer of the week:', producerError);
      }
      
      const totalBeats = beatsData?.length || 0;
      const trendingBeats = beatsData?.filter(beat => beat.is_trending) || [];
      const featuredBeats = beatsData?.filter(beat => beat.is_featured) || [];
      const weeklyPicksCount = beatsData?.filter(beat => beat.is_weekly_pick).length || 0;
      
      // Get producer names for trending/featured beats
      const producerIds = [...new Set([
        ...trendingBeats.map(b => b.producer_id),
        ...featuredBeats.map(b => b.producer_id)
      ])];
      
      let producerMap = new Map<string, string>();
      if (producerIds.length > 0) {
        const { data: producersData } = await supabase
          .from('users')
          .select('id, stage_name, full_name')
          .in('id', producerIds);
        
        producerMap = new Map(
          producersData?.map(p => [p.id, p.stage_name || p.full_name]) || []
        );
      }
      
      const currentProducerOfWeek = producerData ? {
        id: producerData.id,
        name: producerData.full_name,
        stageName: producerData.stage_name,
        profilePicture: producerData.profile_picture,
        followerCount: producerData.follower_count || 0
      } : null;

      const currentTrendingBeats: CurrentBeat[] = trendingBeats.map(b => ({
        id: b.id,
        title: b.title,
        producer_name: producerMap.get(b.producer_id) || null
      }));

      const currentFeaturedBeat: CurrentBeat | null = featuredBeats.length > 0 
        ? {
            id: featuredBeats[0].id,
            title: featuredBeats[0].title,
            producer_name: producerMap.get(featuredBeats[0].producer_id) || null
          }
        : null;
      
      setStats({
        totalBeats,
        trendingCount: trendingBeats.length,
        featuredCount: featuredBeats.length,
        weeklyPicksCount,
        publishedCount: totalBeats,
        currentProducerOfWeek,
        currentTrendingBeats,
        currentFeaturedBeat
      });
      
      return { 
        totalBeats, 
        trendingCount: trendingBeats.length, 
        featuredCount: featuredBeats.length, 
        weeklyPicksCount, 
        publishedCount: totalBeats,
        currentProducerOfWeek,
        currentTrendingBeats,
        currentFeaturedBeat
      };
    } catch (error: any) {
      console.error('Error fetching beat stats:', error);
      toast.error('Failed to fetch beat statistics');
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Set a specific producer as producer of the week
  const setProducerOfWeek = async (producerId: string) => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.functions.invoke('admin-operations', {
        body: { 
          operation: 'set_producer_of_week',
          producerId: producerId
        }
      });
      
      if (error) throw error;
      
      if (data.success) {
        toast.success(`Successfully set ${data.producer_name} as producer of the week`);
        await fetchBeatStats();
        return true;
      } else {
        throw new Error(data.error || 'Unknown error occurred');
      }
    } catch (error: any) {
      console.error('Error setting producer of the week:', error);
      toast.error(`Failed to set producer of the week: ${error.message}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Manually set specific beats as trending
  const setTrendingBeats = async (beatIds: string[]) => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.functions.invoke('admin-operations', {
        body: { 
          operation: 'set_trending_beats',
          beatIds
        }
      });
      
      if (error) throw error;
      
      if (data.success) {
        toast.success(`Successfully set ${data.updated_count} beats as trending`);
        await fetchBeatStats();
        return true;
      } else {
        throw new Error(data.error || 'Unknown error occurred');
      }
    } catch (error: any) {
      console.error('Error setting trending beats:', error);
      toast.error(`Failed to set trending beats: ${error.message}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Manually set a specific beat as featured
  const setFeaturedBeat = async (beatId: string) => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.functions.invoke('admin-operations', {
        body: { 
          operation: 'set_featured_beat',
          beatId
        }
      });
      
      if (error) throw error;
      
      if (data.success) {
        toast.success('Successfully set beat as featured');
        await fetchBeatStats();
        return true;
      } else {
        throw new Error(data.error || 'Unknown error occurred');
      }
    } catch (error: any) {
      console.error('Error setting featured beat:', error);
      toast.error(`Failed to set featured beat: ${error.message}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Refresh trending beats via edge function (random weighted)
  const refreshTrendingBeats = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.functions.invoke('admin-operations', {
        body: { 
          operation: 'refresh_trending_beats',
          count: 5 
        }
      });
      
      if (error) throw error;
      
      if (data.success) {
        toast.success(`Successfully updated ${data.updated_count} beats as trending`);
        await fetchBeatStats();
        return true;
      } else {
        throw new Error(data.error || 'Unknown error occurred');
      }
    } catch (error: any) {
      console.error('Error refreshing trending beats:', error);
      toast.error(`Failed to refresh trending beats: ${error.message}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Refresh featured beats via edge function (random weighted)
  const refreshFeaturedBeats = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.functions.invoke('admin-operations', {
        body: { 
          operation: 'refresh_featured_beats',
          count: 1 
        }
      });
      
      if (error) throw error;
      
      if (data.success) {
        toast.success(`Successfully updated ${data.updated_count} beat as featured`);
        await fetchBeatStats();
        return true;
      } else {
        throw new Error(data.error || 'Unknown error occurred');
      }
    } catch (error: any) {
      console.error('Error refreshing featured beats:', error);
      toast.error(`Failed to refresh featured beats: ${error.message}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Refresh weekly picks via edge function
  const refreshWeeklyPicks = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.functions.invoke('admin-operations', {
        body: { 
          operation: 'refresh_weekly_picks',
          count: 6 
        }
      });
      
      if (error) throw error;
      
      if (data.success) {
        toast.success(`Successfully updated ${data.updated_count} beats as weekly picks`);
        await fetchBeatStats();
        return true;
      } else {
        throw new Error(data.error || 'Unknown error occurred');
      }
    } catch (error: any) {
      console.error('Error refreshing weekly picks:', error);
      toast.error(`Failed to refresh weekly picks: ${error.message}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    stats,
    isLoading,
    fetchBeatStats,
    refreshTrendingBeats,
    refreshFeaturedBeats,
    refreshWeeklyPicks,
    setProducerOfWeek,
    setTrendingBeats,
    setFeaturedBeat
  };
}
