-- Fix soundpacks RLS policy to avoid permission issues when joining with users table
-- The existing admin policy queries users table directly, which can cause RLS conflicts

-- Drop the problematic admin policy
DROP POLICY IF EXISTS "Admins have full access to soundpacks" ON public.soundpacks;

-- Recreate it using the is_admin() security definer function
CREATE POLICY "Admins have full access to soundpacks"
ON public.soundpacks
FOR ALL
USING (is_admin());