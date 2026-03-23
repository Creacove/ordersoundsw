import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

type PaymentMethod = "Paystack" | "solana_usdc";
type SnapshotOrderItem = {
  id: string;
  license_type?: string | null;
  price: number;
  producer_id?: string | null;
  product_id: string;
  product_type?: "beat" | "soundpack" | null;
  quantity?: number | null;
  title: string;
};

type PaymentRecord = {
  id: string;
};

type PayoutRecord = {
  id: string;
  producer_id: string;
};

type CatalogBeatRecord = {
  id: string;
  producer_id: string;
};

type CatalogSoundpackRecord = {
  id: string;
  producer_id: string;
};

type AllocationRecord = {
  grossAmount: number;
  licenseType: string;
  metadata: Record<string, unknown>;
  platformShare: number;
  producerId: string | null;
  producerShare: number;
  productId: string;
  productType: "beat" | "soundpack";
  quantity: number;
  settlementStatus: "pending" | "queued_for_payout" | "failed" | "not_applicable";
  title: string;
};

type SyncPaymentSettlementInput = {
  orderId: string;
  paymentDetails?: Record<string, unknown>;
  paymentMethod: PaymentMethod;
  paymentReference: string;
};

const DEFAULT_PLATFORM_FEE_BPS: Record<PaymentMethod, number> = {
  Paystack: 1000,
  solana_usdc: 2000,
};

function roundCurrencyAmount(amount: number) {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

function getConfiguredPlatformFeeBps(paymentMethod: PaymentMethod) {
  const envName =
    paymentMethod === "Paystack"
      ? "PAYSTACK_PLATFORM_FEE_BPS"
      : "SOLANA_PLATFORM_FEE_BPS";
  const fallback = DEFAULT_PLATFORM_FEE_BPS[paymentMethod];
  const rawValue = Deno.env.get(envName);

  if (!rawValue) {
    return fallback;
  }

  const parsed = Number.parseInt(rawValue, 10);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 10000) {
    throw new Error(`${envName} must be an integer between 0 and 10000`);
  }

  return parsed;
}

async function enrichOrderItems(
  supabase: SupabaseClient,
  orderItems: SnapshotOrderItem[],
) {
  const unresolvedItems = orderItems.filter(
    (item) => !item.product_type || !item.producer_id,
  );

  if (!unresolvedItems.length) {
    return orderItems;
  }

  const beatIds = unresolvedItems
    .filter((item) => item.product_type !== "soundpack")
    .map((item) => item.product_id);
  const soundpackIds = unresolvedItems
    .filter((item) => item.product_type !== "beat")
    .map((item) => item.product_id);

  const beatsById = new Map<string, CatalogBeatRecord>();
  const soundpacksById = new Map<string, CatalogSoundpackRecord>();

  if (beatIds.length > 0) {
    const { data: beats, error: beatError } = await supabase
      .from("beats")
      .select("id, producer_id")
      .in("id", beatIds);

    if (beatError) {
      throw new Error(`Failed to resolve beat settlement context: ${beatError.message}`);
    }

    for (const beat of (beats ?? []) as CatalogBeatRecord[]) {
      beatsById.set(beat.id, beat);
    }
  }

  if (soundpackIds.length > 0) {
    const { data: soundpacks, error: soundpackError } = await supabase
      .from("soundpacks")
      .select("id, producer_id")
      .in("id", soundpackIds);

    if (soundpackError) {
      throw new Error(`Failed to resolve soundpack settlement context: ${soundpackError.message}`);
    }

    for (const soundpack of (soundpacks ?? []) as CatalogSoundpackRecord[]) {
      soundpacksById.set(soundpack.id, soundpack);
    }
  }

  const patchedItems = orderItems.map((item) => {
    const beatMatch = beatsById.get(item.product_id);
    const soundpackMatch = soundpacksById.get(item.product_id);

    return {
      ...item,
      producer_id: item.producer_id ?? beatMatch?.producer_id ?? soundpackMatch?.producer_id ?? null,
      product_type:
        item.product_type ??
        (beatMatch ? "beat" : soundpackMatch ? "soundpack" : null),
    };
  });

  for (const item of patchedItems) {
    if (!item.product_type || !item.producer_id) {
      continue;
    }

    await supabase
      .from("order_items")
      .update({
        license_type: item.license_type ?? "basic",
        producer_id: item.producer_id,
        product_type: item.product_type,
      })
      .eq("id", item.id);
  }

  return patchedItems;
}

