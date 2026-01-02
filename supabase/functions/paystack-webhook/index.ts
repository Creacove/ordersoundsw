
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY_LIVE')!;

  if (!paystackSecretKey) {
    console.error('Missing Paystack live secret key');
    return new Response(
      JSON.stringify({ error: 'Server configuration error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const body = await req.json();
    const signature = req.headers.get('x-paystack-signature');

    // Validate webhook signature
    if (!signature) {
      console.error('Missing webhook signature');
      return new Response(
        JSON.stringify({ error: 'Missing signature' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify webhook signature
    const crypto = await import('node:crypto');
    const hash = crypto.createHmac('sha512', paystackSecretKey)
      .update(JSON.stringify(body))
      .digest('hex');

    if (hash !== signature) {
      console.error('Invalid webhook signature');
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { event, data } = body;
    console.log(`Processing webhook event: ${event}`);

    // Handle charge.success event (successful payment)
    if (event === 'charge.success') {
      const reference = data.reference;
      console.log(`Processing successful charge: ${reference}`);

      // Find the order associated with this transaction
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('id')
        .eq('payment_reference', reference)
        .single();

      if (orderError) {
        console.error('Order not found for reference:', reference, orderError);
        return new Response(
          JSON.stringify({ error: 'Order not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Fulfilling order ${orderData.id} via RPC...`);

      // Call the unified fulfillment procedure
      const { data: result, error: rpcError } = await supabase.rpc('finalize_order_fulfillment', {
        p_order_id: orderData.id
      });

      if (rpcError) {
        console.error('Fulfillment RPC failed:', rpcError);
        return new Response(
          JSON.stringify({ error: 'Fulfillment failed' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Order ${orderData.id} fulfilled successfully:`, result);
    }

    // Handle transfer.success event (successful payout to producer)
    if (event === 'transfer.success') {
      const transferReference = data.reference;
      console.log(`Processing successful transfer: ${transferReference}`);

      const { error: payoutError } = await supabase
        .from('payouts')
        .update({
          status: 'success',
          payout_date: new Date().toISOString(),
          transaction_details: data,
        })
        .eq('transaction_reference', transferReference);

      if (payoutError) {
        console.error('Error updating payout status:', payoutError);
      } else {
        console.log(`Successfully processed transfer.success for reference: ${transferReference}`);
      }
    }

    // Handle transfer.failed event (failed payout to producer)
    if (event === 'transfer.failed') {
      const transferReference = data.reference;
      console.log(`Processing failed transfer: ${transferReference}`);

      const { error: payoutError } = await supabase
        .from('payouts')
        .update({
          status: 'failed',
          failure_reason: data.reason || 'Unknown failure reason',
          transaction_details: data,
        })
        .eq('transaction_reference', transferReference);

      if (payoutError) {
        console.error('Error updating failed payout status:', payoutError);
      } else {
        console.log(`Successfully processed transfer.failed for reference: ${transferReference}`);
      }
    }

    return new Response(
      JSON.stringify({ success: true, event }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Webhook processing error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
