
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { authenticateRequest, createServiceRoleClient } from "../_shared/auth.ts";
import { syncPaymentSettlement } from "../_shared/paymentSettlement.ts";

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

    const supabaseClient = createServiceRoleClient();
    const authResult = await authenticateRequest(req, supabaseClient);
    if ("response" in authResult) {
      return authResult.response;
    }

    const actor = authResult.actor;

    console.log('Using service role key for database access');

    // First check if order exists and get its details
    const { data: orderData, error: orderCheckError } = await supabaseClient
      .from('orders')
      .select('status, buyer_id, total_price, payment_reference')
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

    const canAccessOrder = actor.appUser.role === 'admin' || orderData.buyer_id === actor.authUser.id;
    if (!canAccessOrder) {
      console.error(`User ${actor.authUser.id} attempted to verify another user's Paystack order ${orderId}`);
      return new Response(
        JSON.stringify({
          success: false,
          verified: false,
          message: 'Forbidden',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    if (orderData.payment_reference && orderData.payment_reference !== reference && orderData.status !== 'completed') {
      console.error(`Order ${orderId} already has a different payment reference recorded`);
      return new Response(
        JSON.stringify({
          success: false,
          verified: false,
          message: 'Order already contains a different payment reference',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 409 }
      );
    }

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

      const metadata = verifyData?.data?.metadata ?? {};
      const customFields = Array.isArray(metadata.custom_fields) ? metadata.custom_fields : [];
      const metadataOrderId =
        metadata.order_id ||
        customFields.find((field: Record<string, unknown>) => field?.variable_name === 'order_id')?.value;
      if (metadataOrderId && metadataOrderId !== orderId) {
        console.error(`Paystack metadata order mismatch for ${reference}: expected ${orderId}, received ${metadataOrderId}`);
        return new Response(
          JSON.stringify({
            success: false,
            verified: false,
            message: 'Payment metadata does not match the requested order',
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      const expectedAmount = Math.round(Number(orderData.total_price ?? 0) * 100);
      const receivedAmount = Number(verifyData?.data?.amount ?? 0);
      if (expectedAmount > 0 && receivedAmount !== expectedAmount) {
        console.error(`Paystack amount mismatch for ${reference}: expected ${expectedAmount}, received ${receivedAmount}`);
        return new Response(
          JSON.stringify({
            success: false,
            verified: false,
            message: 'Payment amount does not match the order total',
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      // Check if payment was successful (or already completed)
      const isVerified = alreadyCompleted || (
        verifyData.status === true &&
        verifyData.data.status === 'success'
      );

      console.log(`Payment verification result: ${isVerified ? 'VERIFIED' : 'FAILED'}${alreadyCompleted ? ' (already completed)' : ''}`);

      // If verified (or already completed), update the database and fulfill the order
      if (isVerified) {
        console.log(`Updating order ${orderId} with payment reference ${reference}`);

        // Declare downstream result containers so they are visible in the response.
        let fulfillmentResult: unknown = null;
        let settlementResult: unknown = null;
        let settlementWarning: string | null = null;

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
          const { data: rpcResult, error: rpcError } = await supabaseClient
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

          fulfillmentResult = rpcResult;
          console.log('Fulfillment RPC result:', fulfillmentResult);

          try {
            settlementResult = await syncPaymentSettlement(supabaseClient, {
              orderId,
              paymentDetails: verifyData?.data ?? {},
              paymentMethod: 'Paystack',
              paymentReference: reference,
            });
          } catch (settlementError) {
            settlementWarning = settlementError instanceof Error
              ? settlementError.message
              : 'Settlement sync failed';
            console.error('Settlement sync failed after payment verification:', settlementError);
          }

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
            settlementResult,
            settlementWarning,
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
