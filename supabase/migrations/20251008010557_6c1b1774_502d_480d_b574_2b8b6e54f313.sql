-- Add wallet_address to column-level privileges for users table
-- This fixes the "permission denied" error when fetching user data
GRANT SELECT (wallet_address) ON public.users TO anon, authenticated;