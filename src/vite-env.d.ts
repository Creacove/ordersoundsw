/// <reference types="vite/client" />
/// <reference types="react" />
/// <reference types="react-dom" />

interface ImportMetaEnv {
  readonly VITE_DEVNET_RPC_ENDPOINT?: string;
  readonly VITE_ENABLE_EXPERIMENTAL_ROUTES?: string;
  readonly VITE_ENABLE_GUEST_CART?: string;
  readonly VITE_ENABLE_REFERRALS?: string;
  readonly VITE_MAINNET_RPC_ENDPOINT?: string;
  readonly VITE_PAYSTACK_PUBLIC_KEY?: string;
  readonly VITE_PLATFORM_WALLET?: string;
  readonly VITE_PLATFORM_WALLET_MAINNET?: string;
  readonly VITE_SOLANA_NETWORK?: "devnet" | "mainnet" | "mainnet-beta" | "testnet";
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string;
  readonly VITE_SUPABASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
