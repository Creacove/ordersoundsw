
# Environment Setup Instructions

## Local Development

1. Create a local `.env` file in the project root. It is ignored by git and must stay local-only.
2. Copy the contents from `.env.example`.
3. Replace placeholders with values for the environment you are working against.

Example `.env` file:

```dotenv
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key_here
VITE_PAYSTACK_PUBLIC_KEY=pk_test_replace_me
VITE_SOLANA_NETWORK=devnet
VITE_SOLANA_PLATFORM_FEE_BPS=2000
```

## Browser vs Server Configuration

Only `VITE_*` variables belong in the browser bundle. That includes the Paystack public key.

Browser-visible variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_PAYSTACK_PUBLIC_KEY`
- `VITE_SOLANA_NETWORK`
- `VITE_SOLANA_PLATFORM_FEE_BPS`
- `VITE_DEVNET_RPC_ENDPOINT`
- `VITE_MAINNET_RPC_ENDPOINT`
- `VITE_PLATFORM_WALLET`
- `VITE_PLATFORM_WALLET_MAINNET`

Server-only secrets must not be stored in `.env.example` or committed files:

- `PAYSTACK_SECRET_KEY_LIVE`
- `PAYSTACK_PLATFORM_FEE_BPS`
- `SOLANA_PLATFORM_FEE_BPS`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SOLANA_RPC_URL`

## Edge Function Secrets

Set server-only secrets in Supabase, not in the Vite client env file:

```bash
supabase login
supabase secrets set PAYSTACK_SECRET_KEY_LIVE=your_actual_secret_key --project-ref your-project-ref
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key --project-ref your-project-ref
```

Or through the Supabase Dashboard:

1. Open your Supabase project.
2. Go to Settings > Edge Functions.
3. Add the required secrets.

## Important Security Notes

- Never commit `.env` or any file containing non-public credentials.
- Treat `VITE_*` values as public client configuration.
- Rotate secrets immediately if they were ever committed or shared.
- Set production env values in the hosting platform and Supabase secret store, not in source control.
