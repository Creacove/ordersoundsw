-- Remove legacy custom auth tracking.
-- Supabase Auth is the source of truth for sessions and tokens.
-- Browser-side auth diagnostics should not be persisted into the primary app database.

BEGIN;

DROP FUNCTION IF EXISTS public.handle_auth_token_storage() CASCADE;
DROP FUNCTION IF EXISTS public.refresh_auth_token(uuid, text, text, text) CASCADE;
DROP FUNCTION IF EXISTS public.update_session_version(uuid, text) CASCADE;

DROP TABLE IF EXISTS public.auth_sessions CASCADE;
DROP TABLE IF EXISTS public.auth_logs CASCADE;

COMMIT;
