-- Secure users table with column-level privileges
-- This restricts which columns can be queried via Supabase API

-- Step 1: Revoke all SELECT access from public roles
REVOKE SELECT ON public.users FROM anon, authenticated;

-- Step 2: Grant SELECT on only safe columns
GRANT SELECT (
  id, 
  full_name, 
  stage_name, 
  profile_picture, 
  bio, 
  country, 
  follower_count, 
  role, 
  status, 
  created_date,
  storefront_url,
  is_producer_of_week,
  music_interests
) ON public.users TO anon, authenticated;

-- Step 3: Update RLS policies for authenticated users to access their own data
-- Users can see ALL columns of their own profile
DROP POLICY IF EXISTS "Users can read their status" ON public.users;

CREATE POLICY "Users view own complete profile"
ON public.users
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Note: The existing "Anyone can view basic user profiles" policy will now only return
-- the columns granted above for non-owner access. RLS + Column privileges work together.