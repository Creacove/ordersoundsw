-- Drop existing overly permissive policies on payments table
DROP POLICY IF EXISTS "Authenticated users can create payments" ON public.payments;
DROP POLICY IF EXISTS "Authenticated users can view payments" ON public.payments;

-- Create restrictive RLS policies for payments table

-- Admins can view all payments
CREATE POLICY "Admins can view all payments"
ON public.payments
FOR SELECT
TO authenticated
USING (is_admin());

-- Users can view payments for their own orders
CREATE POLICY "Users can view their own order payments"
ON public.payments
FOR SELECT
TO authenticated
USING (user_owns_order(order_id));

-- Producers can view payments for orders containing their beats
CREATE POLICY "Producers can view payments for their beats"
ON public.payments
FOR SELECT
TO authenticated
USING (producer_has_beat_in_order(order_id));

-- Allow authenticated users to create payments (needed for client-side payment processing)
CREATE POLICY "Authenticated users can create payments"
ON public.payments
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow service role full access (needed for edge functions like paystack webhook)
CREATE POLICY "Service role has full access to payments"
ON public.payments
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);