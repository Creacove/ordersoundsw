import { publicEnv } from "@/config/publicEnv";

/**
 * Feature flag helpers for controlled rollout
 */

export const isReferralEnabled = (): boolean => {
  return publicEnv.enableReferrals;
};

export const featureFlags = {
  referrals: isReferralEnabled(),
};
