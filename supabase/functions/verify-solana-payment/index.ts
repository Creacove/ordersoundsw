import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getAssociatedTokenAddressSync } from "https://esm.sh/@solana/spl-token@0.4.14";
import { Connection, PublicKey } from "https://esm.sh/@solana/web3.js@1.78.3";
import { authenticateRequest, createServiceRoleClient } from "../_shared/auth.ts";
import { syncPaymentSettlement } from "../_shared/paymentSettlement.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEFAULT_SOLANA_PLATFORM_FEE_BPS = 2000;
const USDC_MINTS = {
  devnet: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
  "mainnet-beta": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
};

type OrderItemRecord = {
  price: number;
  producer_id: string | null;
  quantity: number | null;
  title: string;
};

type ProducerWalletRecord = {
  id: string;
  wallet_address: string | null;
};

function normalizeNetwork(network: string) {
  return network === "mainnet" ? "mainnet-beta" : network;
}

function getPublicKeyString(value: unknown) {
  if (typeof value === "string") {
    return value;
  }

  if (value && typeof value === "object" && "toBase58" in value && typeof value.toBase58 === "function") {
    return value.toBase58();
  }

  return "";
}

function isValidPublicKey(value?: string | null) {
  if (!value) {
    return false;
  }

  try {
    new PublicKey(value);
    return true;
  } catch {
    return false;
  }
}

function transactionIncludesSigner(tx: unknown, walletAddress: string) {
  const accountKeys = (tx as { transaction?: { message?: { accountKeys?: unknown[] } } })?.transaction?.message?.accountKeys ?? [];

  return accountKeys.some((account) => {
    const accountRecord = account as { pubkey?: unknown; signer?: boolean };
    const pubkey = getPublicKeyString(accountRecord?.pubkey ?? account);
    return pubkey === walletAddress && Boolean(accountRecord?.signer);
  });
}

function roundUsdAmount(amount: number) {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

function usdToMinorUnits(amount: number) {
  return BigInt(Math.round(amount * 1_000_000));
}

function getConfiguredSolanaPlatformFeeBps() {
  const rawValue = Deno.env.get("SOLANA_PLATFORM_FEE_BPS");
  if (!rawValue) {
    return DEFAULT_SOLANA_PLATFORM_FEE_BPS;
  }

  const parsed = Number.parseInt(rawValue, 10);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 10000) {
    throw new Error("SOLANA_PLATFORM_FEE_BPS must be an integer between 0 and 10000");
  }

  return parsed;
}

function getPlatformWalletForNetwork(network: "devnet" | "mainnet-beta") {
  const walletAddress = network === "mainnet-beta"
    ? Deno.env.get("SOLANA_PLATFORM_WALLET_MAINNET") ?? Deno.env.get("VITE_PLATFORM_WALLET_MAINNET")
    : Deno.env.get("SOLANA_PLATFORM_WALLET") ?? Deno.env.get("VITE_PLATFORM_WALLET");

  if (!walletAddress || !isValidPublicKey(walletAddress)) {
    throw new Error(
      network === "mainnet-beta"
        ? "Missing SOLANA_PLATFORM_WALLET_MAINNET for Solana settlement verification"
        : "Missing SOLANA_PLATFORM_WALLET for Solana settlement verification",
    );
  }

  return walletAddress;
}

function getAccountKeyByIndex(tx: unknown, accountIndex: number) {
  const accountKeys = (tx as { transaction?: { message?: { accountKeys?: unknown[] } } })?.transaction?.message?.accountKeys ?? [];
  const account = accountKeys[accountIndex];
  return getPublicKeyString((account as { pubkey?: unknown })?.pubkey ?? account);
}

function getRecipientTokenDeltas(
  tx: unknown,
  expectedMint: string,
  expectedTokenAccounts: Set<string>,
) {
  const preTokenBalances = Array.isArray((tx as { meta?: { preTokenBalances?: unknown[] } })?.meta?.preTokenBalances)
    ? ((tx as { meta?: { preTokenBalances?: unknown[] } }).meta?.preTokenBalances as Array<Record<string, unknown>>)
    : [];
  const postTokenBalances = Array.isArray((tx as { meta?: { postTokenBalances?: unknown[] } })?.meta?.postTokenBalances)
    ? ((tx as { meta?: { postTokenBalances?: unknown[] } }).meta?.postTokenBalances as Array<Record<string, unknown>>)
    : [];
  const preBalanceMap = new Map<number, bigint>();
  const recipientDeltas = new Map<string, bigint>();

  for (const balance of preTokenBalances) {
    if (balance?.mint !== expectedMint) {
      continue;
    }

    const accountIndex = Number(balance.accountIndex);
    preBalanceMap.set(accountIndex, BigInt(String((balance.uiTokenAmount as { amount?: string })?.amount ?? "0")));
  }

  for (const balance of postTokenBalances) {
    if (balance?.mint !== expectedMint) {
      continue;
    }

    const accountIndex = Number(balance.accountIndex);
    const tokenAccount = getAccountKeyByIndex(tx, accountIndex);

    if (!expectedTokenAccounts.has(tokenAccount)) {
      continue;
    }

    const previousAmount = preBalanceMap.get(accountIndex) ?? BigInt(0);
    const currentAmount = BigInt(String((balance.uiTokenAmount as { amount?: string })?.amount ?? "0"));

    if (currentAmount > previousAmount) {
      const currentDelta = recipientDeltas.get(tokenAccount) ?? BigInt(0);
      recipientDeltas.set(tokenAccount, currentDelta + (currentAmount - previousAmount));
    }
  }

  return recipientDeltas;
}

