-- ========================================
-- Fix Function Search Path Security Issues
-- Add SET search_path to all security definer functions
-- ========================================

-- Fix has_role function (already has search_path)
-- This is correctly configured

-- Fix user_owns_order function
CREATE OR REPLACE FUNCTION public.user_owns_order(order_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE 
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.orders
    WHERE id = order_id
    AND buyer_id = auth.uid()
  );
$$;

-- Fix producer_owns_beat function  
CREATE OR REPLACE FUNCTION public.producer_owns_beat(beat_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE 
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.beats
    WHERE id = beat_id
    AND producer_id = auth.uid()
  );
$$;

-- Fix producer_has_beat_in_order function
CREATE OR REPLACE FUNCTION public.producer_has_beat_in_order(order_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE 
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.line_items li
    JOIN public.beats b ON li.beat_id = b.id
    WHERE li.order_id = order_id
    AND b.producer_id = auth.uid()
  );
$$;

-- Fix is_admin function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE 
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role = 'admin' FROM public.users WHERE id = auth.uid();
$$;

-- Fix is_producer function
CREATE OR REPLACE FUNCTION public.is_producer()
RETURNS boolean
LANGUAGE sql
STABLE 
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role = 'producer' FROM public.users WHERE id = auth.uid();
$$;

-- Fix get_user_role function
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text
LANGUAGE sql
STABLE 
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.users WHERE id = user_id;
$$;

-- Fix get_producer_of_week function
CREATE OR REPLACE FUNCTION public.get_producer_of_week()
RETURNS SETOF users
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.users
  WHERE is_producer_of_week = TRUE
  LIMIT 1;
$$;

-- Fix increment_counter function
CREATE OR REPLACE FUNCTION public.increment_counter(p_table_name text, p_column_name text, p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  EXECUTE format('UPDATE %I SET %I = COALESCE(%I, 0) + 1 WHERE id = $1', 
                p_table_name, p_column_name, p_column_name)
  USING p_id;
END;
$$;

-- Fix increment_purchase_count trigger function
CREATE OR REPLACE FUNCTION public.increment_purchase_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.beats
  SET purchase_count = COALESCE(purchase_count, 0) + 1
  WHERE id = NEW.beat_id;
  
  RETURN NEW;
END;
$$;