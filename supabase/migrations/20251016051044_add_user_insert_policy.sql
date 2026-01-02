-- Add INSERT policy for users table to allow signup
-- This fixes the "permission denied for table users" error during user registration

CREATE POLICY "Users can insert their own profile"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);
