
-- Drop existing policies that are causing issues
DROP POLICY IF EXISTS "Users can view their own carts" ON public.carts;
DROP POLICY IF EXISTS "Users can create their own carts" ON public.carts;
DROP POLICY IF EXISTS "Users can update their own carts" ON public.carts;
DROP POLICY IF EXISTS "Users can delete their own carts" ON public.carts;

DROP POLICY IF EXISTS "Users can view their own cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Users can create their own cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Users can update their own cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Users can delete their own cart items" ON public.cart_items;

-- Create simplified RLS policies for carts
CREATE POLICY "Users can view their own carts" 
  ON public.carts 
  FOR SELECT 
  USING (
    (auth.uid() = user_id AND session_id IS NULL) OR 
    (user_id IS NULL AND session_id IS NOT NULL)
  );

CREATE POLICY "Users can create their own carts" 
  ON public.carts 
  FOR INSERT 
  WITH CHECK (
    (auth.uid() = user_id AND session_id IS NULL) OR 
    (user_id IS NULL AND session_id IS NOT NULL)
  );

CREATE POLICY "Users can update their own carts" 
  ON public.carts 
  FOR UPDATE 
  USING (
    (auth.uid() = user_id AND session_id IS NULL) OR 
    (user_id IS NULL AND session_id IS NOT NULL)
  );

CREATE POLICY "Users can delete their own carts" 
  ON public.carts 
  FOR DELETE 
  USING (
    (auth.uid() = user_id AND session_id IS NULL) OR 
    (user_id IS NULL AND session_id IS NOT NULL)
  );

-- Create simplified RLS policies for cart_items
CREATE POLICY "Users can view their own cart items" 
  ON public.cart_items 
  FOR SELECT 
  USING (
    cart_id IN (
      SELECT id FROM public.carts 
      WHERE (auth.uid() = user_id AND session_id IS NULL) OR 
            (user_id IS NULL AND session_id IS NOT NULL)
    )
  );

CREATE POLICY "Users can create their own cart items" 
  ON public.cart_items 
  FOR INSERT 
  WITH CHECK (
    cart_id IN (
      SELECT id FROM public.carts 
      WHERE (auth.uid() = user_id AND session_id IS NULL) OR 
            (user_id IS NULL AND session_id IS NOT NULL)
    )
  );

CREATE POLICY "Users can update their own cart items" 
  ON public.cart_items 
  FOR UPDATE 
  USING (
    cart_id IN (
      SELECT id FROM public.carts 
      WHERE (auth.uid() = user_id AND session_id IS NULL) OR 
            (user_id IS NULL AND session_id IS NOT NULL)
    )
  );

CREATE POLICY "Users can delete their own cart items" 
  ON public.cart_items 
  FOR DELETE 
  USING (
    cart_id IN (
      SELECT id FROM public.carts 
      WHERE (auth.uid() = user_id AND session_id IS NULL) OR 
            (user_id IS NULL AND session_id IS NOT NULL)
    )
  );
;
