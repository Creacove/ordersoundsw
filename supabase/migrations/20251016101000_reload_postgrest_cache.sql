-- Force PostgREST to reload its schema cache
-- This is needed after granting new privileges so PostgREST recognizes them
-- Without this, PostgREST continues using its cached (old) privilege information

-- Method 1: Send NOTIFY signal to PostgREST
NOTIFY pgrst, 'reload schema';

-- Method 2: Make a schema change to trigger cache invalidation
-- Add and immediately drop a dummy column
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS _force_postgrest_reload boolean DEFAULT false;
ALTER TABLE public.users DROP COLUMN IF EXISTS _force_postgrest_reload;

-- This ensures PostgREST picks up the new INSERT/UPDATE privileges we granted
-- in the previous migration (20251016100000_fix_insert_privileges.sql)
