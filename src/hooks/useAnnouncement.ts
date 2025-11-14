import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Announcement {
  id: string;
  message: string;
  is_active: boolean;
  link_url?: string;
}

export function useAnnouncement() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnnouncement();

    const channel = supabase
      .channel('announcements')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'site_announcements',
          filter: 'is_active=eq.true',
        },
        () => {
          fetchAnnouncement();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchAnnouncement() {
    try {
      const { data, error } = await (supabase as any)
        .from('site_announcements')
        .select('id, message, is_active, link_url')
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching announcement:', error);
        return;
      }

      setAnnouncement(data);
    } catch (error) {
      console.error('Error fetching announcement:', error);
    } finally {
      setIsLoading(false);
    }
  }

  return { announcement, isLoading };
}
