
-- Phase 1: Create the missing increment_counter function that the edge function expects
CREATE OR REPLACE FUNCTION public.increment_counter(
  p_table_name text,
  p_column_name text,
  p_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE format('UPDATE %I SET %I = COALESCE(%I, 0) + 1 WHERE id = $1', 
                p_table_name, p_column_name, p_column_name)
  USING p_id;
END;
$$;

-- Phase 2: Create trigger function to sync favorites count
CREATE OR REPLACE FUNCTION public.sync_favorites_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  beat_uuid uuid;
  new_count integer;
BEGIN
  -- Handle both INSERT/UPDATE and DELETE cases
  IF TG_OP = 'DELETE' THEN
    -- For each beat in the old favorites array, decrement the count
    IF OLD.favorites IS NOT NULL THEN
      FOR beat_uuid IN SELECT jsonb_array_elements_text(OLD.favorites)::uuid
      LOOP
        SELECT COUNT(*) INTO new_count
        FROM public.users 
        WHERE favorites @> jsonb_build_array(beat_uuid::text);
        
        UPDATE public.beats 
        SET favorites_count = new_count 
        WHERE id = beat_uuid;
      END LOOP;
    END IF;
    RETURN OLD;
  ELSE
    -- Handle INSERT/UPDATE - sync favorites count for affected beats
    IF NEW.favorites IS NOT NULL THEN
      FOR beat_uuid IN SELECT DISTINCT jsonb_array_elements_text(NEW.favorites)::uuid
      LOOP
        SELECT COUNT(*) INTO new_count
        FROM public.users 
        WHERE favorites @> jsonb_build_array(beat_uuid::text);
        
        UPDATE public.beats 
        SET favorites_count = new_count 
        WHERE id = beat_uuid;
      END LOOP;
    END IF;
    
    -- Also handle removed favorites if this is an UPDATE
    IF TG_OP = 'UPDATE' AND OLD.favorites IS NOT NULL THEN
      FOR beat_uuid IN SELECT jsonb_array_elements_text(OLD.favorites)::uuid
      WHERE NOT NEW.favorites @> jsonb_build_array((jsonb_array_elements_text(OLD.favorites))::text)
      LOOP
        SELECT COUNT(*) INTO new_count
        FROM public.users 
        WHERE favorites @> jsonb_build_array(beat_uuid::text);
        
        UPDATE public.beats 
        SET favorites_count = new_count 
        WHERE id = beat_uuid;
      END LOOP;
    END IF;
    
    RETURN NEW;
  END IF;
END;
$$;

-- Create trigger for favorites count sync (only when favorites actually changes)
DROP TRIGGER IF EXISTS sync_favorites_count_trigger ON public.users;
CREATE TRIGGER sync_favorites_count_trigger
  AFTER INSERT OR UPDATE ON public.users
  FOR EACH ROW
  WHEN (OLD.favorites IS DISTINCT FROM NEW.favorites)
  EXECUTE FUNCTION public.sync_favorites_count();

-- Phase 3: Create trigger function to auto-increment purchase count
CREATE OR REPLACE FUNCTION public.increment_purchase_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.beats
  SET purchase_count = COALESCE(purchase_count, 0) + 1
  WHERE id = NEW.beat_id;
  
  RETURN NEW;
END;
$$;

-- Create trigger for purchase count (if it doesn't exist)
DROP TRIGGER IF EXISTS increment_purchase_count_trigger ON public.user_purchased_beats;
CREATE TRIGGER increment_purchase_count_trigger
AFTER INSERT ON public.user_purchased_beats
FOR EACH ROW
EXECUTE FUNCTION public.increment_purchase_count();

-- Add indexes for better performance on counter columns
CREATE INDEX IF NOT EXISTS idx_beats_counters ON public.beats(plays, favorites_count, purchase_count);
CREATE INDEX IF NOT EXISTS idx_users_favorites_gin ON public.users USING gin(favorites);
