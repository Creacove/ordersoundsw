-- NUCLEAR OPTION: Force PostgREST schema cache reload by modifying then reverting schema
-- This is a proven technique when NOTIFY doesn't work

-- Add a temporary dummy column
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS _force_cache_reload boolean DEFAULT false;

-- Immediately drop it
ALTER TABLE public.users DROP COLUMN IF EXISTS _force_cache_reload;

-- Send reload notification again
NOTIFY pgrst, 'reload schema';