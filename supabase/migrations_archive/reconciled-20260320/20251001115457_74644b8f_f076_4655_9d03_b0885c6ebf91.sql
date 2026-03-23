-- ========================================
-- Fix remaining SECURITY DEFINER functions
-- ========================================

-- Fix handle_auth_token_storage function
CREATE OR REPLACE FUNCTION public.handle_auth_token_storage()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Store new token data when a user signs in
  INSERT INTO public.auth_sessions (
    user_id, 
    refresh_token, 
    access_token, 
    provider,
    expires_at,
    metadata
  )
  VALUES (
    NEW.id,
    NEW.refresh_token,
    NEW.raw_app_meta_data->>'access_token',
    COALESCE(NEW.raw_app_meta_data->>'provider', 'email'),
    (NOW() + INTERVAL '1 hour'),  -- Typical expiration
    jsonb_build_object(
      'last_sign_in', NEW.last_sign_in_at,
      'provider_id', NEW.raw_user_meta_data->>'sub',
      'app_version', current_setting('app.current_version', true)
    )
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    refresh_token = EXCLUDED.refresh_token,
    access_token = EXCLUDED.access_token,
    expires_at = EXCLUDED.expires_at,
    updated_at = now(),
    metadata = jsonb_set(auth_sessions.metadata, '{last_update}', to_jsonb(now()));
    
  RETURN NEW;
END;
$$;

-- Fix refresh_auth_token function
CREATE OR REPLACE FUNCTION public.refresh_auth_token(p_user_id uuid, p_refresh_token text, p_new_access_token text, p_new_refresh_token text DEFAULT NULL::text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  success BOOLEAN;
BEGIN
  -- Update the tokens
  UPDATE public.auth_sessions
  SET 
    access_token = p_new_access_token,
    refresh_token = COALESCE(p_new_refresh_token, refresh_token),
    expires_at = (NOW() + INTERVAL '1 hour'),
    updated_at = now(),
    metadata = jsonb_set(metadata, '{last_refresh}', to_jsonb(now()))
  WHERE 
    user_id = p_user_id AND 
    refresh_token = p_refresh_token;
    
  -- Check if update was successful
  GET DIAGNOSTICS success = ROW_COUNT;
  RETURN success > 0;
END;
$$;

-- Fix sync_favorites_count function
CREATE OR REPLACE FUNCTION public.sync_favorites_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Fix update_session_version function
CREATE OR REPLACE FUNCTION public.update_session_version(p_user_id uuid, p_version text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.auth_sessions
  SET 
    metadata = jsonb_set(
      jsonb_set(metadata, '{app_version}', to_jsonb(p_version)), 
      '{version_updated}', 
      to_jsonb(now())
    ),
    updated_at = now()
  WHERE user_id = p_user_id;
END;
$$;