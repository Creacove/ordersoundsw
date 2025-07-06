
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
        .select(`
          id,
          buyer_id,
          total_price,
          currency_used,
          line_items (
            beat_id,
            beats (
              id,
              title,
              producer_id,
              users (
                id,
                full_name,
                stage_name
              )
            )
          ),
          users (
            id,
            full_name,
            email
          )
        `)
        .eq('payment_reference', reference)
        .single();

      if (orderError) {
        console.error('Order not found for reference:', reference, orderError);
        return new Response(
          JSON.stringify({ error: 'Order not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update order status
      const { error: updateError } = await supabase
        .from('orders')
        .update({ status: 'completed' })
        .eq('id', orderData.id);

      if (updateError) {
        console.error('Error updating order status:', updateError);
      }

      // Create payment record
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          order_id: orderData.id,
          transaction_reference: reference,
          amount: data.amount / 100, // Convert from kobo to naira
          status: 'success',
          payment_method: 'paystack',
          payment_details: data,
        });

      if (paymentError) {
        console.error('Error creating payment record:', paymentError);
      }

      // Send notification to buyer
      if (orderData.users) {
        const buyer = orderData.users;
        const currencySymbol = orderData.currency_used === 'NGN' ? '₦' : '$';
        const beatCount = orderData.line_items?.length || 0;
        
        console.log(`Sending payment success notification to buyer: ${buyer.id}`);
        
        const { error: buyerNotificationError } = await supabase
          .from('notifications')
          .insert({
            recipient_id: buyer.id,
            title: 'Payment Successful',
            body: `Your payment of ${currencySymbol}${(data.amount / 100).toLocaleString()} for ${beatCount} beat${beatCount > 1 ? 's' : ''} has been processed successfully.`,
            notification_type: 'payment',
            related_entity_type: 'order',
            related_entity_id: orderData.id,
          });

        if (buyerNotificationError) {
          console.error(`Error sending notification to buyer ${buyer.id}:`, buyerNotificationError);
        } else {
          console.log(`Payment notification sent successfully to buyer: ${buyer.full_name}`);
        }
      }

      // Send notifications to producers for each beat sold
      if (orderData.line_items && orderData.line_items.length > 0) {
        console.log(`Sending notifications to ${orderData.line_items.length} producers`);
        
        for (const lineItem of orderData.line_items) {
          const beat = lineItem.beats;
          const producer = beat?.users;
          
          if (producer) {
            console.log(`Sending notification to producer: ${producer.id}`);
            
            const { error: notificationError } = await supabase
              .from('notifications')
              .insert({
                recipient_id: producer.id,
                title: 'Beat Sale - Payment Received',
                body: `Your beat "${beat.title}" has been purchased! Payment of ₦${(data.amount / 100).toLocaleString()} has been processed.`,
                notification_type: 'sale',
                related_entity_type: 'beat',
                related_entity_id: beat.id,
              });

            if (notificationError) {
              console.error(`Error sending notification to producer ${producer.id}:`, notificationError);
            } else {
              console.log(`Notification sent successfully to producer: ${producer.stage_name || producer.full_name}`);
            }
          }
        }
      }

      console.log(`Successfully processed charge.success for reference: ${reference}`);
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
