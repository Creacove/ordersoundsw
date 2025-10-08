-- Fix the recursive RLS policy issue on users table
-- Drop the problematic policy with recursive role check
DROP POLICY IF EXISTS "Users can update their own profile (except role)" ON public.users;

-- Create a simpler policy without recursive subquery
CREATE POLICY "Users can update their own profile"
ON public.users
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Add trigger to prevent role changes (except by admins)
CREATE OR REPLACE FUNCTION public.prevent_role_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow admins to change roles
  IF (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin' THEN
    RETURN NEW;
  END IF;
  
  -- For non-admins, keep the old role
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    NEW.role := OLD.role;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to enforce role protection
DROP TRIGGER IF EXISTS ensure_role_unchanged ON public.users;
CREATE TRIGGER ensure_role_unchanged
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.prevent_role_change();