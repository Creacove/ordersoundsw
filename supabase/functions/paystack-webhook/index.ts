
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "npm:resend@2.0.0";

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
  const resendApiKey = Deno.env.get('RESEND_API_KEY');

  const resend = resendApiKey ? new Resend(resendApiKey) : null;

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
          buyer:users!orders_buyer_id_fkey(
             email,
             full_name
          ),
          line_items (
            beat_id,
            beats (
              id,
              title,
              producer_id,
              users (
                id,
                email,
                full_name,
                stage_name
              )
            )
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
          amount: data.amount / 100, // Convert from kobo to naira (or cents to dollars)
          status: 'success',
          payment_method: 'paystack',
          payment_details: data,
        });

      if (paymentError) {
        console.error('Error creating payment record:', paymentError);
      }

      const currencySymbol = orderData.currency_used === 'NGN' ? '₦' : '$';
      const formattedAmount = `${currencySymbol}${(data.amount / 100).toLocaleString()}`;

      // Send Buyer Receipt Email (if Resend is configured)
      if (resend && orderData.buyer?.email) {
        try {
          await resend.emails.send({
            from: 'OrderSOUNDS <receipts@resend.dev>', // TODO: Update with custom domain
            to: [orderData.buyer.email],
            subject: `Receipt for your purchase #${reference}`,
            html: `
                        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                            <h1>Thank you for your purchase!</h1>
                            <p>Hi ${orderData.buyer.full_name || 'there'},</p>
                            <p>We've received your payment of <strong>${formattedAmount}</strong>.</p>
                            <h3>Order Summary:</h3>
                            <ul>
                                ${orderData.line_items.map((item: any) => `<li>${item.beats.title} (by ${item.beats.users.stage_name})</li>`).join('')}
                            </ul>
                            <p>You can download your beats from your <a href="https://ordersounds.com/library">Library</a>.</p>
                        </div>
                    `
          });
          console.log('Receipt email sent to buyer');
        } catch (emailError) {
          console.error('Error sending receipt email:', emailError);
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

            // In-app Notification
            const { error: notificationError } = await supabase
              .from('notifications')
              .insert({
                recipient_id: producer.id,
                title: 'Beat Sale - Payment Received',
                body: `Your beat "${beat.title}" has been purchased! Payment of ${formattedAmount} has been processed.`,
                notification_type: 'sale',
                related_entity_type: 'beat',
                related_entity_id: beat.id,
              });

            if (notificationError) {
              console.error(`Error sending notification to producer ${producer.id}:`, notificationError);
            } else {
              console.log(`Notification sent successfully to producer: ${producer.stage_name || producer.full_name}`);
            }

            // Email Notification (if Resend is configured)
            if (resend && producer.email) {
              try {
                await resend.emails.send({
                  from: 'OrderSOUNDS <notifications@resend.dev>', // TODO: Update with custom domain
                  to: [producer.email],
                  subject: `You made a sale! 💰`,
                  html: `
                            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                                <h1>Chaa-ching! 💸</h1>
                                <p>Hi ${producer.stage_name || producer.full_name},</p>
                                <p>Great news! Your beat <strong>"${beat.title}"</strong> has just been sold.</p>
                                <p>Amount: <strong>${formattedAmount}</strong></p>
                                <p>Check your <a href="https://ordersounds.com/producer/dashboard">dashboard</a> for more details.</p>
                                <br/>
                                <p>Keep up the great work!</p>
                            </div>
                        `
                });
                console.log(`Sale notification email sent to producer ${producer.id}`);
              } catch (emailError) {
                console.error(`Error sending sale email to producer ${producer.id}:`, emailError);
              }
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

        // TODO: Could send a "Payout Sent" email here in the future
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
