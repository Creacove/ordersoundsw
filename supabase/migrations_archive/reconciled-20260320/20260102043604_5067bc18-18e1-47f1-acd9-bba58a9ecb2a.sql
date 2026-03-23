-- Step 1: Remove duplicate entries using DISTINCT ON (keeps first row per user_id, beat_id by purchase_date)
DELETE FROM public.user_purchased_beats
WHERE id IN (
    SELECT id FROM (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id, beat_id ORDER BY purchase_date ASC NULLS LAST, id) as rn
        FROM public.user_purchased_beats
    ) duplicates
    WHERE rn > 1
);

-- Step 2: Now add the unique constraint (will succeed after deduplication)
ALTER TABLE public.user_purchased_beats 
ADD CONSTRAINT user_purchased_beats_user_id_beat_id_key UNIQUE (user_id, beat_id);

-- Step 3: Add index on order_id for faster reconciliation queries
CREATE INDEX IF NOT EXISTS idx_user_purchased_beats_order_id 
ON public.user_purchased_beats(order_id);

-- Step 4: Update finalize_order_fulfillment to be idempotent (re-runnable)
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
    -- 1. Get Order (with lock to prevent race conditions)
    SELECT * INTO v_order FROM orders WHERE id = p_order_id FOR UPDATE;
    IF NOT FOUND THEN 
        RETURN jsonb_build_object('success', false, 'message', 'Order not found'); 
    END IF;
    
    -- 2. Check if already completed (but still proceed to fix missing purchases)
    IF v_order.status = 'completed' THEN 
        v_already_completed := TRUE;
    ELSE
        -- Only update order status if not already completed
        UPDATE orders SET status = 'completed', consent_timestamp = NOW() WHERE id = p_order_id;
    END IF;

    -- 3. Normalize Currency
    v_currency := CASE WHEN v_order.currency_used = 'USDC' THEN 'USD' ELSE v_order.currency_used END;

    -- 4. Create Payment Record ONLY if order was not already completed
    IF NOT v_already_completed THEN
        INSERT INTO payments (order_id, amount, payment_method, status, transaction_reference, payment_date)
        VALUES (p_order_id, v_order.total_price, v_order.payment_method, 'success', 
                COALESCE(v_order.payment_reference, (v_order.transaction_signatures)[1], 'TXN_'||p_order_id), NOW())
        ON CONFLICT DO NOTHING;
    END IF;

    -- 5. Process Items - ALWAYS run this to recover missing purchases
    -- This is now safe because we have UNIQUE constraint on (user_id, beat_id)
    FOR v_item IN SELECT * FROM order_items WHERE order_id = p_order_id LOOP
        BEGIN
            -- Handle product_id being either UUID or TEXT in the database
            v_product_id_uuid := v_item.product_id::text::uuid;

            -- Try to add to Library - ON CONFLICT now works correctly with unique constraint
            IF EXISTS (SELECT 1 FROM beats WHERE id = v_product_id_uuid) THEN
                INSERT INTO user_purchased_beats (user_id, beat_id, order_id, license_type, currency_code)
                VALUES (v_order.buyer_id, v_product_id_uuid, p_order_id, 'basic', v_currency)
                ON CONFLICT (user_id, beat_id) DO NOTHING;
                v_success_count := v_success_count + 1;
            ELSIF EXISTS (SELECT 1 FROM soundpacks WHERE id = v_product_id_uuid) THEN
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

    -- 6. Notify User ONLY if order was not already completed
    IF NOT v_already_completed THEN
        INSERT INTO notifications (recipient_id, title, body, notification_type)
        VALUES (v_order.buyer_id, 'Purchase Successful! 🎉', 'Your items have been added to your library.', 'info');
    END IF;

    RETURN jsonb_build_object(
        'success', true, 
        'items_fulfilled', v_success_count, 
        'items_failed', v_error_count,
        'already_completed', v_already_completed
    );
END;
$function$;