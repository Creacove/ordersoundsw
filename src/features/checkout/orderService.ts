import { supabase } from "@/integrations/supabase/client";

export type CheckoutCurrency = "NGN" | "USD";
export type CheckoutPaymentMethod = "Paystack" | "solana_usdc";

export interface CheckoutOrderItemInput {
  licenseType?: string;
  price: number;
  producerId: string;
  productId: string;
  productType: "beat" | "soundpack";
  quantity?: number;
  title: string;
}

interface CreatePendingOrderInput {
  currencyUsed: CheckoutCurrency;
  items: CheckoutOrderItemInput[];
  paymentMethod: CheckoutPaymentMethod;
  totalPrice: number;
}

export interface CreatePendingOrderResult {
  orderId: string;
  userId: string;
}

async function requireAuthenticatedSession() {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !sessionData.session?.user) {
    throw new Error("AUTH_REQUIRED: Please sign in to continue");
  }

  return sessionData.session;
}

export async function createPendingOrder({
  currencyUsed,
  items,
  paymentMethod,
  totalPrice,
}: CreatePendingOrderInput): Promise<CreatePendingOrderResult> {
  if (!items.length) {
    throw new Error("INVALID_ORDER: At least one order item is required");
  }

  if (totalPrice <= 0) {
    throw new Error("INVALID_ORDER: Total price must be greater than zero");
  }

  if (items.some((item) => !item.producerId || !item.productType)) {
    throw new Error("INVALID_ORDER: Each order item must include a producer and product type");
  }

  const session = await requireAuthenticatedSession();

  const { data: insertedOrder, error: orderError } = await supabase
    .from("orders")
    .insert({
      buyer_id: session.user.id,
      currency_used: currencyUsed,
      payment_method: paymentMethod,
      status: "pending",
      total_price: totalPrice,
    })
    .select("id")
    .single();

  if (orderError || !insertedOrder?.id) {
    throw new Error(`ORDER_CREATION_FAILED: ${orderError?.message ?? "No order ID returned"}`);
  }

  const { error: itemError } = await supabase.from("order_items").insert(
    items.map((item) => ({
      license_type: item.licenseType ?? "basic",
      order_id: insertedOrder.id,
      price: item.price,
      producer_id: item.producerId,
      product_id: item.productId,
      product_type: item.productType,
      quantity: item.quantity ?? 1,
      title: item.title,
    })),
  );

  if (itemError) {
    await markOrderFailed(insertedOrder.id);
    throw new Error(`ORDER_ITEMS_FAILED: ${itemError.message}`);
  }

  return {
    orderId: insertedOrder.id,
    userId: session.user.id,
  };
}

interface PersistOrderPaymentManifestInput {
  orderId: string;
  paymentReference: string;
  status?: "processing" | "completed";
  transactionSignatures: string[];
}

export async function persistOrderPaymentManifest({
  orderId,
  paymentReference,
  status = "processing",
  transactionSignatures,
}: PersistOrderPaymentManifestInput) {
  if (!transactionSignatures.length) {
    throw new Error("INVALID_MANIFEST: At least one transaction signature is required");
  }

  const { error } = await supabase
    .from("orders")
    .update({
      payment_reference: paymentReference,
      status,
      transaction_signatures: transactionSignatures,
    })
    .eq("id", orderId);

  if (error) {
    throw new Error(`ORDER_MANIFEST_FAILED: ${error.message}`);
  }
}

export async function markOrderFailed(orderId: string) {
  const { error } = await supabase
    .from("orders")
    .update({ status: "failed" })
    .eq("id", orderId)
    .neq("status", "completed");

  if (error) {
    console.error("Failed to mark order as failed:", error);
  }
}
