
-- Fix RLS policies for carts table to properly handle INSERT operations
DROP POLICY IF EXISTS "Users can create their own carts" ON public.carts;

CREATE POLICY "Users can create their own carts" 
  ON public.carts 
  FOR INSERT 
  WITH CHECK (
    -- For authenticated users: user_id must match auth.uid() and session_id must be null
    (auth.uid() IS NOT NULL AND auth.uid() = user_id AND session_id IS NULL) OR 
    -- For guest users: user_id must be null and session_id must be provided
    (auth.uid() IS NULL AND user_id IS NULL AND session_id IS NOT NULL) OR
    -- Allow service role to create carts for any user
    (auth.role() = 'service_role')
  );

-- Fix RLS policies for cart_items table to properly handle INSERT operations  
DROP POLICY IF EXISTS "Users can create their own cart items" ON public.cart_items;

CREATE POLICY "Users can create their own cart items" 
  ON public.cart_items 
  FOR INSERT 
  WITH CHECK (
    cart_id IN (
      SELECT id FROM public.carts 
      WHERE 
        -- For authenticated users
        (auth.uid() IS NOT NULL AND auth.uid() = user_id AND session_id IS NULL) OR 
        -- For guest users  
        (auth.uid() IS NULL AND user_id IS NULL AND session_id IS NOT NULL) OR
        -- Allow service role
        (auth.role() = 'service_role')
    )
  );

-- Also update the SELECT policies to be consistent
DROP POLICY IF EXISTS "Users can view their own carts" ON public.carts;
DROP POLICY IF EXISTS "Users can view their own cart items" ON public.cart_items;

CREATE POLICY "Users can view their own carts" 
  ON public.carts 
  FOR SELECT 
  USING (
    -- For authenticated users
    (auth.uid() IS NOT NULL AND auth.uid() = user_id AND session_id IS NULL) OR 
    -- For guest users
    (auth.uid() IS NULL AND user_id IS NULL AND session_id IS NOT NULL) OR
    -- Allow service role
    (auth.role() = 'service_role')
  );

CREATE POLICY "Users can view their own cart items" 
  ON public.cart_items 
  FOR SELECT 
  USING (
    cart_id IN (
      SELECT id FROM public.carts 
      WHERE 
        -- For authenticated users
        (auth.uid() IS NOT NULL AND auth.uid() = user_id AND session_id IS NULL) OR 
        -- For guest users
        (auth.uid() IS NULL AND user_id IS NULL AND session_id IS NOT NULL) OR
        -- Allow service role
        (auth.role() = 'service_role')
    )
  );
;
