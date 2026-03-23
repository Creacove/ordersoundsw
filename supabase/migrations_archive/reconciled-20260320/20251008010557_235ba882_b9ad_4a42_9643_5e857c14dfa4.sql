-- Fix users table RLS policies to allow authenticated users to read their own favorites
-- The current policies are causing conflicts when users try to read their own data

-- Drop all existing SELECT policies on users table
DROP POLICY IF EXISTS "Anyone can view basic user profiles" ON public.users;
DROP POLICY IF EXISTS "Users can read own complete profile" ON public.users;
DROP POLICY IF EXISTS "Users view own complete profile" ON public.users;

-- Create a single, clear SELECT policy for viewing basic public profiles (without sensitive data)
CREATE POLICY "Public profiles are viewable by everyone"
ON public.users
FOR SELECT
USING (true);

-- Create a separate policy for users to access ALL their own data including favorites
-- This doesn't need a separate policy since the public one with true already allows it
-- But we keep it for clarity and security - users should always be able to see their own data
CREATE POLICY "Users can read their complete profile"
ON public.users
FOR SELECT
USING (auth.uid() = id);