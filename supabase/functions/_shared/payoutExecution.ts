import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { PaystackApiError, makePaystackApiCall } from "./paystack.ts";

type JsonObject = Record<string, unknown>;

type ClaimedPayoutRecord = {
  amount: number | string;
  id: string;
  order_id: string;
  payment_id: string;
  payout_attempt_count: number;
  producer_id: string;
  status: string;
  transaction_details: JsonObject | null;
  transaction_reference: string | null;
};

type ProducerPayoutContext = {
  account_number: string | null;
  bank_code: string | null;
  email: string | null;
  full_name: string | null;
  id: string;
  paystack_transfer_recipient_code: string | null;
  stage_name: string | null;
  verified_account_name: string | null;
};

type PaystackTransferRecipientResponse = {
  data?: {
    details?: {
      account_name?: string | null;
    } | null;
    recipient_code?: string | null;
  } | null;
};

type PaystackTransferResponse = {
  data?: {
    id?: number | string | null;
    reference?: string | null;
    status?: string | null;
    transfer_code?: string | null;
  } | null;
};

type PayoutExecutionResult = {
  payoutId: string;
  reason?: string;
  reference?: string;
  status: "submitted" | "failed";
};

type StoredPayoutRecord = {
  id: string;
  payout_attempt_count: number;
  transaction_details: JsonObject | null;
};

const DEFAULT_PAYOUT_BATCH_LIMIT = 10;
const DEFAULT_PAYOUT_MAX_ATTEMPTS = 8;

function asObject(value: unknown): JsonObject {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return { ...(value as JsonObject) };
  }

  return {};
}

function buildPayoutReference(payoutId: string, attemptCount: number) {
  return `ordersounds_payout_${payoutId.replaceAll("-", "")}_${attemptCount}`;
}

function calculateNextRetryAt(attemptCount: number) {
  const delayMinutes = Math.min(5 * 2 ** Math.max(attemptCount - 1, 0), 12 * 60);
  return new Date(Date.now() + delayMinutes * 60 * 1000).toISOString();
}

function getConfiguredMaxAttempts() {
  const rawValue = Deno.env.get("PAYSTACK_PAYOUT_MAX_ATTEMPTS");
  if (!rawValue) {
    return DEFAULT_PAYOUT_MAX_ATTEMPTS;
  }

  const parsed = Number.parseInt(rawValue, 10);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 20) {
    throw new Error("PAYSTACK_PAYOUT_MAX_ATTEMPTS must be an integer between 1 and 20");
  }

  return parsed;
}

function getRoundedMinorUnits(amount: number) {
  return Math.round((amount + Number.EPSILON) * 100);
}

export function getPayoutBatchLimit(requestedLimit?: number) {
  if (typeof requestedLimit !== "number" || !Number.isFinite(requestedLimit)) {
    return DEFAULT_PAYOUT_BATCH_LIMIT;
  }

  return Math.max(1, Math.min(Math.trunc(requestedLimit), 50));
}

