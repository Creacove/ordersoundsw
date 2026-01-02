-- Add 'processing' to the allowed statuses for orders
-- This allows for resilient background verification without violating constraints

-- 1. Drop the old constraint
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- 2. Add the new constraint with 'processing' included
ALTER TABLE public.orders 
ADD CONSTRAINT orders_status_check 
CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled'));

-- 3. Re-ensure our index is using the correct status
DROP INDEX IF EXISTS idx_orders_status_payment;
CREATE INDEX idx_orders_status_payment 
ON orders(status, payment_method) 
WHERE status = 'processing' AND payment_method = 'solana_usdc';
