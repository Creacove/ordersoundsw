-- ========================================
-- Enable RLS on all tables missing it
-- ========================================

-- Enable RLS on orders table
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Enable RLS on royalty_splits table  
ALTER TABLE public.royalty_splits ENABLE ROW LEVEL SECURITY;

-- Enable RLS on auth_logs table
ALTER TABLE public.auth_logs ENABLE ROW LEVEL SECURITY;

-- Enable RLS on payouts table
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

-- ========================================
-- ORDERS TABLE POLICIES
-- ========================================

-- Buyers can view their own orders
CREATE POLICY "Buyers can view their own orders"
ON public.orders
FOR SELECT
TO authenticated
USING (buyer_id = auth.uid());

-- Producers can view orders containing their beats
CREATE POLICY "Producers can view orders with their beats"
ON public.orders
FOR SELECT
TO authenticated
USING (producer_has_beat_in_order(id));

-- Admins can view all orders
CREATE POLICY "Admins can view all orders"
ON public.orders
FOR SELECT
TO authenticated
USING (is_admin());

-- Authenticated users can create orders (needed for checkout flow)
CREATE POLICY "Authenticated users can create orders"
ON public.orders
FOR INSERT
TO authenticated
WITH CHECK (buyer_id = auth.uid());

-- Users can update their own pending orders
CREATE POLICY "Users can update their own orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (buyer_id = auth.uid());

-- Service role has full access (needed for webhook handlers)
CREATE POLICY "Service role has full access to orders"
ON public.orders
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ========================================
-- ROYALTY_SPLITS TABLE POLICIES
-- ========================================

-- Beat owners can view splits for their beats
CREATE POLICY "Beat owners can view their beat splits"
ON public.royalty_splits
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.beats
    WHERE beats.id = royalty_splits.beat_id
    AND beats.producer_id = auth.uid()
  )
);

-- Collaborators can view splits they're part of
CREATE POLICY "Collaborators can view their splits"
ON public.royalty_splits
FOR SELECT
TO authenticated
USING (party_id = auth.uid());

-- Beat owners can manage splits for their beats
CREATE POLICY "Beat owners can insert splits"
ON public.royalty_splits
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.beats
    WHERE beats.id = royalty_splits.beat_id
    AND beats.producer_id = auth.uid()
  )
);

CREATE POLICY "Beat owners can update their beat splits"
ON public.royalty_splits
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.beats
    WHERE beats.id = royalty_splits.beat_id
    AND beats.producer_id = auth.uid()
  )
);

CREATE POLICY "Beat owners can delete their beat splits"
ON public.royalty_splits
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.beats
    WHERE beats.id = royalty_splits.beat_id
    AND beats.producer_id = auth.uid()
  )
);

-- Admins can view all splits
CREATE POLICY "Admins can view all royalty splits"
ON public.royalty_splits
FOR SELECT
TO authenticated
USING (is_admin());

-- ========================================
-- PAYOUTS TABLE POLICIES
-- ========================================

-- Producers can view their own payouts
CREATE POLICY "Producers can view their own payouts"
ON public.payouts
FOR SELECT
TO authenticated
USING (producer_id = auth.uid());

-- Admins can view all payouts
CREATE POLICY "Admins can view all payouts"
ON public.payouts
FOR SELECT
TO authenticated
USING (is_admin());

-- Service role has full access (needed for webhook handlers to create/update payouts)
CREATE POLICY "Service role has full access to payouts"
ON public.payouts
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ========================================
-- AUTH_LOGS TABLE POLICIES
-- ========================================

-- Only admins can view auth logs
CREATE POLICY "Admins can view auth logs"
ON public.auth_logs
FOR SELECT
TO authenticated
USING (is_admin());

-- System can create auth logs (via service role or trigger)
CREATE POLICY "System can create auth logs"
ON public.auth_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Service role has full access
CREATE POLICY "Service role has full access to auth logs"
ON public.auth_logs
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);