import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { referralService } from '@/services/referralService';
import { toast } from '@/hooks/use-toast';

interface OnboardingCriteria {
  isComplete: boolean;
  reason?: string;
}

export const useOnboardingTracker = () => {
  const { user } = useAuth();
  const [isChecking, setIsChecking] = useState(false);

  const evaluateProducerCriteria = async (userId: string): Promise<OnboardingCriteria> => {
    const { data: userData } = await supabase
      .from('users')
      .select('stage_name, bio, bank_code, account_number, wallet_address')
      .eq('id', userId)
      .single();

    const { count: beatCount } = await supabase
      .from('beats')
      .select('*', { count: 'exact', head: true })
      .eq('producer_id', userId);

    const { count: soundpackCount } = await supabase
      .from('soundpacks')
      .select('*', { count: 'exact', head: true })
      .eq('producer_id', userId);

    const hasProfile = userData?.stage_name && userData?.bio;
    const hasPayment = userData?.bank_code || userData?.wallet_address;
    const hasUploads = (beatCount || 0) > 0 || (soundpackCount || 0) > 0;

    if (hasProfile && hasPayment && hasUploads) {
      return { isComplete: true, reason: 'Producer setup complete' };
    }

    return { isComplete: false };
  };

  const evaluateBuyerCriteria = async (userId: string): Promise<OnboardingCriteria> => {
    const { count: purchaseCount } = await supabase
      .from('user_purchased_beats')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    const { data: userData } = await supabase
      .from('users')
      .select('favorites')
      .eq('id', userId)
      .single();

    const { count: playlistCount } = await supabase
      .from('playlists')
      .select('*', { count: 'exact', head: true })
      .eq('owner_id', userId);

    const favoriteCount = userData?.favorites ? (Array.isArray(userData.favorites) ? userData.favorites.length : 0) : 0;

    if ((purchaseCount || 0) > 0 || favoriteCount >= 3 || (playlistCount || 0) > 0) {
      return { isComplete: true, reason: 'Buyer engagement complete' };
    }

    return { isComplete: false };
  };

  const checkAndCompleteOnboarding = async (): Promise<boolean> => {
    if (!user || user.onboarding_completed || isChecking) {
      return false;
    }

    setIsChecking(true);

    try {
      const criteria = user.role === 'producer'
        ? await evaluateProducerCriteria(user.id)
        : await evaluateBuyerCriteria(user.id);

      if (criteria.isComplete) {
        const success = await referralService.completeOnboarding(user.id);
        
        if (success) {
          toast({
            title: "🎉 Onboarding Complete!",
            description: "Your referrer just earned 10 points. Welcome to OrderSounds!",
          });
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Error checking onboarding:', error);
      return false;
    } finally {
      setIsChecking(false);
    }
  };

  return { checkAndCompleteOnboarding, isChecking };
};