async function syncAllocationStatusForPayout(
  supabase: SupabaseClient,
  payoutId: string,
  settlementStatus: "queued_for_payout" | "paid" | "failed",
) {
  const { error } = await supabase
    .from("payment_allocations")
    .update({
      settlement_status: settlementStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("payout_id", payoutId);

  if (error) {
    throw new Error(`Failed to update allocation status for payout ${payoutId}: ${error.message}`);
  }
}

async function loadStoredPayoutByReference(
  supabase: SupabaseClient,
  transferReference: string,
) {
  const { data, error } = await supabase
    .from("payouts")
    .select("id, payout_attempt_count, transaction_details")
    .eq("transaction_reference", transferReference)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to resolve payout by transfer reference: ${error.message}`);
  }

  return (data as StoredPayoutRecord | null) ?? null;
}

async function loadProducerContexts(
  supabase: SupabaseClient,
  producerIds: string[],
) {
  const { data, error } = await supabase
    .from("users")
    .select(
      "account_number, bank_code, email, full_name, id, paystack_transfer_recipient_code, stage_name, verified_account_name",
    )
    .in("id", producerIds);

  if (error) {
    throw new Error(`Failed to load producer payout context: ${error.message}`);
  }

  return new Map(
    ((data ?? []) as ProducerPayoutContext[]).map((producer) => [producer.id, producer]),
  );
}

async function ensureTransferRecipient(
  supabase: SupabaseClient,
  producer: ProducerPayoutContext,
) {
  if (producer.paystack_transfer_recipient_code) {
    return producer.paystack_transfer_recipient_code;
  }

  if (!producer.bank_code || !producer.account_number) {
    throw new Error("Producer payout details are incomplete");
  }

  const recipientName =
    producer.verified_account_name ||
    producer.stage_name ||
    producer.full_name ||
    producer.email ||
    `Producer ${producer.id}`;

  const response = await makePaystackApiCall<PaystackTransferRecipientResponse>(
    "/transferrecipient",
    "POST",
    {
      account_number: producer.account_number,
      bank_code: producer.bank_code,
      currency: "NGN",
      name: recipientName,
      type: "nuban",
    },
  );

  const recipientCode = response.data?.recipient_code;
  if (!recipientCode) {
    throw new Error("Paystack did not return a transfer recipient code");
  }

  const accountName = response.data?.details?.account_name ?? producer.verified_account_name;
  const { error } = await supabase
    .from("users")
    .update({
      paystack_transfer_recipient_code: recipientCode,
      verified_account_name: accountName ?? producer.verified_account_name,
    })
    .eq("id", producer.id);

  if (error) {
    throw new Error(`Failed to store Paystack transfer recipient: ${error.message}`);
  }

  producer.paystack_transfer_recipient_code = recipientCode;
  producer.verified_account_name = accountName ?? producer.verified_account_name;

  return recipientCode;
}

async function recordPayoutFailure(
  supabase: SupabaseClient,
  payout: ClaimedPayoutRecord,
  options: {
    error: unknown;
    retriable: boolean;
    terminal?: boolean;
  },
) {
  const maxAttempts = getConfiguredMaxAttempts();
  const terminalFailure = options.terminal || !options.retriable || payout.payout_attempt_count >= maxAttempts;
  const nextRetryAt = terminalFailure ? null : calculateNextRetryAt(payout.payout_attempt_count);
  const errorMessage = options.error instanceof Error ? options.error.message : "Payout execution failed";
  const errorDetails =
    options.error instanceof PaystackApiError
      ? options.error.details
      : options.error instanceof Error
        ? { message: options.error.message }
        : { error: String(options.error) };

  const transactionDetails = asObject(payout.transaction_details);
  transactionDetails.payout_execution = {
    ...(asObject(transactionDetails.payout_execution)),
    failed_at: new Date().toISOString(),
    max_attempts: maxAttempts,
    next_retry_at: nextRetryAt,
    payout_attempt_count: payout.payout_attempt_count,
    reason: errorMessage,
    retriable: !terminalFailure,
    details: errorDetails,
  };

  const { error } = await supabase
    .from("payouts")
    .update({
      failure_reason: errorMessage,
      next_retry_at: nextRetryAt,
      processing_started_at: null,
      status: "failed",
      transaction_details: transactionDetails,
    })
    .eq("id", payout.id);

  if (error) {
    throw new Error(`Failed to update payout failure state: ${error.message}`);
  }

  await syncAllocationStatusForPayout(
    supabase,
    payout.id,
    terminalFailure ? "failed" : "queued_for_payout",
  );
}

export async function claimPaystackPayouts(
  supabase: SupabaseClient,
  limit: number,
) {
  const { data, error } = await supabase.rpc("claim_paystack_payouts", {
    p_limit: getPayoutBatchLimit(limit),
  });

  if (error) {
    throw new Error(`Failed to claim queued payouts: ${error.message}`);
  }

  return (data ?? []) as ClaimedPayoutRecord[];
}

export async function executeClaimedPaystackPayouts(
  supabase: SupabaseClient,
  claimedPayouts: ClaimedPayoutRecord[],
) {
  const producerContexts = await loadProducerContexts(
    supabase,
    Array.from(new Set(claimedPayouts.map((payout) => payout.producer_id))),
  );
  const results: PayoutExecutionResult[] = [];

  for (const payout of claimedPayouts) {
    const producer = producerContexts.get(payout.producer_id);

    if (!producer) {
      await recordPayoutFailure(supabase, payout, {
        error: new Error("Producer payout account could not be resolved"),
        retriable: false,
        terminal: true,
      });
      results.push({
        payoutId: payout.id,
        reason: "Producer payout account could not be resolved",
        status: "failed",
      });
      continue;
    }

    const payoutAmount = Number(payout.amount);
    if (!Number.isFinite(payoutAmount) || payoutAmount <= 0) {
      await recordPayoutFailure(supabase, payout, {
        error: new Error("Payout amount is invalid"),
        retriable: false,
        terminal: true,
      });
      results.push({
        payoutId: payout.id,
        reason: "Payout amount is invalid",
        status: "failed",
      });
      continue;
    }

    try {
      const recipientCode = await ensureTransferRecipient(supabase, producer);
      const reference = buildPayoutReference(payout.id, payout.payout_attempt_count);
      const response = await makePaystackApiCall<PaystackTransferResponse>(
        "/transfer",
        "POST",
        {
          amount: getRoundedMinorUnits(payoutAmount),
          reason: `OrderSOUNDS payout for order ${payout.order_id}`,
          recipient: recipientCode,
          reference,
          source: "balance",
        },
      );

      const transferCode = response.data?.transfer_code ?? null;
      const transactionDetails = asObject(payout.transaction_details);
      transactionDetails.payout_execution = {
        ...(asObject(transactionDetails.payout_execution)),
        payout_attempt_count: payout.payout_attempt_count,
        recipient_code: recipientCode,
        reference,
        submitted_at: new Date().toISOString(),
        transfer_code: transferCode,
        transfer_status: response.data?.status ?? null,
      };

      const { error } = await supabase
        .from("payouts")
        .update({
          failure_reason: null,
          next_retry_at: null,
          paystack_transfer_code: transferCode,
          paystack_transfer_recipient_code: recipientCode,
          processing_started_at: new Date().toISOString(),
          status: "processing",
          transaction_details: transactionDetails,
          transaction_reference: response.data?.reference ?? reference,
        })
        .eq("id", payout.id);

      if (error) {
        throw new Error(`Failed to store payout submission details: ${error.message}`);
      }

      await syncAllocationStatusForPayout(supabase, payout.id, "queued_for_payout");
      results.push({
        payoutId: payout.id,
        reference: response.data?.reference ?? reference,
        status: "submitted",
      });
    } catch (error) {
      await recordPayoutFailure(supabase, payout, {
        error,
        retriable: error instanceof PaystackApiError ? error.retriable : false,
        terminal:
          !(error instanceof PaystackApiError) &&
          error instanceof Error &&
          error.message === "Producer payout details are incomplete",
      });
      results.push({
        payoutId: payout.id,
        reason: error instanceof Error ? error.message : "Payout execution failed",
        status: "failed",
      });
    }
  }

  return results;
}

export async function markPayoutTransferSucceeded(
  supabase: SupabaseClient,
  transferReference: string,
  payload: JsonObject,
) {
  const payout = await loadStoredPayoutByReference(supabase, transferReference);
  if (!payout) {
    return false;
  }

  const transactionDetails = asObject(payout.transaction_details);
  transactionDetails.payout_execution = {
    ...(asObject(transactionDetails.payout_execution)),
    provider_status: payload.status ?? "success",
    settled_at: new Date().toISOString(),
    transfer_code: payload.transfer_code ?? null,
    webhook_payload: payload,
  };

  const { error } = await supabase
    .from("payouts")
    .update({
      failure_reason: null,
      next_retry_at: null,
      paystack_transfer_code:
        typeof payload.transfer_code === "string" ? payload.transfer_code : null,
      payout_date: new Date().toISOString(),
      processing_started_at: null,
      status: "success",
      transaction_details: transactionDetails,
    })
    .eq("id", payout.id);

  if (error) {
    throw new Error(`Failed to mark payout as successful: ${error.message}`);
  }

  await syncAllocationStatusForPayout(supabase, payout.id, "paid");
  return true;
}

export async function markPayoutTransferFailed(
  supabase: SupabaseClient,
  transferReference: string,
  payload: JsonObject,
) {
  const payout = await loadStoredPayoutByReference(supabase, transferReference);
  if (!payout) {
    return false;
  }

  const maxAttempts = getConfiguredMaxAttempts();
  const nextRetryAt =
    payout.payout_attempt_count >= maxAttempts
      ? null
      : calculateNextRetryAt(payout.payout_attempt_count);
  const failureReason =
    typeof payload.reason === "string" && payload.reason.trim().length > 0
      ? payload.reason
      : "Paystack transfer failed";

  const transactionDetails = asObject(payout.transaction_details);
  transactionDetails.payout_execution = {
    ...(asObject(transactionDetails.payout_execution)),
    failed_at: new Date().toISOString(),
    next_retry_at: nextRetryAt,
    payout_attempt_count: payout.payout_attempt_count,
    provider_status: payload.status ?? "failed",
    reason: failureReason,
    transfer_code: payload.transfer_code ?? null,
    webhook_payload: payload,
  };

  const { error } = await supabase
    .from("payouts")
    .update({
      failure_reason: failureReason,
      next_retry_at: nextRetryAt,
      paystack_transfer_code:
        typeof payload.transfer_code === "string" ? payload.transfer_code : null,
      processing_started_at: null,
      status: "failed",
      transaction_details: transactionDetails,
    })
    .eq("id", payout.id);

  if (error) {
    throw new Error(`Failed to mark payout as failed: ${error.message}`);
  }

  await syncAllocationStatusForPayout(
    supabase,
    payout.id,
    nextRetryAt ? "queued_for_payout" : "failed",
  );
  return true;
}
