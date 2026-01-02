-- CLEANUP: Fix PostgREST signup issues by removing complexity
-- This addresses the "permission denied" during signup by:
-- 1. Removing the BEFORE INSERT trigger that queries users table during signup
-- 2. Removing column-level permissions that caused PostgREST cache confusion
-- 3. Going back to simple table-level permissions and basic RLS policy

-- Step 1: Drop the problematic BEFORE INSERT trigger that blocks signup
DROP TRIGGER IF EXISTS trigger_ensure_referral_code ON public.users;
DROP FUNCTION IF EXISTS public.ensure_referral_code();

-- Step 2: Remove column-level permissions that caused PostgREST confusion
REVOKE ALL ON public.users FROM authenticated;

-- Step 3: Grant simple table-level permissions needed for signup
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;

-- Step 4: Ensure the RLS policy exists for user signup
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
CREATE POLICY "Users can insert their own profile" ON public.users
FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Step 5: Force PostgREST to reload its schema cache
NOTIFY pgrst, 'reload schema';

-- Step 6: Optional - add/remove dummy column to force full cache invalidation
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS _cleanup_cache boolean DEFAULT false;
ALTER TABLE public.users DROP COLUMN IF EXISTS _cleanup_cache;
