
-- Drop the existing problematic INSERT policy
DROP POLICY IF EXISTS "Authenticated users can create orders" ON public.orders;

-- Create a new INSERT policy that properly validates buyer_id matches auth.uid()
CREATE POLICY "Users can create their own orders" 
ON public.orders 
FOR INSERT 
TO authenticated 
WITH CHECK (buyer_id = auth.uid());

-- Ensure the SELECT policy allows users to view their own orders
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
CREATE POLICY "Users can view their own orders" 
ON public.orders 
FOR SELECT 
TO authenticated 
USING (buyer_id = auth.uid());

-- Ensure the UPDATE policy allows users to update their own orders
DROP POLICY IF EXISTS "Users can update their own orders" ON public.orders;
CREATE POLICY "Users can update their own orders" 
ON public.orders 
FOR UPDATE 
TO authenticated 
USING (buyer_id = auth.uid());
