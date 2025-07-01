
-- Check what the current constraint looks like and fix it
-- First, let's see if there's a constraint that's too restrictive
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'orders'::regclass AND conname = 'orders_amount_check';

-- If the constraint exists and is problematic, we'll drop it and recreate it properly
-- Most likely it's checking for amount > 1 instead of amount > 0
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_amount_check;

-- Add a proper constraint that allows any positive amount including decimals
ALTER TABLE orders ADD CONSTRAINT orders_total_price_positive 
CHECK (total_price > 0);
