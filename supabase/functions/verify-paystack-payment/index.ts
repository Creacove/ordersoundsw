
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Main function to handle edge function requests
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== Payment Verification Function Started ===');
    console.log('Request method:', req.method);
    console.log('Request headers:', Object.fromEntries(req.headers.entries()));

    // Get the Paystack LIVE secret key from environment - FIXED: Using live key
    const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY_LIVE');
    if (!PAYSTACK_SECRET_KEY) {
      console.error('Missing Paystack live secret key');
      return new Response(
        JSON.stringify({ success: false, verified: false, message: 'Missing Paystack live secret key' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Parse request body with better error handling
    let body;
    let rawBody = '';
    try {
      rawBody = await req.text();
      console.log('Raw request body length:', rawBody.length);
      console.log('Raw request body preview:', rawBody.substring(0, 200) + (rawBody.length > 200 ? '...' : ''));

      if (!rawBody || rawBody.trim() === '') {
        console.error('Empty request body received');
        return new Response(
          JSON.stringify({ success: false, verified: false, message: 'Empty request body' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      body = JSON.parse(rawBody);
      console.log('Parsed request body:', JSON.stringify(body, null, 2));
    } catch (e) {
      console.error('Failed to parse request body:', e);
      console.error('Raw body was:', rawBody);
      return new Response(
        JSON.stringify({ success: false, verified: false, message: 'Invalid request body format' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const { reference, orderId, orderItems } = body;

    console.log('Extracted parameters:', { reference, orderId, orderItemsCount: orderItems?.length });

    if (!reference) {
      console.error('Missing payment reference');
      return new Response(
        JSON.stringify({ success: false, verified: false, message: 'Missing payment reference' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (!orderId) {
      console.error('Missing order ID');
      return new Response(
        JSON.stringify({ success: false, verified: false, message: 'Missing order ID' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Processing verification for reference: ${reference}, order: ${orderId}`);
    console.log('Order items received:', orderItems);

    // Create a Supabase client with SERVICE ROLE KEY to bypass RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables');
      return new Response(
        JSON.stringify({ success: false, verified: false, message: 'Missing Supabase configuration' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Using service role key for database access');

    // First check if order exists and get its details
    const { data: orderData, error: orderCheckError } = await supabaseClient
      .from('orders')
      .select('status, buyer_id')
      .eq('id', orderId)
      .maybeSingle();

    if (orderCheckError) {
      console.error('Failed to check order status:', orderCheckError);
      return new Response(
        JSON.stringify({
          success: false,
          verified: false,
          message: `Failed to find order: ${orderCheckError.message}`,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    if (!orderData) {
      console.error('Order not found:', orderId);
      return new Response(
        JSON.stringify({
          success: false,
          verified: false,
          message: 'Order not found',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    console.log('Order found:', orderData);

    // Track if already completed (but still proceed to fulfillment to recover missing purchases)
    const alreadyCompleted = orderData.status === 'completed';
    if (alreadyCompleted) {
      console.log(`Order ${orderId} already completed, but will still attempt fulfillment recovery`);
    }

    // Verify with Paystack API using LIVE secret key
    try {
      console.log(`Making request to Paystack API: https://api.paystack.co/transaction/verify/${reference}`);
      const verifyResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (!verifyResponse.ok) {
        const errorText = await verifyResponse.text();
        console.error(`Paystack API error (${verifyResponse.status}):`, errorText);
        return new Response(
          JSON.stringify({
            success: false,
            verified: false,
            message: `Paystack API error: ${verifyResponse.status}`,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      const verifyData = await verifyResponse.json();
      console.log('Paystack verification response:', JSON.stringify(verifyData));

      // Check if payment was successful (or already completed)
      const isVerified = alreadyCompleted || (
        verifyData.status === true &&
        verifyData.data.status === 'success'
      );

      console.log(`Payment verification result: ${isVerified ? 'VERIFIED' : 'FAILED'}${alreadyCompleted ? ' (already completed)' : ''}`);

      // If verified (or already completed), update the database and fulfill the order
      if (isVerified) {
        console.log(`Updating order ${orderId} with payment reference ${reference}`);

        try {
          // 1. First, store the payment reference in the order (security/audit check)
          const { error: updateRefError } = await supabaseClient
            .from('orders')
            .update({
              payment_reference: reference
            })
            .eq('id', orderId);

          if (updateRefError) {
            console.error('Failed to update order reference:', updateRefError);
            // Non-blocking for fulfillment, but log it
          }

          // 2. Call the unified fulfillment RPC
          console.log(`Calling fulfillment RPC for order ${orderId}...`);
          const { data: fulfillmentResult, error: rpcError } = await supabaseClient
            .rpc('finalize_order_fulfillment', {
              p_order_id: orderId
            });

          if (rpcError) {
            console.error('Fulfillment RPC failed:', rpcError);
            return new Response(
              JSON.stringify({
                success: false,
                verified: true,
                message: 'Payment was verified but an error occurred during fulfillment processing',
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
            );
          }

          console.log('Fulfillment RPC result:', fulfillmentResult);

        } catch (fulfillmentProcessError) {
          console.error('Exception during fulfillment process:', fulfillmentProcessError);
          return new Response(
            JSON.stringify({
              success: false,
              verified: true,
              message: 'Payment was verified but an error occurred during order processing',
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          );
        }

        // Return successful verification to client
        return new Response(
          JSON.stringify({
            success: true,
            verified: true,
            message: alreadyCompleted ? 'Order already completed (recovery attempted)' : 'Payment successfully verified',
            fulfillmentResult,
            alreadyCompleted,
            data: {
              reference: reference,
              amount: alreadyCompleted ? null : verifyData.data.amount / 100, // Convert from kobo back to naira
              orderId: orderId,
            },
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      } else {
        // Payment verification failed
        console.log(`Payment verification failed for reference ${reference}`);
        return new Response(
          JSON.stringify({
            success: false,
            verified: false,
            message: 'Payment verification failed',
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          }
        );
      }
    } catch (payStackApiError) {
      console.error('Error calling Paystack API:', payStackApiError);
      const apiErrorMessage = payStackApiError instanceof Error ? payStackApiError.message : 'Unknown error';
      return new Response(
        JSON.stringify({
          success: false,
          verified: false,
          message: `Error verifying with Paystack: ${apiErrorMessage}`,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
  } catch (error) {
    console.error('Global error in edge function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    // Return proper error status codes
    return new Response(
      JSON.stringify({
        success: false,
        verified: false,
        message: `Error processing request: ${errorMessage}`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
