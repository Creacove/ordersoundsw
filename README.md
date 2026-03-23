# OrderSOUNDS Hub

OrderSOUNDS is a Vite + React + TypeScript marketplace hub for discovering, purchasing, and managing beats and soundpacks. The app uses Supabase for auth, data, storage, and edge functions, with Paystack and Solana flows for payments.

## Stack

- React 18 + TypeScript + Vite
- Tailwind CSS + shadcn/ui + Radix UI
- Supabase database, storage, auth, and edge functions
- Paystack for NGN payments
- Solana wallet adapter for USDC-based flows

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Copy the example env file and fill in real values:

```bash
cp .env.example .env
```

3. Start the app:

```bash
npm run dev
```

4. Build for production:

```bash
npm run build
```

## Environment Contract

Only `VITE_*` values belong in the browser bundle.

Required client envs:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Required for NGN checkout:

- `VITE_PAYSTACK_PUBLIC_KEY`

Required for Solana / USDC checkout:

- `VITE_PLATFORM_WALLET`
- `VITE_PLATFORM_WALLET_MAINNET` when `VITE_SOLANA_NETWORK=mainnet-beta`

Common client envs:

- `VITE_SOLANA_NETWORK`
- `VITE_SOLANA_PLATFORM_FEE_BPS`
- `VITE_DEVNET_RPC_ENDPOINT`
- `VITE_MAINNET_RPC_ENDPOINT`
- `VITE_ENABLE_GUEST_CART`
- `VITE_ENABLE_REFERRALS`
- `VITE_ENABLE_EXPERIMENTAL_ROUTES`

Server-only secrets must be stored in Supabase Edge Function secrets, not in tracked repo files:

- `SUPABASE_SERVICE_ROLE_KEY`
- `PAYSTACK_SECRET_KEY_LIVE`
- `PAYSTACK_PLATFORM_FEE_BPS`
- `PAYSTACK_PAYOUT_MAX_ATTEMPTS`
- `SOLANA_PLATFORM_FEE_BPS`
- `SOLANA_PLATFORM_WALLET`
- `SOLANA_PLATFORM_WALLET_MAINNET`
- `SOLANA_RPC_URL`

## Sensitive Flows

- `admin-operations` is a privileged admin-only edge function.
- `paystack-operations` and `paystack-split` require authenticated callers and server-side authorization.
- `execute-payouts` is an admin-only worker endpoint that claims queued Paystack payouts and submits transfers server-side.
- `process-audio` is restricted to authenticated producer/admin callers and only accepts OrderSOUNDS storage URLs.
- `verify-paystack-payment` and `verify-solana-payment` require an authenticated caller and validate order ownership before fulfillment.
- `paystack-webhook` validates the raw Paystack webhook body signature before mutating order or payout state.

## Production Notes

- Experimental routes such as `/sandbox` and `/proposal-mocks` are disabled unless `VITE_ENABLE_EXPERIMENTAL_ROUTES=true` or the app is running in dev mode.
- `.env` is intentionally ignored and should stay local-only.
- A broader audit and follow-up backlog live in [hub_audit.md](C:/Users/USER/ordersoundsw/hub_audit.md).

## Commands

- `npm run dev`
- `npm run build`
- `npm run lint`
