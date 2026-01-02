-- Fix RLS policy for users table to allow reading own favorites
-- Drop existing restrictive policies that might be blocking favorites access
DROP POLICY IF EXISTS "Users can read own favorites" ON public.users;

-- Ensure users can read their complete profile including favorites
-- This policy should already exist but we're making sure it covers favorites
CREATE POLICY "Users can read own complete profile" ON public.users
FOR SELECT
TO authenticated
USING (id = auth.uid());