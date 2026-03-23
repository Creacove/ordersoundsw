-- Drop the existing vulnerable policy that allows role changes
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;

-- Create a new secure policy that prevents role changes
CREATE POLICY "Users can update their own profile (except role)" 
ON public.users
FOR UPDATE 
TO authenticated
USING (id = auth.uid())
WITH CHECK (
  id = auth.uid() 
  AND role = (SELECT role FROM public.users WHERE id = auth.uid())
);