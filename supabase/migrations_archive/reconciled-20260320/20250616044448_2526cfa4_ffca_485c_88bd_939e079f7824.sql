
-- First, let's see what policies currently exist on the orders table
SELECT schemaname, tablename, policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'orders' AND schemaname = 'public';

-- Drop all existing policies on orders table to start fresh
DROP POLICY IF EXISTS "Authenticated users can create orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can update their own orders" ON public.orders;

-- Create the new relaxed INSERT policy
CREATE POLICY "Authenticated users can create orders" 
ON public.orders 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() IS NOT NULL);

-- Create proper SELECT policy so users can only see their own orders
CREATE POLICY "Users can view their own orders" 
ON public.orders 
FOR SELECT 
TO authenticated 
USING (buyer_id = auth.uid());

-- Create proper UPDATE policy 
CREATE POLICY "Users can update their own orders" 
ON public.orders 
FOR UPDATE 
TO authenticated 
USING (buyer_id = auth.uid());
