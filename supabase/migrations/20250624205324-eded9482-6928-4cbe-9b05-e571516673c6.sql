
-- Drop all remaining RLS policies on orders table
DROP POLICY IF EXISTS "Admins have full access to orders" ON public.orders;
DROP POLICY IF EXISTS "Buyers can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Producers can view orders with their beats" ON public.orders;
DROP POLICY IF EXISTS "Service role can access all orders" ON public.orders;

-- Disable RLS entirely on orders table
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
