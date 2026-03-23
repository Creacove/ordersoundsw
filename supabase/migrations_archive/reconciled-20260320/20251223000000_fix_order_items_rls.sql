-- Migration: Bulletproof Fulfillment Engine (Enhanced)
-- Description: Fixes fulfillment logic to handle TEXT to UUID casting and normalize currencies.
-- Added: Detailed diagnostics to help debug "missing beats" issues.

CREATE OR REPLACE FUNCTION public.finalize_order_fulfillment(p_order_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_order RECORD;
    v_item RECORD;
    v_product_id_uuid UUID;
    v_currency TEXT;
    v_results JSONB := '[]'::JSONB;
    v_success_count INTEGER := 0;
    v_error_count INTEGER := 0;
    v_skipped_ids TEXT[] := ARRAY[]::TEXT[];
    v_diagnostic_log JSONB := '[]'::JSONB;
BEGIN
    -- 1. Idempotency Guard
    SELECT * INTO v_order FROM orders WHERE id = p_order_id FOR UPDATE;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Order not found');
    END IF;
    
    IF v_order.status = 'completed' THEN
        RETURN jsonb_build_object('success', true, 'message', 'Order already fulfilled', 'already_fulfilled', true);
    END IF;

    -- 2. Normalize Currency (USDC => USD)
    v_currency := CASE 
        WHEN v_order.currency_used = 'USDC' THEN 'USD' 
        ELSE v_order.currency_used 
    END;

    -- 3. Update Order Status
    UPDATE orders 
    SET status = 'completed', 
        consent_timestamp = COALESCE(consent_timestamp, NOW())
    WHERE id = p_order_id;

    -- 4. Create Payment Record
    INSERT INTO payments (order_id, amount, payment_method, status, transaction_reference, payment_date)
    VALUES (p_order_id, v_order.total_price, v_order.payment_method, 'success', 
            COALESCE(v_order.payment_reference, (v_order.transaction_signatures)[1], 'SOL_' || p_order_id::text), NOW())
    ON CONFLICT DO NOTHING;

    -- 5. Process Unified order_items
    FOR v_item IN SELECT * FROM order_items WHERE order_id = p_order_id LOOP
        BEGIN
            -- Safe UUID handling - product_id may be UUID or TEXT type
            BEGIN
                -- If product_id is already UUID, just assign it; if TEXT, cast it
                v_product_id_uuid := v_item.product_id::uuid;
            EXCEPTION WHEN OTHERS THEN
                v_error_count := v_error_count + 1;
                v_skipped_ids := array_append(v_skipped_ids, v_item.product_id::text || ' (Invalid UUID)');
                v_diagnostic_log := v_diagnostic_log || jsonb_build_object('id', v_item.product_id::text, 'error', 'Invalid UUID format');
                CONTINUE;
            END;

            -- Process based on product type
            IF EXISTS (SELECT 1 FROM beats WHERE id = v_product_id_uuid) THEN
                -- Add to Beat Library
                INSERT INTO user_purchased_beats (user_id, beat_id, order_id, license_type, currency_code)
                VALUES (v_order.buyer_id, v_product_id_uuid, p_order_id, 'basic', v_currency)
                ON CONFLICT (user_id, beat_id) DO NOTHING;

                -- Update Stats
                PERFORM increment_counter('beats', 'purchase_count', v_product_id_uuid);
                v_success_count := v_success_count + 1;
            
            ELSIF EXISTS (SELECT 1 FROM soundpacks WHERE id = v_product_id_uuid) THEN
                -- Add to Soundpack Library
                INSERT INTO user_purchased_soundpacks (user_id, pack_id, order_id, purchase_date)
                VALUES (v_order.buyer_id, v_product_id_uuid, p_order_id, NOW())
                ON CONFLICT (user_id, pack_id) DO NOTHING;

                -- Update Stats
                PERFORM increment_counter('soundpacks', 'purchase_count', v_product_id_uuid);
                v_success_count := v_success_count + 1;
            ELSE
                v_error_count := v_error_count + 1;
                v_skipped_ids := array_append(v_skipped_ids, v_item.product_id || ' (Not found in catalog)');
                v_diagnostic_log := v_diagnostic_log || jsonb_build_object('id', v_item.product_id, 'error', 'Product not found in beats or soundpacks');
            END IF;
        EXCEPTION WHEN OTHERS THEN
            v_error_count := v_error_count + 1;
            v_diagnostic_log := v_diagnostic_log || jsonb_build_object('id', v_item.product_id, 'error', SQLERRM);
        END;
    END LOOP;

    -- 6. Final Notification
    INSERT INTO notifications (recipient_id, title, body, notification_type)
    VALUES (v_order.buyer_id, 'Purchase Successful! 🎉', 'Your items have been added to your library.', 'info');

    RETURN jsonb_build_object(
        'success', true, 
        'message', 'Order processed', 
        'items_fulfilled', v_success_count,
        'items_failed', v_error_count,
        'skipped_details', v_skipped_ids,
        'diagnostics', v_diagnostic_log,
        'final_currency', v_currency
    );
END;
$$;
