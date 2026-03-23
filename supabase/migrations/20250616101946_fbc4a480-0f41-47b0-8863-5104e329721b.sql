
-- First, apply the comprehensive RLS policy fix
-- Drop existing policies
DROP POLICY IF EXISTS "Users can create their own carts" ON public.carts;
DROP POLICY IF EXISTS "Users can view their own carts" ON public.carts;
DROP POLICY IF EXISTS "Users can update their own carts" ON public.carts;
DROP POLICY IF EXISTS "Users can delete their own carts" ON public.carts;
DROP POLICY IF EXISTS "Enable all operations for carts" ON public.carts;

DROP POLICY IF EXISTS "Users can create their own cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Users can view their own cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Users can update their own cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Users can delete their own cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Enable all operations for cart items" ON public.cart_items;

-- Create new comprehensive policies for carts that handle both authenticated and guest users
CREATE POLICY "Enable all operations for carts" 
  ON public.carts 
  FOR ALL 
  USING (
    -- For authenticated users: user_id must match auth.uid() and session_id must be null
    (auth.uid() IS NOT NULL AND auth.uid() = user_id AND session_id IS NULL) OR 
    -- For guest users: user_id must be null and session_id must be provided
    (auth.uid() IS NULL AND user_id IS NULL AND session_id IS NOT NULL) OR
    -- Allow service role to access all carts
    (auth.role() = 'service_role')
  )
  WITH CHECK (
    -- For authenticated users: user_id must match auth.uid() and session_id must be null
    (auth.uid() IS NOT NULL AND auth.uid() = user_id AND session_id IS NULL) OR 
    -- For guest users: user_id must be null and session_id must be provided
    (auth.uid() IS NULL AND user_id IS NULL AND session_id IS NOT NULL) OR
    -- Allow service role to create carts for any user
    (auth.role() = 'service_role')
  );

-- Create comprehensive policies for cart_items
CREATE POLICY "Enable all operations for cart items" 
  ON public.cart_items 
  FOR ALL 
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
  )
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

-- More comprehensive cleanup of duplicate carts
-- First, handle user carts (authenticated users)
WITH user_cart_cleanup AS (
  SELECT 
    id,
    user_id,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY user_id 
      ORDER BY created_at DESC
    ) as rn
  FROM public.carts
  WHERE user_id IS NOT NULL AND session_id IS NULL
),
user_carts_to_delete AS (
  SELECT c.id
  FROM user_cart_cleanup uc
  JOIN public.carts c ON c.id = uc.id
  WHERE uc.rn > 1
)
DELETE FROM public.carts 
WHERE id IN (SELECT id FROM user_carts_to_delete);

-- Then handle session carts (guest users)  
WITH session_cart_cleanup AS (
  SELECT 
    id,
    session_id,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY session_id 
      ORDER BY created_at DESC
    ) as rn
  FROM public.carts
  WHERE session_id IS NOT NULL AND user_id IS NULL
),
session_carts_to_delete AS (
  SELECT c.id
  FROM session_cart_cleanup sc
  JOIN public.carts c ON c.id = sc.id
  WHERE sc.rn > 1
)
DELETE FROM public.carts 
WHERE id IN (SELECT id FROM session_carts_to_delete);

-- Now add the unique constraints after cleanup
CREATE UNIQUE INDEX IF NOT EXISTS idx_carts_unique_user 
  ON public.carts (user_id) 
  WHERE user_id IS NOT NULL AND session_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_carts_unique_session 
  ON public.carts (session_id) 
  WHERE session_id IS NOT NULL AND user_id IS NULL;
;
