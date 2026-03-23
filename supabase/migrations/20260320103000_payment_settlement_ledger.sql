-- Normalize order snapshots and introduce an auditable settlement ledger.

-- 1. Deduplicate payments and enforce one payment row per order.
DELETE FROM public.payments
WHERE id IN (
  SELECT id
  FROM (
    SELECT
      id,
      ROW_NUMBER() OVER (
        PARTITION BY order_id
        ORDER BY payment_date DESC NULLS LAST, transaction_reference DESC NULLS LAST, id DESC
      ) AS rn
    FROM public.payments
  ) ranked
  WHERE ranked.rn > 1
);

DO $$
BEGIN
  ALTER TABLE public.payments
    ADD CONSTRAINT payments_order_id_key UNIQUE (order_id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2. Make order_items a durable checkout snapshot.
ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS license_type text,
  ADD COLUMN IF NOT EXISTS producer_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS product_type text;

DO $$
BEGIN
  ALTER TABLE public.order_items
    ADD CONSTRAINT order_items_product_type_check
    CHECK (product_type IN ('beat', 'soundpack'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

UPDATE public.order_items oi
SET
  license_type = COALESCE(NULLIF(oi.license_type, ''), 'basic'),
  product_type = COALESCE(
    oi.product_type,
    CASE
      WHEN EXISTS (SELECT 1 FROM public.beats b WHERE b.id = oi.product_id::uuid) THEN 'beat'
      WHEN EXISTS (SELECT 1 FROM public.soundpacks s WHERE s.id = oi.product_id::uuid) THEN 'soundpack'
      ELSE NULL
    END
  ),
  producer_id = COALESCE(
    oi.producer_id,
    (SELECT b.producer_id FROM public.beats b WHERE b.id = oi.product_id::uuid),
    (SELECT s.producer_id FROM public.soundpacks s WHERE s.id = oi.product_id::uuid)
  )
WHERE oi.product_id IS NOT NULL;

-- 3. Track settlement allocations separately from payout attempts.
CREATE TABLE IF NOT EXISTS public.payment_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  payment_id uuid REFERENCES public.payments(id) ON DELETE CASCADE,
  producer_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  payout_id uuid REFERENCES public.payouts(id) ON DELETE SET NULL,
  product_id uuid NOT NULL,
  product_type text NOT NULL CHECK (product_type IN ('beat', 'soundpack')),
  license_type text NOT NULL DEFAULT 'basic',
  title text NOT NULL,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  gross_amount numeric NOT NULL CHECK (gross_amount >= 0),
  producer_share numeric NOT NULL CHECK (producer_share >= 0),
  platform_share numeric NOT NULL CHECK (platform_share >= 0),
  currency_code text NOT NULL,
  settlement_status text NOT NULL DEFAULT 'pending'
    CHECK (settlement_status IN ('pending', 'queued_for_payout', 'paid', 'failed', 'not_applicable')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (order_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_payment_allocations_order_id
  ON public.payment_allocations(order_id);

CREATE INDEX IF NOT EXISTS idx_payment_allocations_producer_status
  ON public.payment_allocations(producer_id, settlement_status);

ALTER TABLE public.payment_allocations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Buyers can view their own payment allocations" ON public.payment_allocations;
CREATE POLICY "Buyers can view their own payment allocations"
ON public.payment_allocations
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.orders o
    WHERE o.id = payment_allocations.order_id
      AND o.buyer_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Producers can view their own payment allocations" ON public.payment_allocations;
CREATE POLICY "Producers can view their own payment allocations"
ON public.payment_allocations
FOR SELECT
TO authenticated
USING (producer_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all payment allocations" ON public.payment_allocations;
CREATE POLICY "Admins can view all payment allocations"
ON public.payment_allocations
FOR SELECT
TO authenticated
USING (is_admin());

DROP POLICY IF EXISTS "Service role has full access to payment allocations" ON public.payment_allocations;
CREATE POLICY "Service role has full access to payment allocations"
ON public.payment_allocations
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 4. Add order context to payout rows so mixed-producer carts can be reconciled.
ALTER TABLE public.payouts
  ADD COLUMN IF NOT EXISTS order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_payouts_order_id
  ON public.payouts(order_id);

DELETE FROM public.payouts
WHERE id IN (
  SELECT id
  FROM (
    SELECT
      id,
      ROW_NUMBER() OVER (
        PARTITION BY payment_id, order_id, producer_id
        ORDER BY payout_date DESC NULLS LAST, created_at DESC NULLS LAST, id DESC
      ) AS rn
    FROM public.payouts
    WHERE payment_id IS NOT NULL
      AND order_id IS NOT NULL
      AND producer_id IS NOT NULL
  ) ranked
  WHERE ranked.rn > 1
);

DO $$
BEGIN
  ALTER TABLE public.payouts
    ADD CONSTRAINT payouts_payment_order_producer_key UNIQUE (payment_id, order_id, producer_id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 5. Fix producer visibility helpers so soundpack orders participate in RLS checks too.
CREATE OR REPLACE FUNCTION public.producer_has_beat_in_order(order_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.order_items oi
    WHERE oi.order_id = $1
      AND oi.producer_id = auth.uid()
  );
$function$;

-- 6. Make fulfillment idempotent and preserve license snapshots.
CREATE OR REPLACE FUNCTION public.finalize_order_fulfillment(p_order_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_order RECORD;
    v_item RECORD;
    v_product_id_uuid UUID;
    v_currency TEXT;
    v_success_count INTEGER := 0;
    v_error_count INTEGER := 0;
    v_already_completed BOOLEAN := FALSE;
BEGIN
    SELECT * INTO v_order FROM orders WHERE id = p_order_id FOR UPDATE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Order not found');
    END IF;

    IF v_order.status = 'completed' THEN
        v_already_completed := TRUE;
    ELSE
        UPDATE orders
        SET status = 'completed', consent_timestamp = NOW()
        WHERE id = p_order_id;
    END IF;

    v_currency := CASE WHEN v_order.currency_used = 'USDC' THEN 'USD' ELSE v_order.currency_used END;

    INSERT INTO payments (
        order_id,
        amount,
        payment_method,
        status,
        transaction_reference,
        payment_date
    )
    VALUES (
        p_order_id,
        v_order.total_price,
        v_order.payment_method,
        'success',
        COALESCE(v_order.payment_reference, (v_order.transaction_signatures)[1], 'TXN_' || p_order_id),
        NOW()
    )
    ON CONFLICT (order_id) DO UPDATE
    SET
        amount = EXCLUDED.amount,
        payment_method = EXCLUDED.payment_method,
        status = 'success',
        transaction_reference = COALESCE(EXCLUDED.transaction_reference, payments.transaction_reference),
        payment_date = COALESCE(payments.payment_date, EXCLUDED.payment_date);

    FOR v_item IN SELECT * FROM order_items WHERE order_id = p_order_id LOOP
        BEGIN
            v_product_id_uuid := v_item.product_id::text::uuid;

            IF (
              COALESCE(v_item.product_type, 'beat') = 'beat'
              OR EXISTS (SELECT 1 FROM beats WHERE id = v_product_id_uuid)
            ) AND EXISTS (SELECT 1 FROM beats WHERE id = v_product_id_uuid) THEN
                INSERT INTO user_purchased_beats (user_id, beat_id, order_id, license_type, currency_code)
                VALUES (
                  v_order.buyer_id,
                  v_product_id_uuid,
                  p_order_id,
                  COALESCE(NULLIF(v_item.license_type, ''), 'basic'),
                  v_currency
                )
                ON CONFLICT (user_id, beat_id) DO NOTHING;
                v_success_count := v_success_count + 1;
            ELSIF (
              COALESCE(v_item.product_type, 'soundpack') = 'soundpack'
              OR EXISTS (SELECT 1 FROM soundpacks WHERE id = v_product_id_uuid)
            ) AND EXISTS (SELECT 1 FROM soundpacks WHERE id = v_product_id_uuid) THEN
                INSERT INTO user_purchased_soundpacks (user_id, pack_id, order_id, purchase_date)
                VALUES (v_order.buyer_id, v_product_id_uuid, p_order_id, NOW())
                ON CONFLICT (user_id, pack_id) DO NOTHING;
                v_success_count := v_success_count + 1;
            ELSE
                v_error_count := v_error_count + 1;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            v_error_count := v_error_count + 1;
        END;
    END LOOP;

    IF NOT v_already_completed THEN
        INSERT INTO notifications (recipient_id, title, body, notification_type)
        VALUES (
          v_order.buyer_id,
          'Purchase Successful!',
          'Your items have been added to your library.',
          'info'
        );
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'items_fulfilled', v_success_count,
        'items_failed', v_error_count,
        'already_completed', v_already_completed
    );
END;
$function$;
