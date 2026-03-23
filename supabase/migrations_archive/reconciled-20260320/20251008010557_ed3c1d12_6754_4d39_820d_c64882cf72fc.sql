-- Fix the trigger to avoid permission issues
DROP TRIGGER IF EXISTS ensure_role_unchanged ON public.users;
DROP FUNCTION IF EXISTS public.prevent_role_change();

-- Create a simpler trigger that doesn't query the users table
CREATE OR REPLACE FUNCTION public.prevent_role_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only allow role changes if the old role was already admin
  -- This prevents privilege escalation
  IF OLD.role IS DISTINCT FROM NEW.role AND OLD.role != 'admin' THEN
    -- Prevent the role change for non-admins
    NEW.role := OLD.role;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER ensure_role_unchanged
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.prevent_role_change();