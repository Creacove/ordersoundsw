/**
 * Feature flag helpers for controlled rollout
 */

export const isReferralEnabled = (): boolean => {
  return import.meta.env.VITE_ENABLE_REFERRALS === 'true';
};

export const featureFlags = {
  referrals: isReferralEnabled(),
};
