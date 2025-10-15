export interface ReferralStats {
  points: number;
  referralCount: number;
  referralCode: string;
  successfulReferrals: number;
}

export interface Referral {
  id: string;
  referred_email: string;
  status: 'pending' | 'successful' | 'failed';
  created_at: string;
  reward_points: number;
}

export interface User {
  id: string;
  referral_code?: string;
  referral_points?: number;
  referred_count?: number;
  onboarding_completed?: boolean;
}