async function loadSettlementItems(
  supabase: SupabaseClient,
  orderId: string,
) {
  const { data, error } = await supabase
    .from("order_items")
    .select("id, license_type, price, producer_id, product_id, product_type, quantity, title")
    .eq("order_id", orderId);

  if (error) {
    throw new Error(`Failed to load order settlement items: ${error.message}`);
  }

  const orderItems = (data ?? []) as SnapshotOrderItem[];
  if (!orderItems.length) {
    throw new Error("Order contains no settlement items");
  }

  return enrichOrderItems(supabase, orderItems);
}

async function upsertPaymentRecord(
  supabase: SupabaseClient,
  payload: {
    amount: number;
    orderId: string;
    paymentDetails?: Record<string, unknown>;
    paymentMethod: PaymentMethod;
    paymentReference: string;
    platformShare: number;
    producerShare: number;
  },
): Promise<PaymentRecord> {
  const { data: existingPayment, error: existingPaymentError } = await supabase
    .from("payments")
    .select("id")
    .eq("order_id", payload.orderId)
    .maybeSingle();

  if (existingPaymentError) {
    throw new Error(`Failed to inspect payment record: ${existingPaymentError.message}`);
  }

  if (existingPayment?.id) {
    const { data: updatedPayment, error: updateError } = await supabase
      .from("payments")
      .update({
        amount: payload.amount,
        payment_date: new Date().toISOString(),
        payment_details: payload.paymentDetails ?? null,
        payment_method: payload.paymentMethod,
        platform_share: payload.platformShare,
        producer_share: payload.producerShare,
        status: "success",
        transaction_reference: payload.paymentReference,
      })
      .eq("id", existingPayment.id)
      .select("id")
      .single();

    if (updateError || !updatedPayment?.id) {
      throw new Error(`Failed to update payment record: ${updateError?.message ?? "Missing payment ID"}`);
    }

    return updatedPayment as PaymentRecord;
  }

  const { data: createdPayment, error: insertError } = await supabase
    .from("payments")
    .insert({
      amount: payload.amount,
      order_id: payload.orderId,
      payment_date: new Date().toISOString(),
      payment_details: payload.paymentDetails ?? null,
      payment_method: payload.paymentMethod,
      platform_share: payload.platformShare,
      producer_share: payload.producerShare,
      status: "success",
      transaction_reference: payload.paymentReference,
    })
    .select("id")
    .single();

  if (insertError || !createdPayment?.id) {
    throw new Error(`Failed to create payment record: ${insertError?.message ?? "Missing payment ID"}`);
  }

  return createdPayment as PaymentRecord;
}

