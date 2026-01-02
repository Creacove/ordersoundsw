-- Unified Fulfillment Engine for Order Processing
-- This function ensures that all steps of order fulfillment (library updates, notifications, stats) 
-- happen atomically and are idempotent.

CREATE OR REPLACE FUNCTION public.finalize_order_fulfillment(p_order_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_order RECORD;
    v_buyer RECORD;
    v_item RECORD;
    v_producer RECORD;
    v_payout_amount NUMERIC;
    v_buyer_notified BOOLEAN := FALSE;
    v_results JSONB := '{}'::JSONB;
BEGIN
    -- 1. Idempotency Guard: Check if order exists and is not already completed
    SELECT * INTO v_order FROM orders WHERE id = p_order_id FOR UPDATE;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Order not found');
    END IF;
    
    IF v_order.status = 'completed' THEN
        RETURN jsonb_build_object('success', true, 'message', 'Order already fulfilled', 'already_fulfilled', true);
    END IF;

    -- 2. Fetch Buyer Details
    SELECT * INTO v_buyer FROM users WHERE id = v_order.buyer_id;

    -- 3. Update Order Status
    UPDATE orders 
    SET status = 'completed', 
        consent_timestamp = COALESCE(consent_timestamp, NOW())
    WHERE id = p_order_id;

    -- 4. Create Payment Record (Financial Audit Trail)
    -- This handles the internal accounting
    INSERT INTO payments (
        order_id,
        amount,
        payment_method,
        status,
        transaction_reference,
        payment_date
    ) VALUES (
        p_order_id,
        v_order.total_price,
        v_order.payment_method,
        'success',
        COALESCE(v_order.payment_reference, (v_order.transaction_signatures)[1]),
        NOW()
    ) ON CONFLICT DO NOTHING;

    -- 5. Process Items (BEATS) from line_items (Paystack legacy flow)
    FOR v_item IN SELECT * FROM line_items WHERE order_id = p_order_id LOOP
        -- Add to Library
        INSERT INTO user_purchased_beats (
            user_id,
            beat_id,
            order_id,
            license_type,
            currency_code
        ) VALUES (
            v_order.buyer_id,
            v_item.beat_id,
            p_order_id,
            'basic', -- Defaulting to basic if not specified in line_items
            v_order.currency_used
        ) ON CONFLICT DO NOTHING;

        -- Update Stats
        PERFORM increment_counter('beats', 'purchase_count', v_item.beat_id);

        -- Notify Producer
        SELECT u.* INTO v_producer 
        FROM users u 
        JOIN beats b ON b.producer_id = u.id 
        WHERE b.id = v_item.beat_id;

        IF FOUND THEN
            INSERT INTO notifications (
                recipient_id,
                title,
                body,
                notification_type,
                related_entity_type,
                related_entity_id
            ) VALUES (
                v_producer.id,
                'New Beat Sale!',
                'Your beat has been purchased for ' || v_order.currency_used || ' ' || v_item.price_charged,
                'sale',
                'beat',
                v_item.beat_id
            );
        END IF;
    END LOOP;

    -- 6. Process Items (BEATS/SOUNDPACKS) from order_items (Solana / Unified flow)
    FOR v_item IN SELECT * FROM order_items WHERE order_id = p_order_id LOOP
        -- Check if it's a beat (search beats table)
        IF EXISTS (SELECT 1 FROM beats WHERE id = v_item.product_id) THEN
            -- Add to Beat Library
            INSERT INTO user_purchased_beats (
                user_id,
                beat_id,
                order_id,
                license_type,
                currency_code
            ) VALUES (
                v_order.buyer_id,
                v_item.product_id,
                p_order_id,
                'basic',
                v_order.currency_used
            ) ON CONFLICT DO NOTHING;

            -- Update Beat Stats
            PERFORM increment_counter('beats', 'purchase_count', v_item.product_id);

            -- Notify Producer
            SELECT u.* INTO v_producer 
            FROM users u 
            JOIN beats b ON b.producer_id = u.id 
            WHERE b.id = v_item.product_id;

            IF FOUND THEN
                INSERT INTO notifications (
                    recipient_id,
                    title,
                    body,
                    notification_type,
                    related_entity_type,
                    related_entity_id
                ) VALUES (
                    v_producer.id,
                    'New Beat Sale!',
                    'Your beat "' || v_item.title || '" has been purchased for ' || v_order.currency_used || ' ' || v_item.price,
                    'sale',
                    'beat',
                    v_item.product_id
                );
            END IF;
        
        -- Check if it's a soundpack
        ELSIF EXISTS (SELECT 1 FROM soundpacks WHERE id = v_item.product_id) THEN
            -- Add to Soundpack Library
            INSERT INTO user_purchased_soundpacks (
                user_id,
                pack_id,
                order_id,
                purchase_date
            ) VALUES (
                v_order.buyer_id,
                v_item.product_id,
                p_order_id,
                NOW()
            ) ON CONFLICT DO NOTHING;

            -- Update Soundpack Stats
            PERFORM increment_counter('soundpacks', 'purchase_count', v_item.product_id);

            -- Notify Producer
            SELECT u.* INTO v_producer 
            FROM users u 
            JOIN soundpacks s ON s.producer_id = u.id 
            WHERE s.id = v_item.product_id;

            IF FOUND THEN
                INSERT INTO notifications (
                    recipient_id,
                    title,
                    body,
                    notification_type,
                    related_entity_type,
                    related_entity_id
                ) VALUES (
                    v_producer.id,
                    'Soundpack Sale!',
                    'Your soundpack "' || v_item.title || '" has been purchased for ' || v_order.currency_used || ' ' || v_item.price,
                    'sale',
                    'soundpack',
                    v_item.product_id
                );
            END IF;
        END IF;
    END LOOP;

    -- 7. Notify Buyer (Persistent Notification)
    INSERT INTO notifications (
        recipient_id,
        title,
        body,
        notification_type
    ) VALUES (
        v_order.buyer_id,
        'Purchase Successful! 🎉',
        'Thank you for your purchase of ' || v_order.currency_used || ' ' || v_order.total_price || '. Your items are now available in your library.',
        'info'
    );

    RETURN jsonb_build_object('success', true, 'message', 'Order fulfilled successfully');
END;
$$;
