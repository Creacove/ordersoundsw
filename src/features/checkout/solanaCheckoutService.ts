import { supabase } from "@/integrations/supabase/client";
import {
  createPendingOrder,
  persistOrderPaymentManifest,
  type CheckoutOrderItemInput,
} from "./orderService";

export interface SolanaCheckoutItemInput {
  id: string;
  licenseType: string;
  price: number;
  producerId: string;
  producerWallet: string | null;
  productType: "beat" | "soundpack";
  title: string;
}

interface SolanaFulfillmentResult {
  diagnostics?: unknown;
  final_currency?: string;
  items_failed?: number;
  items_fulfilled?: number;
  message?: string;
  success?: boolean;
}

export interface SolanaVerificationResult {
  alreadyCompleted?: boolean;
  fulfillmentResult?: SolanaFulfillmentResult;
  orderId: string;
  success?: boolean;
  verified?: boolean;
  verifiedSignatures?: string[];
}

type EdgeFunctionErrorShape = {
  code?: string;
  error?: string;
};

export class SolanaVerificationError extends Error {
  code?: string;
  recoverable: boolean;

  constructor(message: string, options?: { code?: string; recoverable?: boolean }) {
    super(message);
    this.code = options?.code;
    this.name = "SolanaVerificationError";
    this.recoverable = options?.recoverable ?? false;
  }
}

function isRecoverableVerificationFailure(code?: string, message = "") {
  return (
    code === "TX_NOT_FOUND" ||
    code === "RPC_ERROR" ||
    message.includes("Edge Function returned a non-2xx status code")
  );
}

async function parseEdgeFunctionError(error: unknown) {
  const fallbackMessage = error instanceof Error ? error.message : "Solana payment verification failed";
  const fallbackCode = error instanceof SolanaVerificationError ? error.code : undefined;

  const functionError = error as {
    context?: {
      json?: EdgeFunctionErrorShape | (() => Promise<EdgeFunctionErrorShape>);
    };
  };

  try {
    const contextJson = functionError?.context?.json;
    const parsed =
      typeof contextJson === "function"
        ? await contextJson()
        : contextJson;

    return {
      code: parsed?.code ?? fallbackCode,
      message: parsed?.error ?? fallbackMessage,
    };
  } catch {
    return {
      code: fallbackCode,
      message: fallbackMessage,
    };
  }
}

export async function createPendingSolanaOrder(items: SolanaCheckoutItemInput[]) {
  const orderItems: CheckoutOrderItemInput[] = items.map((item) => ({
    licenseType: item.licenseType,
    price: item.price,
    producerId: item.producerId,
    productId: item.id,
    productType: item.productType,
    quantity: 1,
    title: item.title || "Product",
  }));

  const totalPrice = items.reduce((sum, item) => sum + item.price, 0);

  return createPendingOrder({
    currencyUsed: "USD",
    items: orderItems,
    paymentMethod: "solana_usdc",
    totalPrice,
  });
}

interface VerifySolanaOrderInput {
  network: string;
  orderId: string;
  signatures: string[];
}

export async function verifySolanaOrder({
  network,
  orderId,
  signatures,
}: VerifySolanaOrderInput): Promise<SolanaVerificationResult> {
  await persistOrderPaymentManifest({
    orderId,
    paymentReference: signatures[0],
    transactionSignatures: signatures,
  });

  const { data, error } = await supabase.functions.invoke<SolanaVerificationResult>(
    "verify-solana-payment",
    {
      body: {
        network,
        orderId,
        signatures,
      },
    },
  );

  if (error) {
    const parsedError = await parseEdgeFunctionError(error);
    throw new SolanaVerificationError(parsedError.message, {
      code: parsedError.code,
      recoverable: isRecoverableVerificationFailure(parsedError.code, parsedError.message),
    });
  }

  if (!data?.verified || !data?.success || (data.fulfillmentResult && !data.fulfillmentResult.success)) {
    const message =
      data?.fulfillmentResult?.message ||
      "Solana payment verification did not complete successfully";

    throw new SolanaVerificationError(message);
  }

  return data;
}
