-- Index for efficient polling of pending Solana orders
CREATE INDEX IF NOT EXISTS idx_orders_status_payment 
ON orders(status, payment_method) 
WHERE status = 'processing' AND payment_method = 'solana_usdc';
