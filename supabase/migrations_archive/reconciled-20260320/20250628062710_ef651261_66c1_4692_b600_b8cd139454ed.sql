
-- Phase 1: Fix the broken sync_favorites_count function
-- Replace the problematic function with PostgreSQL-compliant version
CREATE OR REPLACE FUNCTION public.sync_favorites_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  beat_uuid uuid;
  new_count integer;
  old_favorites_array text[];
  new_favorites_array text[];
BEGIN
  -- Handle both INSERT/UPDATE and DELETE cases
  IF TG_OP = 'DELETE' THEN
    -- For each beat in the old favorites array, decrement the count
    IF OLD.favorites IS NOT NULL THEN
      -- Convert jsonb array to text array for easier processing
      SELECT ARRAY(SELECT jsonb_array_elements_text(OLD.favorites)) INTO old_favorites_array;
      
      FOREACH beat_uuid IN ARRAY old_favorites_array::uuid[]
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
      -- Convert jsonb array to text array for easier processing
      SELECT ARRAY(SELECT jsonb_array_elements_text(NEW.favorites)) INTO new_favorites_array;
      
      FOREACH beat_uuid IN ARRAY new_favorites_array::uuid[]
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
      -- Get old favorites that are not in new favorites
      SELECT ARRAY(SELECT jsonb_array_elements_text(OLD.favorites)) INTO old_favorites_array;
      
      FOREACH beat_uuid IN ARRAY old_favorites_array::uuid[]
      LOOP
        -- Check if this beat is not in the new favorites
        IF NEW.favorites IS NULL OR NOT NEW.favorites @> jsonb_build_array(beat_uuid::text) THEN
          SELECT COUNT(*) INTO new_count
          FROM public.users 
          WHERE favorites @> jsonb_build_array(beat_uuid::text);
          
          UPDATE public.beats 
          SET favorites_count = new_count 
          WHERE id = beat_uuid;
        END IF;
      END LOOP;
    END IF;
    
    RETURN NEW;
  END IF;
END;
$$;