function mergeRecipientAmount(
  recipientAmounts: Map<string, bigint>,
  walletAddress: string,
  amount: bigint,
) {
  if (amount <= BigInt(0)) {
    return;
  }

  const currentAmount = recipientAmounts.get(walletAddress) ?? BigInt(0);
  recipientAmounts.set(walletAddress, currentAmount + amount);
}

function buildExpectedRecipientAmounts(
  orderItems: OrderItemRecord[],
  producerWallets: Map<string, string>,
  network: "devnet" | "mainnet-beta",
) {
  const recipientAmounts = new Map<string, bigint>();
  const platformFeeBps = getConfiguredSolanaPlatformFeeBps();

  for (const item of orderItems) {
    const quantity = item.quantity ?? 1;
    const grossAmount = roundUsdAmount(Number(item.price) * quantity);
    const producerWallet =
      item.producer_id && producerWallets.has(item.producer_id)
        ? producerWallets.get(item.producer_id) ?? null
        : null;

    if (producerWallet && isValidPublicKey(producerWallet)) {
      const platformAmount = roundUsdAmount((grossAmount * platformFeeBps) / 10000);
      const producerAmount = roundUsdAmount(grossAmount - platformAmount);

      mergeRecipientAmount(recipientAmounts, producerWallet, usdToMinorUnits(producerAmount));
      if (platformAmount > 0) {
        mergeRecipientAmount(
          recipientAmounts,
          getPlatformWalletForNetwork(network),
          usdToMinorUnits(platformAmount),
        );
      }
      continue;
    }

    mergeRecipientAmount(
      recipientAmounts,
      getPlatformWalletForNetwork(network),
      usdToMinorUnits(grossAmount),
    );
  }

  return recipientAmounts;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const {
      orderId,
      signature,
      signatures = [],
      network = "mainnet-beta",
    } = body;

    if (!orderId) {
      return new Response(
        JSON.stringify({ error: "Missing orderId", code: "INVALID_REQUEST" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createServiceRoleClient();
    const authResult = await authenticateRequest(req, supabase);
    if ("response" in authResult) {
      return authResult.response;
    }

    const actor = authResult.actor;
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, buyer_id, status, payment_method, payment_reference, total_price, transaction_signatures")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ error: "Order not found", code: "ORDER_NOT_FOUND" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const canAccessOrder = actor.appUser.role === "admin" || order.buyer_id === actor.authUser.id;
    if (!canAccessOrder) {
      return new Response(
        JSON.stringify({ error: "Forbidden", code: "FORBIDDEN" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (order.payment_method && order.payment_method !== "solana_usdc") {
      return new Response(
        JSON.stringify({ error: "Order is not a Solana payment", code: "INVALID_PAYMENT_METHOD" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const alreadyCompleted = order.status === "completed";
    const storedSignatures = Array.isArray(order.transaction_signatures)
      ? order.transaction_signatures.filter((value: unknown): value is string => typeof value === "string" && value.length > 0)
      : [];
    const requestSignatures = Array.isArray(signatures)
      ? signatures.filter((value: unknown): value is string => typeof value === "string" && value.length > 0)
      : [];

    if (storedSignatures.length > 0 && signature && !storedSignatures.includes(signature) && order.payment_reference !== signature) {
      return new Response(
        JSON.stringify({ error: "Signature does not match the order payment manifest", code: "SIGNATURE_MISMATCH" }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (storedSignatures.length > 0 && requestSignatures.length > 0) {
      const unexpectedSignatures = requestSignatures.filter((value) => !storedSignatures.includes(value));
      if (unexpectedSignatures.length > 0) {
        return new Response(
          JSON.stringify({ error: "Request signatures do not match the stored order manifest", code: "SIGNATURE_MISMATCH" }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    const signaturesToVerify = Array.from(
      new Set(
        (storedSignatures.length > 0
          ? storedSignatures
          : requestSignatures.length > 0
            ? requestSignatures
            : signature
              ? [signature]
              : order.payment_reference
                ? [order.payment_reference]
                : [])
          .map((value) => value.trim())
          .filter(Boolean),
      ),
    );

    if (!signaturesToVerify.length) {
      return new Response(
        JSON.stringify({ error: "No transaction signatures available for verification", code: "MISSING_SIGNATURE" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const normalizedNetwork = normalizeNetwork(network);
    if (!["mainnet-beta", "devnet"].includes(normalizedNetwork)) {
      return new Response(
        JSON.stringify({ error: "Unsupported Solana network", code: "INVALID_NETWORK" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: buyerProfile, error: buyerProfileError } = await supabase
      .from("users")
      .select("wallet_address")
      .eq("id", order.buyer_id)
      .maybeSingle();

    if (buyerProfileError) {
      return new Response(
        JSON.stringify({ error: "Failed to resolve buyer wallet context", code: "BUYER_CONTEXT_ERROR" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const buyerWalletAddress = buyerProfile?.wallet_address;
    if (!buyerWalletAddress) {
      return new Response(
        JSON.stringify({ error: "Buyer wallet is not linked to the account", code: "WALLET_NOT_LINKED" }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: orderItemsData, error: orderItemsError } = await supabase
      .from("order_items")
      .select("price, producer_id, quantity, title")
      .eq("order_id", orderId);

    if (orderItemsError) {
      return new Response(
        JSON.stringify({ error: "Failed to load order items", code: "ORDER_ITEMS_ERROR" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const orderItems = (orderItemsData ?? []) as OrderItemRecord[];
    if (!orderItems.length) {
      return new Response(
        JSON.stringify({ error: "Order contains no items", code: "ORDER_ITEMS_MISSING" }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const producerIds = Array.from(
      new Set(
        orderItems
          .map((item) => item.producer_id)
          .filter((value): value is string => typeof value === "string" && value.length > 0),
      ),
    );
    const producerWallets = new Map<string, string>();

    if (producerIds.length > 0) {
      const { data: producers, error: producerError } = await supabase
        .from("users")
        .select("id, wallet_address")
        .in("id", producerIds);

      if (producerError) {
        return new Response(
          JSON.stringify({ error: "Failed to resolve producer wallet context", code: "PRODUCER_CONTEXT_ERROR" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      for (const producer of (producers ?? []) as ProducerWalletRecord[]) {
        if (producer.wallet_address && isValidPublicKey(producer.wallet_address)) {
          producerWallets.set(producer.id, producer.wallet_address);
        }
      }
    }

    const expectedMint = USDC_MINTS[normalizedNetwork as keyof typeof USDC_MINTS];
    const expectedRecipientAmounts = buildExpectedRecipientAmounts(
      orderItems,
      producerWallets,
      normalizedNetwork as "devnet" | "mainnet-beta",
    );
    const expectedOrderAmount = Array.from(expectedRecipientAmounts.values()).reduce(
      (total, currentAmount) => total + currentAmount,
      BigInt(0),
    );

    const expectedTokenAccounts = new Map<string, string>();
    for (const walletAddress of expectedRecipientAmounts.keys()) {
      const tokenAccount = getAssociatedTokenAddressSync(
        new PublicKey(expectedMint),
        new PublicKey(walletAddress),
      );
      expectedTokenAccounts.set(walletAddress, tokenAccount.toBase58());
    }

    const rpcUrl = Deno.env.get("SOLANA_RPC_URL") || (
      normalizedNetwork === "mainnet-beta"
        ? "https://api.mainnet-beta.solana.com"
        : "https://api.devnet.solana.com"
    );
    const connection = new Connection(rpcUrl, "confirmed");
    const actualRecipientAmounts = new Map<string, bigint>();
    let totalTransferredAmount = BigInt(0);

    for (const currentSignature of signaturesToVerify) {
      let tx = null;
      let lastError = "";

      for (let i = 0; i < 20; i++) {
        try {
          const status = await connection.getSignatureStatus(currentSignature, { searchTransactionHistory: true });
          if (status?.value) {
            tx = await connection.getParsedTransaction(currentSignature, {
              commitment: "confirmed",
              maxSupportedTransactionVersion: 0,
            });
            if (tx) {
              break;
            }
          }
        } catch (error) {
          lastError = error instanceof Error ? error.message : "Unknown error";
        }

        await new Promise((resolve) => setTimeout(resolve, 3000));
      }

      if (!alreadyCompleted) {
        if (!tx) {
          return new Response(
            JSON.stringify({
              code: "TX_NOT_FOUND",
              diagnostic: lastError,
              error: "Transaction still pending or node lag. Please refresh your library in a minute.",
              signature: currentSignature,
            }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }

        if (tx.meta?.err) {
          return new Response(
            JSON.stringify({ error: "Transaction failed on-chain", code: "TX_FAILED", signature: currentSignature }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }

        if (!transactionIncludesSigner(tx, buyerWalletAddress)) {
          return new Response(
            JSON.stringify({ error: "Transaction was not signed by the buyer wallet on record", code: "SIGNER_MISMATCH", signature: currentSignature }),
            { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }

        const txRecipientDeltas = getRecipientTokenDeltas(
          tx,
          expectedMint,
          new Set(expectedTokenAccounts.values()),
        );

        for (const [walletAddress, tokenAccount] of expectedTokenAccounts.entries()) {
          const actualAmount = txRecipientDeltas.get(tokenAccount) ?? BigInt(0);
          if (actualAmount <= BigInt(0)) {
            continue;
          }

          mergeRecipientAmount(actualRecipientAmounts, walletAddress, actualAmount);
          totalTransferredAmount += actualAmount;
        }
      }
    }

    if (!alreadyCompleted) {
      const missingRecipients = Array.from(expectedRecipientAmounts.entries())
        .filter(([walletAddress, expectedAmount]) => {
          const actualAmount = actualRecipientAmounts.get(walletAddress) ?? BigInt(0);
          return actualAmount < expectedAmount;
        })
        .map(([walletAddress, expectedAmount]) => ({
          actualAmount: (actualRecipientAmounts.get(walletAddress) ?? BigInt(0)).toString(),
          expectedAmount: expectedAmount.toString(),
          recipient: walletAddress,
        }));

      if (missingRecipients.length > 0 || totalTransferredAmount < expectedOrderAmount) {
        return new Response(
          JSON.stringify({
            actualRecipients: Array.from(actualRecipientAmounts.entries()).map(([recipient, amount]) => ({
              amount: amount.toString(),
              recipient,
            })),
            code: "RECIPIENT_AMOUNT_MISMATCH",
            error: "Verified transaction signatures do not satisfy the expected Solana payout recipients",
            expectedRecipients: Array.from(expectedRecipientAmounts.entries()).map(([recipient, amount]) => ({
              amount: amount.toString(),
              recipient,
            })),
            missingRecipients,
            totalTransferredAmount: totalTransferredAmount.toString(),
          }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const { error: updateError } = await supabase
        .from("orders")
        .update({
          currency_used: "USD",
          payment_method: "solana_usdc",
          payment_reference: order.payment_reference ?? signaturesToVerify[0],
          status: "processing",
          transaction_signatures: signaturesToVerify,
        })
        .eq("id", orderId);

      if (updateError) {
        console.error("[VerifySolana] Failed to update order metadata:", updateError);
      }
    }

    const { data: fulfillmentResult, error: rpcError } = await supabase.rpc("finalize_order_fulfillment", {
      p_order_id: orderId,
    });

    if (rpcError) {
      return new Response(
        JSON.stringify({
          code: "RPC_ERROR",
          details: rpcError,
          error: "Fulfillment engine error",
          orderId,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let settlementResult: unknown = null;
    let settlementWarning: string | null = null;

    try {
      settlementResult = await syncPaymentSettlement(supabase, {
        orderId,
        paymentDetails: {
          expectedRecipients: Array.from(expectedRecipientAmounts.entries()).map(([recipient, amount]) => ({
            amount: amount.toString(),
            recipient,
          })),
          network: normalizedNetwork,
          totalTransferredAmount: totalTransferredAmount.toString(),
          verifiedRecipients: Array.from(actualRecipientAmounts.entries()).map(([recipient, amount]) => ({
            amount: amount.toString(),
            recipient,
          })),
          verifiedSignatures: signaturesToVerify,
        },
        paymentMethod: "solana_usdc",
        paymentReference: order.payment_reference ?? signaturesToVerify[0],
      });
    } catch (settlementError) {
      settlementWarning = settlementError instanceof Error
        ? settlementError.message
        : "Settlement sync failed";
      console.error("[VerifySolana] Settlement sync failed:", settlementError);
    }

    return new Response(
      JSON.stringify({
        alreadyCompleted,
        fulfillmentResult,
        orderId,
        settlementResult,
        settlementWarning,
        success: fulfillmentResult?.success || false,
        totalTransferredAmount: totalTransferredAmount.toString(),
        verified: true,
        verifiedRecipients: Array.from(actualRecipientAmounts.entries()).map(([recipient, amount]) => ({
          amount: amount.toString(),
          recipient,
        })),
        verifiedSignatures: signaturesToVerify,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("[VerifySolana] Global error:", error);
    return new Response(
      JSON.stringify({
        code: "FATAL_ERROR",
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