export async function syncPaymentSettlement(
  supabase: SupabaseClient,
  input: SyncPaymentSettlementInput,
) {
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("currency_used, total_price")
    .eq("id", input.orderId)
    .single();

  if (orderError || !order) {
    throw new Error(`Failed to load payment order context: ${orderError?.message ?? "Order not found"}`);
  }

  const settlementItems = await loadSettlementItems(supabase, input.orderId);
  const platformFeeBps = getConfiguredPlatformFeeBps(input.paymentMethod);

  const allocationRows: AllocationRecord[] = settlementItems.map((item) => {
    if (!item.product_type) {
      throw new Error(`Order item ${item.id} is missing product_type`);
    }

    const quantity = item.quantity ?? 1;
    const grossAmount = roundCurrencyAmount(Number(item.price) * quantity);
    const platformShare = roundCurrencyAmount(
      (grossAmount * platformFeeBps) / 10000,
    );
    const producerShare = roundCurrencyAmount(grossAmount - platformShare);

    return {
      grossAmount,
      licenseType: item.license_type ?? "basic",
      metadata: {
        source: "payment_verification",
      },
      platformShare,
      producerId: item.producer_id ?? null,
      producerShare,
      productId: item.product_id,
      productType: item.product_type,
      quantity,
      settlementStatus:
        input.paymentMethod === "Paystack"
          ? item.producer_id
            ? "queued_for_payout"
            : "failed"
          : "not_applicable",
      title: item.title,
    };
  });

  const totalPlatformShare = roundCurrencyAmount(
    allocationRows.reduce((sum, item) => sum + item.platformShare, 0),
  );
  const totalProducerShare = roundCurrencyAmount(
    allocationRows.reduce((sum, item) => sum + item.producerShare, 0),
  );

  const payment = await upsertPaymentRecord(supabase, {
    amount: Number(order.total_price),
    orderId: input.orderId,
    paymentDetails: input.paymentDetails,
    paymentMethod: input.paymentMethod,
    paymentReference: input.paymentReference,
    platformShare: totalPlatformShare,
    producerShare: totalProducerShare,
  });

  const payoutGroups = new Map<
    string,
    {
      amount: number;
      beatId: string | null;
      items: Array<{ amount: number; productId: string; productType: "beat" | "soundpack"; title: string }>;
      producerId: string;
    }
  >();

  for (const allocation of allocationRows) {
    if (input.paymentMethod !== "Paystack" || !allocation.producerId || allocation.producerShare <= 0) {
      continue;
    }

    const existingGroup = payoutGroups.get(allocation.producerId);
    if (existingGroup) {
      existingGroup.amount = roundCurrencyAmount(existingGroup.amount + allocation.producerShare);
      existingGroup.beatId =
        existingGroup.beatId && allocation.productType === "beat" && existingGroup.items.length === 1
          ? existingGroup.beatId
          : null;
      existingGroup.items.push({
        amount: allocation.producerShare,
        productId: allocation.productId,
        productType: allocation.productType,
        title: allocation.title,
      });
      continue;
    }

    payoutGroups.set(allocation.producerId, {
      amount: allocation.producerShare,
      beatId: allocation.productType === "beat" ? allocation.productId : null,
      items: [
        {
          amount: allocation.producerShare,
          productId: allocation.productId,
          productType: allocation.productType,
          title: allocation.title,
        },
      ],
      producerId: allocation.producerId,
    });
  }

  let payoutsByProducer = new Map<string, string>();

  if (input.paymentMethod === "Paystack" && payoutGroups.size > 0) {
    const payoutPayload = Array.from(payoutGroups.values()).map((group) => ({
      amount: group.amount,
      beat_id: group.items.length === 1 && group.items[0].productType === "beat" ? group.beatId : null,
      order_id: input.orderId,
      payment_id: payment.id,
      producer_id: group.producerId,
      status: "pending",
      transaction_details: {
        currency_code: order.currency_used,
        items: group.items,
        order_id: input.orderId,
        payment_method: input.paymentMethod,
        transaction_reference: input.paymentReference,
      },
      transaction_reference: null,
    }));

    const { data: payoutRows, error: payoutError } = await supabase
      .from("payouts")
      .upsert(payoutPayload, {
        onConflict: "payment_id,order_id,producer_id",
      })
      .select("id, producer_id");

    if (payoutError) {
      throw new Error(`Failed to queue payout records: ${payoutError.message}`);
    }

    payoutsByProducer = new Map(
      ((payoutRows ?? []) as PayoutRecord[]).map((row) => [row.producer_id, row.id]),
    );
  }

  const { error: allocationError } = await supabase
    .from("payment_allocations")
    .upsert(
      allocationRows.map((allocation) => ({
        currency_code: order.currency_used,
        gross_amount: allocation.grossAmount,
        license_type: allocation.licenseType,
        metadata: allocation.producerId
          ? allocation.metadata
          : {
              ...allocation.metadata,
              resolution_error: "Missing producer settlement context",
            },
        order_id: input.orderId,
        payment_id: payment.id,
        payout_id: allocation.producerId ? payoutsByProducer.get(allocation.producerId) ?? null : null,
        platform_share: allocation.platformShare,
        producer_id: allocation.producerId,
        producer_share: allocation.producerShare,
        product_id: allocation.productId,
        product_type: allocation.productType,
        quantity: allocation.quantity,
        settlement_status:
          input.paymentMethod === "Paystack"
            ? allocation.producerId
              ? "queued_for_payout"
              : "failed"
            : allocation.settlementStatus,
        title: allocation.title,
        updated_at: new Date().toISOString(),
      })),
      {
        onConflict: "order_id,product_id",
      },
    );

  if (allocationError) {
    throw new Error(`Failed to upsert payment allocations: ${allocationError.message}`);
  }

  return {
    allocationCount: allocationRows.length,
    paymentId: payment.id,
    payoutCount: payoutsByProducer.size,
    totals: {
      platformShare: totalPlatformShare,
      producerShare: totalProducerShare,
    },
  };
}
