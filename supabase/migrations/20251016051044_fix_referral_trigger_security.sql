-- FINAL FIX: Fix the referral trigger that conflicts with signup permissions
-- The trigger runs BEFORE INSERT and tries to query users table during signup
-- This causes "permission denied" because user doesn't have SELECT privileges yet

-- Step 1: Drop the existing trigger and function
DROP TRIGGER IF EXISTS trigger_ensure_referral_code ON public.users;
DROP FUNCTION IF EXISTS public.ensure_referral_code();

-- Step 2: Recreate the function with SECURITY DEFINER privileges
-- This allows it to query the users table even during signup when user lacks privileges
CREATE OR REPLACE FUNCTION ensure_referral_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER  -- Run with elevated privileges to query users table
SET search_path = public
AS $$
BEGIN
  -- Only generate referral code if it's NULL
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := generate_referral_code();
  END IF;
  RETURN NEW;
END;
$$;

-- Step 3: Recreate the trigger
CREATE TRIGGER trigger_ensure_referral_code
BEFORE INSERT ON public.users
FOR EACH ROW
WHEN (NEW.referral_code IS NULL)
EXECUTE FUNCTION ensure_referral_code();

-- Step 4: Force PostgREST to reload its schema cache
-- This ensures PostgREST recognizes all privilege changes
NOTIFY pgrst, 'reload schema';

-- Add and immediately drop a dummy column to trigger cache invalidation
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS _final_cache_reload boolean DEFAULT false;
ALTER TABLE public.users DROP COLUMN IF EXISTS _final_cache_reload;

-- Note: This fixes the circular dependency where:
-- 1. User tries to INSERT into users table during signup
-- 2. Trigger runs BEFORE INSERT to generate referral code
-- 3. Trigger tries to SELECT from users table to check for duplicates
-- 4. But user doesn't have SELECT privileges during signup
-- 5. INSERT fails with "permission denied"
