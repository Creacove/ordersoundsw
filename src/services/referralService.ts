import { supabase } from "@/integrations/supabase/client";
import type { ReferralStats, Referral } from "@/types/referral";

export const referralService = {
  /**
   * Generate referral link for current user
   */
  generateReferralLink: (referralCode: string): string => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/signup?ref=${referralCode}`;
  },

  /**
   * Get current user's referral stats
   */
  getMyReferralStats: async (): Promise<ReferralStats> => {
    const url = `https://uoezlwkxhbzajdivrlby.supabase.co/functions/v1/referral-operations?action=stats`;
    const { data: { session } } = await supabase.auth.getSession();
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${session?.access_token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) throw new Error('Failed to fetch stats');
    return await response.json();
  },

  /**
   * Get referral history
   */
  getMyReferrals: async (): Promise<Referral[]> => {
    const url = `https://uoezlwkxhbzajdivrlby.supabase.co/functions/v1/referral-operations?action=list`;
    const { data: { session } } = await supabase.auth.getSession();
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${session?.access_token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) throw new Error('Failed to fetch referrals');
    return await response.json();
  },

  /**
   * Mark onboarding as complete and award referral points
   */
  completeOnboarding: async (userId: string): Promise<boolean> => {
    const { data, error } = await supabase.functions.invoke('referral-operations', {
      body: { action: 'award', userId }
    });

    if (error) {
      console.error('Error completing onboarding:', error);
      return false;
    }

    return data?.success || false;
  },

  /**
   * Create referral record on signup
   */
  createReferral: async (referralCode: string, newUserId: string, newUserEmail: string): Promise<boolean> => {
    const { data, error } = await supabase.functions.invoke('referral-operations', {
      body: { 
        action: 'create',
        referralCode,
        newUserId,
        newUserEmail
      }
    });

    if (error) {
      console.error('Error creating referral:', error);
      return false;
    }

    return data?.success || false;
  },

  /**
   * Share referral link via different platforms
   */
  shareReferralLink: (platform: 'twitter' | 'whatsapp' | 'copy', referralCode: string): void => {
    const link = referralService.generateReferralLink(referralCode);
    const text = `Join OrderSounds using my referral link and let's create amazing music together!`;

    switch (platform) {
      case 'twitter':
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(link)}`,
          '_blank'
        );
        break;
      case 'whatsapp':
        window.open(
          `https://wa.me/?text=${encodeURIComponent(text + ' ' + link)}`,
          '_blank'
        );
        break;
      case 'copy':
        navigator.clipboard.writeText(link);
        break;
    }
  }
};
