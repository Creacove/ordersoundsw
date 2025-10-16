-- FINAL FIX: Grant INSERT privileges on EXACT columns needed for signup
-- The signup code tries to insert: id, full_name, email, role, status
-- Previous migrations missed the email column and never granted INSERT

-- Step 1: Grant INSERT on the EXACT columns signup needs
GRANT INSERT (
  id,
  full_name,
  email,
  role,
  status
) ON public.users TO authenticated;

-- Step 2: Also grant UPDATE on columns users can modify after signup
GRANT UPDATE (
  full_name,
  email,
  role,
  status
) ON public.users TO authenticated;

-- Step 3: Force PostgREST to reload its schema cache
-- This ensures PostgREST recognizes the new privileges
NOTIFY pgrst, 'reload schema';

-- Add and immediately drop a dummy column to trigger cache invalidation
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS _signup_fix_cache_reload boolean DEFAULT false;
ALTER TABLE public.users DROP COLUMN IF EXISTS _signup_fix_cache_reload;

-- Note: The existing RLS policy "Users can insert their own profile" will work
-- once users have INSERT privileges at the table level
