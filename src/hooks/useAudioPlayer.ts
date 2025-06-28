
import { usePlayer } from '@/context/PlayerContext';
import { Beat } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useCallback, useMemo } from 'react';
import { AudioManager } from '@/lib/audioManager';

export function useAudioPlayer() {
  const { currentBeat, isPlaying, togglePlayPause, playBeat } = usePlayer();
  const audioManager = AudioManager.getInstance();
  
  const incrementPlayCount = useCallback(async (beatId: string) => {
    try {
      // Use the correct RPC function with proper parameters
      const { error } = await supabase.rpc('increment_counter', {
        p_table_name: 'beats',
        p_column_name: 'plays',
        p_id: beatId
      });
      
      if (error) {
        console.error('Error incrementing play count:', error);
      } else {
        console.log('Successfully incremented play count for beat:', beatId);
      }
    } catch (error) {
      console.error('Error incrementing play count:', error);
    }
  }, []);

  const handlePlayBeat = useCallback(async (beat: Beat): Promise<void> => {
    console.log("Play button clicked for:", beat.title);
    
    try {
      const isCurrentBeat = currentBeat?.id === beat.id;
      
      if (isCurrentBeat) {
        console.log("Toggling current beat:", beat.title);
        togglePlayPause();
      } else {
        console.log("Playing new beat:", beat.title);
        
        if (!beat.preview_url) {
          console.warn("Beat doesn't have a preview URL:", beat.title);
          return;
        }
        
        // Ensure we stop any other playing audio first
        audioManager.stopAllAudio();
        
        playBeat(beat);
        
        // Increment play count when starting a new track
        await incrementPlayCount(beat.id);
      }
    } catch (error) {
      console.error("Error handling play:", error);
    }
  }, [currentBeat, togglePlayPause, playBeat, incrementPlayCount, audioManager]);

  const isCurrentBeat = useCallback((beatId: string): boolean => {
    return currentBeat?.id === beatId;
  }, [currentBeat]);

  const isCurrentlyPlaying = useCallback((beatId: string): boolean => {
    return isCurrentBeat(beatId) && isPlaying;
  }, [isCurrentBeat, isPlaying]);

  // Memoize return object to prevent unnecessary re-renders
  const returnValue = useMemo(() => ({
    currentBeat,
    isPlaying,
    handlePlayBeat,
    isCurrentBeat,
    isCurrentlyPlaying,
    incrementPlayCount
  }), [currentBeat, isPlaying, handlePlayBeat, isCurrentBeat, isCurrentlyPlaying, incrementPlayCount]);

  return returnValue;
}
