type JsonObject = Record<string, unknown>;

const PAYSTACK_API_URL = "https://api.paystack.co";

export class PaystackApiError extends Error {
  details: unknown;
  retriable: boolean;
  status: number;

  constructor(message: string, options: { details?: unknown; retriable?: boolean; status?: number } = {}) {
    super(message);
    this.name = "PaystackApiError";
    this.details = options.details ?? null;
    this.retriable = options.retriable ?? false;
    this.status = options.status ?? 500;
  }
}

function getPaystackSecretKey() {
  const paystackSecretKey = Deno.env.get("PAYSTACK_SECRET_KEY_LIVE");

  if (!paystackSecretKey) {
    throw new Error("Missing PAYSTACK_SECRET_KEY_LIVE");
  }

  if (paystackSecretKey.startsWith("sk_test_")) {
    throw new Error("PAYSTACK_SECRET_KEY_LIVE must not use a test key");
  }

  return paystackSecretKey;
}

export async function makePaystackApiCall<T>(
  endpoint: string,
  method: "GET" | "POST" | "PUT",
  body?: JsonObject,
): Promise<T> {
  const response = await fetch(`${PAYSTACK_API_URL}${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${getPaystackSecretKey()}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const rawResponse = await response.text();
  const parsedResponse = rawResponse ? JSON.parse(rawResponse) : null;
  const retriable = response.status === 429 || response.status >= 500;

  if (!response.ok || !parsedResponse?.status) {
    const message =
      parsedResponse?.message ||
      `Paystack API request failed with status ${response.status}`;

    throw new PaystackApiError(message, {
      details: parsedResponse,
      retriable,
      status: response.status,
    });
  }

  return parsedResponse as T;
}
