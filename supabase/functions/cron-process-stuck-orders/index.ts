import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Connection } from 'https://esm.sh/@solana/web3.js@1.78.3';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    try {
        console.log('[Cron] Starting stuck order sweep...');

        // 1. Setup Admin Client
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // 2. Setup Solana RPC
        const envRpc = Deno.env.get('SOLANA_RPC_URL');
        // Fallback to mainnet public RPC if not set (cron should ideally use a paid one)
        const rpcUrl = envRpc || 'https://api.mainnet-beta.solana.com';
        const connection = new Connection(rpcUrl, 'confirmed');

        // 3. Find Stuck Orders
        // Criteria: 'processing', 'solana_usdc', has signatures, created > 2 mins ago
        const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();

        const { data: orders, error: fetchError } = await supabase
            .from('orders')
            .select('*')
            .eq('status', 'processing')
            .eq('payment_method', 'solana_usdc')
            .lt('created_at', twoMinutesAgo)
            .limit(20); // Process in batches of 20

        if (fetchError) throw fetchError;

        if (!orders || orders.length === 0) {
            console.log('[Cron] No stuck orders found.');
            return new Response(JSON.stringify({ message: 'No stuck orders' }), { headers: corsHeaders });
        }

        console.log(`[Cron] Found ${orders.length} potential stuck orders.`);

        const results = [];

        // 4. Process Each Order
        for (const order of orders) {
            const signature = order.transaction_signatures?.[0]; // Assuming first sig is the payment

            if (!signature) {
                console.log(`[Cron] Order ${order.id} has no signature. Skipping.`);
                continue;
            }

            try {
                // Check signature status
                const status = await connection.getSignatureStatus(signature);
                const isConfirmed = status.value?.confirmationStatus === 'confirmed' || status.value?.confirmationStatus === 'finalized';
                const isErr = status.value?.err;

                if (isConfirmed && !isErr) {
                    console.log(`[Cron] Verified Order ${order.id}. Fulfilling...`);

                    // Trigger Fulfillment
                    const { error: fulfillmentError } = await supabase.rpc('finalize_order_fulfillment', {
                        p_order_id: order.id
                    });

                    results.push({ id: order.id, status: fulfillmentError ? 'error_fulfilling' : 'fulfilled', error: fulfillmentError });
                } else if (isErr) {
                    console.log(`[Cron] Order ${order.id} failed on-chain.`);
                    // Optional: Mark as failed in DB to stop retrying?
                    // For now, logging.
                    results.push({ id: order.id, status: 'on_chain_failure' });
                } else {
                    console.log(`[Cron] Order ${order.id} still pending/unknown.`);
                    results.push({ id: order.id, status: 'pending' });
                }

            } catch (err) {
                console.error(`[Cron] Error processing order ${order.id}:`, err);
                results.push({ id: order.id, error: err.message });
            }
        }

        return new Response(
            JSON.stringify({ success: true, processed: results.length, details: results }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('[Cron] Fatal error:', error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
