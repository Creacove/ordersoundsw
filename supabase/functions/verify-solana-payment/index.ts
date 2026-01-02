
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Connection } from 'https://esm.sh/@solana/web3.js@1.78.3';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const body = await req.json();
        const { orderId, signature, network = 'mainnet-beta' } = body;

        console.log(`[VerifySolana] Processing: Order=${orderId}, Sig=${signature}, Net=${network}`);

        if (!orderId || !signature) {
            return new Response(
                JSON.stringify({ error: 'Missing orderId or signature', code: 'INVALID_REQUEST' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // 1. Fetch Order from existing table
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .single();

        if (orderError || !order) {
            return new Response(
                JSON.stringify({ error: 'Order not found', code: 'ORDER_NOT_FOUND' }),
                { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Even if completed, still try fulfillment to recover any missing purchases
        const alreadyCompleted = order.status === 'completed';

        // 2. Setup RPC Connection ('confirmed' is faster and sufficient)
        const envRpc = Deno.env.get('SOLANA_RPC_URL');
        const rpcUrl = envRpc || (network === 'mainnet-beta' || network === 'mainnet'
            ? 'https://api.mainnet-beta.solana.com'
            : 'https://api.devnet.solana.com');

        const connection = new Connection(rpcUrl, 'confirmed');

        // 3. Polling for Transaction (increased to 20 attempts = 60s)
        let tx = null;
        let lastError = '';

        for (let i = 0; i < 20; i++) {
            try {
                // Check if signature exists
                const status = await connection.getSignatureStatus(signature, { searchTransactionHistory: true });

                if (status?.value) {
                    console.log(`[VerifySolana] Sig found! Commitment: ${status.value.confirmationStatus}`);

                    // Pull full transaction with 'confirmed' commitment
                    tx = await connection.getParsedTransaction(signature, {
                        maxSupportedTransactionVersion: 0,
                        commitment: 'confirmed'
                    });

                    if (tx) break;
                }
            } catch (e) {
                lastError = e instanceof Error ? e.message : 'Unknown error';
            }
            await new Promise(r => setTimeout(r, 3000));
        }

        // For already completed orders, skip tx verification and go straight to fulfillment recovery
        if (!alreadyCompleted) {
            if (!tx) {
                return new Response(
                    JSON.stringify({
                        error: 'Transaction still pending or node lag. Please refresh your library in a minute.',
                        code: 'TX_NOT_FOUND',
                        diagnostic: lastError
                    }),
                    { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
            }

            if (tx.meta?.err) {
                return new Response(
                    JSON.stringify({ error: 'Transaction failed on-chain', code: 'TX_FAILED' }),
                    { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
            }
        }

        // 4. Update order details in existing table (skip if already completed)
        if (!alreadyCompleted) {
            const { error: updateError } = await supabase
                .from('orders')
                .update({
                    transaction_signatures: [signature],
                    payment_method: 'solana_usdc',
                    currency_used: 'USD',
                    payment_reference: signature
                })
                .eq('id', orderId);

            if (updateError) console.error('[VerifySolana] Meta update error:', updateError);
        }

        // 5. Fulfillment RPC
        console.log(`[VerifySolana] Calling fulfillment RPC for Order=${orderId}`);
        const { data: fulfillmentResult, error: rpcError } = await supabase.rpc('finalize_order_fulfillment', {
            p_order_id: orderId
        });

        if (rpcError) {
            console.error('[VerifySolana] Fulfillment RPC Error:', rpcError);
            return new Response(
                JSON.stringify({
                    error: 'Fulfillment engine error',
                    details: rpcError,
                    code: 'RPC_ERROR',
                    orderId
                }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        console.log(`[VerifySolana] Fulfillment complete:`, fulfillmentResult);

        return new Response(
            JSON.stringify({
                success: fulfillmentResult?.success || false,
                verified: true,
                fulfillmentResult,
                orderId,
                alreadyCompleted
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('[VerifySolana] Global error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return new Response(
            JSON.stringify({ error: errorMessage, code: 'FATAL_ERROR' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
