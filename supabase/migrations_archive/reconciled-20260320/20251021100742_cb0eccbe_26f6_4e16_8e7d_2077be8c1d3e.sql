-- CRITICAL FIX: Grant SELECT privilege to allow PostgREST to return inserted rows
-- This is the root cause of signup failures - authenticated users can INSERT but can't SELECT back the result

-- Grant SELECT privilege to authenticated role on users table
-- RLS policies will still control which rows users can see
GRANT SELECT ON public.users TO authenticated;

-- Force PostgREST schema cache reload
NOTIFY pgrst, 'reload schema';

-- Additional cache invalidation to ensure change is recognized
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS _select_grant_fix boolean DEFAULT false;
ALTER TABLE public.users DROP COLUMN IF EXISTS _select_grant_fix;

-- Final schema reload notification
NOTIFY pgrst, 'reload schema';