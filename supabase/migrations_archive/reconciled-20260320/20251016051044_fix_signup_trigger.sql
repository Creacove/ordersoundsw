-- Fix the signup issue by modifying the favorites trigger to not run during signup
-- The trigger was running BEFORE INSERT on all user inserts, including signup

-- Drop the problematic trigger
DROP TRIGGER IF EXISTS sync_favorites_count_trigger ON public.users;

-- Create trigger for favorites count sync (only when favorites actually changes)
CREATE TRIGGER sync_favorites_count_trigger
  AFTER INSERT OR UPDATE ON public.users
  FOR EACH ROW
  WHEN (OLD.favorites IS DISTINCT FROM NEW.favorites)
  EXECUTE FUNCTION public.sync_favorites_count();
