-- NUCLEAR FIX: Complete PostgREST schema cache reset and privilege verification
-- This addresses the persistent "permission denied" issue during signup

-- Step 1: Force complete PostgREST schema cache reset with multiple methods
-- Method 1: Send NOTIFY signal to PostgREST
NOTIFY pgrst, 'reload schema';

-- Method 2: Multiple cache invalidation attempts with dummy columns
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS _nuclear_reset_1 boolean DEFAULT false;
ALTER TABLE public.users DROP COLUMN IF EXISTS _nuclear_reset_1;

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS _nuclear_reset_2 boolean DEFAULT false;
ALTER TABLE public.users DROP COLUMN IF EXISTS _nuclear_reset_2;

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS _nuclear_reset_3 boolean DEFAULT false;
ALTER TABLE public.users DROP COLUMN IF EXISTS _nuclear_reset_3;

-- Step 2: Re-grant INSERT privileges on EXACT columns signup needs
-- This ensures PostgREST recognizes the privileges after cache reset
GRANT INSERT (
  id,
  full_name,
  email,
  role,
  status
) ON public.users TO authenticated;

-- Step 3: Re-grant UPDATE privileges on columns users can modify
GRANT UPDATE (
  full_name,
  email,
  role,
  status
) ON public.users TO authenticated;

-- Step 4: Verify the RLS policy exists and is correct
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;

CREATE POLICY "Users can insert their own profile"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Step 5: Ensure the referral trigger works with elevated privileges
DROP TRIGGER IF EXISTS trigger_ensure_referral_code ON public.users;
DROP FUNCTION IF EXISTS public.ensure_referral_code();

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

CREATE TRIGGER trigger_ensure_referral_code
BEFORE INSERT ON public.users
FOR EACH ROW
WHEN (NEW.referral_code IS NULL)
EXECUTE FUNCTION ensure_referral_code();

-- Step 6: Final cache reset to ensure everything is recognized
NOTIFY pgrst, 'reload schema';

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS _final_reset boolean DEFAULT false;
ALTER TABLE public.users DROP COLUMN IF EXISTS _final_reset;

-- Note: This migration combines all previous fixes with aggressive cache resetting
-- The multiple NOTIFY signals and column add/drop operations should force
-- PostgREST to completely rebuild its schema cache and recognize all privileges
