import { z } from "zod";

const DEFAULT_DEVNET_RPC_ENDPOINT = "https://api.devnet.solana.com";
const DEFAULT_MAINNET_RPC_ENDPOINT = "https://api.mainnet-beta.solana.com";

export type SupportedSolanaNetwork = "devnet" | "mainnet-beta" | "testnet";

const requiredString = (name: string) =>
  z.string().trim().min(1, `${name} is required`);
const requiredUrl = (name: string) =>
  requiredString(name).url(`${name} must be a valid URL`);
const optionalString = z
  .string()
  .trim()
  .optional()
  .transform((value) => {
    return value ? value : undefined;
  });
const optionalBasisPoints = optionalString.transform((value, ctx) => {
  if (!value) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);

  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 10000) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "VITE_SOLANA_PLATFORM_FEE_BPS must be an integer between 0 and 10000",
    });
    return z.NEVER;
  }

  return parsed;
});
const optionalPaystackPublicKey = optionalString.transform((value, ctx) => {
  if (!value) {
    return undefined;
  }

  if (!/^pk_(live|test)_/.test(value)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "VITE_PAYSTACK_PUBLIC_KEY must start with pk_live_ or pk_test_",
    });
    return z.NEVER;
  }

  return value;
});

const publicEnvSchema = z.object({
  VITE_DEVNET_RPC_ENDPOINT: optionalString,
  VITE_ENABLE_EXPERIMENTAL_ROUTES: optionalString,
  VITE_ENABLE_GUEST_CART: optionalString,
  VITE_ENABLE_REFERRALS: optionalString,
  VITE_MAINNET_RPC_ENDPOINT: optionalString,
  VITE_PAYSTACK_PUBLIC_KEY: optionalPaystackPublicKey,
  VITE_PLATFORM_WALLET: optionalString,
  VITE_PLATFORM_WALLET_MAINNET: optionalString,
  VITE_SOLANA_PLATFORM_FEE_BPS: optionalBasisPoints,
  VITE_SOLANA_NETWORK: optionalString,
  VITE_SUPABASE_PUBLISHABLE_KEY: requiredString("VITE_SUPABASE_PUBLISHABLE_KEY"),
  VITE_SUPABASE_URL: requiredUrl("VITE_SUPABASE_URL"),
});

function parseBooleanFlag(value?: string) {
  return value === "true";
}

function requirePublicEnv(name: string, value?: string) {
  if (!value) {
    throw new Error(`Missing ${name}`);
  }

  return value;
}

export function normalizeSolanaNetwork(value?: string): SupportedSolanaNetwork {
  const normalizedValue = value?.trim().toLowerCase();

  switch (normalizedValue) {
    case "mainnet":
    case "mainnet-beta":
      return "mainnet-beta";
    case "testnet":
      return "testnet";
    case "devnet":
    case undefined:
      return "devnet";
    default:
      console.warn(`Unsupported VITE_SOLANA_NETWORK value "${value}". Falling back to devnet.`);
      return "devnet";
  }
}

function parsePublicEnv() {
  const result = publicEnvSchema.safeParse(import.meta.env);

  if (result.success) {
    return result.data;
  }

  const issues = result.error.issues.map((issue) => `- ${issue.message}`).join("\n");
  throw new Error(`Invalid browser environment configuration:\n${issues}`);
}

const parsedPublicEnv = parsePublicEnv();

export const publicEnv = {
  isDev: import.meta.env.DEV,
  enableExperimentalRoutes: parseBooleanFlag(parsedPublicEnv.VITE_ENABLE_EXPERIMENTAL_ROUTES),
  enableGuestCart: parseBooleanFlag(parsedPublicEnv.VITE_ENABLE_GUEST_CART),
  enableReferrals: parseBooleanFlag(parsedPublicEnv.VITE_ENABLE_REFERRALS),
  mainnetRpcEndpoint:
    parsedPublicEnv.VITE_MAINNET_RPC_ENDPOINT || DEFAULT_MAINNET_RPC_ENDPOINT,
  paystackPublicKey: parsedPublicEnv.VITE_PAYSTACK_PUBLIC_KEY,
  platformWallet: parsedPublicEnv.VITE_PLATFORM_WALLET,
  platformWalletMainnet:
    parsedPublicEnv.VITE_PLATFORM_WALLET_MAINNET || parsedPublicEnv.VITE_PLATFORM_WALLET,
  solanaPlatformFeeBps: parsedPublicEnv.VITE_SOLANA_PLATFORM_FEE_BPS ?? 2000,
  solanaNetwork: normalizeSolanaNetwork(parsedPublicEnv.VITE_SOLANA_NETWORK),
  supabasePublishableKey: parsedPublicEnv.VITE_SUPABASE_PUBLISHABLE_KEY,
  supabaseUrl: parsedPublicEnv.VITE_SUPABASE_URL,
  devnetRpcEndpoint:
    parsedPublicEnv.VITE_DEVNET_RPC_ENDPOINT || DEFAULT_DEVNET_RPC_ENDPOINT,
} as const;

export function isMainnetNetwork(network?: string) {
  return normalizeSolanaNetwork(network ?? publicEnv.solanaNetwork) === "mainnet-beta";
}

export function getSolanaRpcEndpoint(network?: string) {
  return isMainnetNetwork(network) ? publicEnv.mainnetRpcEndpoint : publicEnv.devnetRpcEndpoint;
}

export function getPlatformWalletAddress(network?: string) {
  const walletAddress = isMainnetNetwork(network)
    ? publicEnv.platformWalletMainnet
    : publicEnv.platformWallet;

  return requirePublicEnv(
    isMainnetNetwork(network) ? "VITE_PLATFORM_WALLET_MAINNET" : "VITE_PLATFORM_WALLET",
    walletAddress,
  );
}
