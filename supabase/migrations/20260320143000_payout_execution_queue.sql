ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS paystack_transfer_recipient_code text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_paystack_transfer_recipient_code
  ON public.users(paystack_transfer_recipient_code)
  WHERE paystack_transfer_recipient_code IS NOT NULL;

ALTER TABLE public.payouts
  ADD COLUMN IF NOT EXISTS paystack_transfer_code text,
  ADD COLUMN IF NOT EXISTS paystack_transfer_recipient_code text,
  ADD COLUMN IF NOT EXISTS payout_attempt_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_attempt_at timestamptz,
  ADD COLUMN IF NOT EXISTS processing_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS next_retry_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_payouts_status_next_retry
  ON public.payouts(status, next_retry_at, created_at);

CREATE INDEX IF NOT EXISTS idx_payouts_transaction_reference
  ON public.payouts(transaction_reference)
  WHERE transaction_reference IS NOT NULL;

CREATE OR REPLACE FUNCTION public.claim_paystack_payouts(p_limit integer DEFAULT 10)
RETURNS TABLE (
  id uuid,
  producer_id uuid,
  payment_id uuid,
  order_id uuid,
  amount numeric,
  transaction_reference text,
  transaction_details jsonb,
  payout_attempt_count integer,
  status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  WITH candidates AS (
    SELECT p.id
    FROM public.payouts p
    WHERE p.payment_id IS NOT NULL
      AND p.order_id IS NOT NULL
      AND p.amount > 0
      AND (
        p.status IN ('pending', 'failed')
        OR (
          p.status = 'processing'
          AND p.processing_started_at IS NOT NULL
          AND p.processing_started_at <= now() - interval '15 minutes'
        )
      )
      AND (p.next_retry_at IS NULL OR p.next_retry_at <= now())
    ORDER BY COALESCE(p.next_retry_at, p.created_at) ASC, p.created_at ASC
    LIMIT GREATEST(COALESCE(p_limit, 10), 1)
    FOR UPDATE SKIP LOCKED
  ),
  updated AS (
    UPDATE public.payouts p
    SET
      status = 'processing',
      processing_started_at = now(),
      last_attempt_at = now(),
      payout_attempt_count = COALESCE(p.payout_attempt_count, 0) + 1,
      next_retry_at = NULL,
      failure_reason = NULL
    FROM candidates c
    WHERE p.id = c.id
    RETURNING
      p.id,
      p.producer_id,
      p.payment_id,
      p.order_id,
      p.amount,
      p.transaction_reference,
      p.transaction_details,
      p.payout_attempt_count,
      p.status
  )
  SELECT
    updated.id,
    updated.producer_id,
    updated.payment_id,
    updated.order_id,
    updated.amount,
    updated.transaction_reference,
    updated.transaction_details,
    updated.payout_attempt_count,
    updated.status
  FROM updated;
END;
$function$;
