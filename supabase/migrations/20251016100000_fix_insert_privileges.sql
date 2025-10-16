-- Fix the root cause: Grant INSERT privileges on users table columns
-- Previous migration granted SELECT but forgot INSERT privileges
-- This allows authenticated users to create their profile during signup

-- Grant INSERT privilege on necessary columns for user signup
GRANT INSERT (
  id,
  full_name,
  email,
  role,
  status,
  country,
  profile_picture,
  bio,
  stage_name,
  created_date,
  wallet_address,
  storefront_url,
  follower_count,
  is_producer_of_week,
  music_interests,
  referral_code,
  referral_points,
  referred_count,
  onboarding_completed
) ON public.users TO authenticated;

-- Also grant UPDATE privilege on columns users should be able to modify
GRANT UPDATE (
  full_name,
  profile_picture,
  bio,
  country,
  stage_name,
  wallet_address,
  storefront_url,
  music_interests,
  onboarding_completed
) ON public.users TO authenticated;

-- Note: The existing RLS policies will still enforce row-level security
-- Users can only INSERT/UPDATE their own rows (where id = auth.uid())
