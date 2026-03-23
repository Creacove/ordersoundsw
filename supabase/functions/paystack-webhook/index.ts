import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createServiceRoleClient } from "../_shared/auth.ts";
import {
  markPayoutTransferFailed,
  markPayoutTransferSucceeded,
} from "../_shared/payoutExecution.ts";
import { syncPaymentSettlement } from "../_shared/paymentSettlement.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type PaystackWebhookBody = {
  data?: Record<string, unknown>;
  event?: string;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const paystackSecretKey = Deno.env.get("PAYSTACK_SECRET_KEY_LIVE");
  if (!paystackSecretKey) {
    console.error("Missing Paystack live secret key");
    return new Response(
      JSON.stringify({ error: "Server configuration error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  try {
    const signature = req.headers.get("x-paystack-signature");
    if (!signature) {
      return new Response(
        JSON.stringify({ error: "Missing signature" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const rawBody = await req.text();
    if (!rawBody.trim()) {
      return new Response(
        JSON.stringify({ error: "Empty webhook body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const crypto = await import("node:crypto");
    const expectedSignature = crypto
      .createHmac("sha512", paystackSecretKey)
      .update(rawBody)
      .digest("hex");

    if (expectedSignature !== signature) {
      console.error("Invalid Paystack webhook signature");
      return new Response(
        JSON.stringify({ error: "Invalid signature" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = JSON.parse(rawBody) as PaystackWebhookBody;
    const event = typeof body.event === "string" ? body.event : "";
    const payload = body.data ?? {};
    const supabase = createServiceRoleClient();

    if (event === "charge.success") {
      const reference = typeof payload.reference === "string" ? payload.reference : null;
      if (!reference) {
        return new Response(
          JSON.stringify({ error: "Missing Paystack reference" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select("id")
        .eq("payment_reference", reference)
        .maybeSingle();

      if (orderError) {
        console.error("Order lookup failed for charge.success:", orderError);
        return new Response(
          JSON.stringify({ error: "Order lookup failed" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      if (!orderData?.id) {
        console.warn(`Ignoring charge.success for unknown reference ${reference}`);
        return new Response(
          JSON.stringify({ ignored: true, success: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const { error: rpcError } = await supabase.rpc("finalize_order_fulfillment", {
        p_order_id: orderData.id,
      });

      if (rpcError) {
        console.error("Fulfillment RPC failed from Paystack webhook:", rpcError);
        return new Response(
          JSON.stringify({ error: "Fulfillment failed" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      try {
        await syncPaymentSettlement(supabase, {
          orderId: orderData.id,
          paymentDetails: payload,
          paymentMethod: "Paystack",
          paymentReference: reference,
        });
      } catch (settlementError) {
        console.error("Settlement synchronization failed from Paystack webhook:", settlementError);
        return new Response(
          JSON.stringify({ error: "Settlement synchronization failed" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    if (event === "transfer.success") {
      const reference = typeof payload.reference === "string" ? payload.reference : null;
      if (reference) {
        await markPayoutTransferSucceeded(supabase, reference, payload);
      }
    }

    if (event === "transfer.failed") {
      const reference = typeof payload.reference === "string" ? payload.reference : null;
      if (reference) {
        await markPayoutTransferFailed(supabase, reference, payload);
      }
    }

    return new Response(
      JSON.stringify({ event, success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Webhook processing error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
