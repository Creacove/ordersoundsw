# OrderSOUNDS Hub Audit

## Executive Summary

This audit reflects the repo after the first stabilization pass focused on production risk containment. The highest-risk anonymous access paths around admin, payout, upload, and payment-verification functions were hardened in code, the public shell no longer exposes demo routes by default, the client config now requires explicit browser envs, and tracked `.env` usage has been replaced with a documented contract.

This does not complete the broader modernization program. The repo still has significant architecture, UX consistency, and performance debt, and the lint baseline is still far from acceptable.

## Phase 0 And Phase 1 Changes Completed

- Hardened privileged edge functions:
  - `supabase/functions/admin-operations/index.ts`
  - `supabase/functions/paystack-operations/index.ts`
  - `supabase/functions/paystack-split/index.ts`
  - `supabase/functions/process-audio/index.ts`
  - `supabase/functions/verify-paystack-payment/index.ts`
  - `supabase/functions/verify-solana-payment/index.ts`
- Added explicit JWT verification configs for admin, audio-processing, and payment-verification functions.
- Switched the browser Supabase client away from hardcoded fallback values in `src/integrations/supabase/client.ts`.
- Removed token fallback logic from `src/lib/storage.ts`.
- Removed the external GPT Engineer production script from `index.html`.
- Feature-gated experimental routes in `src/App.tsx`.
- Replaced the incorrect root README and removed the unused duplicate `src/hooks/auth/useAuthMethods.tsx`.
- Removed legacy custom auth tracking:
  - `src/lib/authLogger.ts` no longer writes browser auth/session telemetry into the primary app database.
  - `supabase/migrations/20260321003000_remove_custom_auth_tracking.sql` removes `public.auth_logs`, `public.auth_sessions`, and the dead custom session functions built around them.
- Added a canonical auth-profile bootstrap path:
  - `src/features/auth/profileService.ts` is now the shared profile load/repair service for signup, callback, session restore, manual refresh, and guest checkout.
  - `supabase/migrations/20260321013000_auth_profile_bootstrap.sql` adds a live `auth.users -> public.users` trigger, reconciles orphaned legacy profiles by email, and backfills missing profiles.
- Introduced typed checkout services in:
  - `src/features/checkout/orderService.ts`
  - `src/features/checkout/solanaCheckoutService.ts`
  - `src/features/checkout/cartCheckout.ts`
- Removed direct client-side order fulfillment from the Solana checkout path and moved verification behind the hardened `verify-solana-payment` function.
- Replaced the expired hardcoded Solana holiday promo split with an explicit browser env contract (`VITE_SOLANA_PLATFORM_FEE_BPS`) and consistent checkout allocation logic.
- Normalized cart checkout preparation so beats, soundpacks, and custom-license pricing flow through shared line-item builders instead of payment-specific ad hoc mappings.
- Added an order-level settlement ledger and payout queue contract via:
  - `supabase/migrations/20260320103000_payment_settlement_ledger.sql`
  - `supabase/functions/_shared/paymentSettlement.ts`
- Made `order_items` a stronger checkout snapshot by recording `product_type`, `producer_id`, and `license_type` at order-creation time.
- Synced verified Paystack and Solana payments into one payment/allocation model, including queued payout obligations for Paystack orders.
- Removed duplicate client-side Paystack split-code orchestration from `src/components/payment/PaymentHandler.tsx` so checkout preparation lives in one place.
- Reconciled `supabase/migrations` to the linked project's canonical history, archived retired duplicate/local-only files under `supabase/migrations_archive/`, and restored clean repo-root `supabase migration list --linked` / `supabase db push --linked` behavior.
- Added server-side payout execution primitives via:
  - `supabase/migrations/20260320143000_payout_execution_queue.sql`
  - `supabase/functions/_shared/payoutExecution.ts`
  - `supabase/functions/execute-payouts/index.ts`
- Hardened `paystack-webhook` to validate the raw request body signature and reconcile payout outcomes through shared payout-state helpers.
- Hardened `verify-solana-payment` to validate expected recipient token-account deltas per order against the stored checkout snapshot.

## Findings

### Security

1. Medium: Solana verification now validates recipient token-account deltas, but it still relies on balance-change analysis rather than explicit instruction decoding.
   - Impact: the current verifier confirms expected signer, mint, and recipient amounts, but it still does not inspect memo/instruction intent beyond those state transitions.
   - Affected paths: `supabase/functions/verify-solana-payment/index.ts`, `src/hooks/payment/useSolanaPayment.tsx`
   - Current mitigation: caller auth, order ownership checks, payment-method checks, signature-manifest checks, expected recipient token-account verification, and total amount verification are now enforced.
   - Recommended remediation: add optional instruction-level parsing and memo correlation for even stronger forensic guarantees.
   - Effort: medium

2. Medium: Paystack payout execution now exists, but it is not yet scheduled or externally monitored.
   - Impact: queued payouts can now be claimed, submitted, retried, and reconciled server-side, but operations still depend on an admin or scheduler invoking `execute-payouts`.
   - Affected paths: `supabase/functions/execute-payouts/index.ts`, `supabase/functions/_shared/payoutExecution.ts`, `supabase/functions/paystack-webhook/index.ts`, `payouts`, `payment_allocations`
   - Current mitigation: a queue-claim function, retry windows, recipient-code persistence, and webhook-driven success/failure reconciliation are now in place.
   - Recommended remediation: wire `execute-payouts` into a scheduled job and add alerting for stale `processing` / repeated `failed` payouts.
   - Effort: medium

3. Medium: Webhook and fulfillment idempotency should be reviewed further.
   - Impact: duplicate callbacks or replayed external events could still create confusing operational states even though core fulfillment is centralized.
   - Affected paths: `supabase/functions/paystack-webhook/index.ts`, `supabase/functions/verify-paystack-payment/index.ts`, `supabase/functions/verify-solana-payment/index.ts`
   - Current mitigation: raw-body Paystack webhook signature verification and payout/reference-based reconciliation are now enforced.
   - Recommended remediation: document and enforce end-to-end idempotency rules around references, signature manifests, and fulfillment retries.
   - Effort: medium

4. Medium: Operational secret rotation is still required outside the repo.
   - Impact: `.env` is no longer intended for version control, but any previously exposed non-public values still need rotation in Supabase and payment providers.
   - Affected paths: `.env`, Supabase project secrets, Paystack config
   - Recommended remediation: rotate any service-role or third-party secrets that were ever committed or shared.
   - Effort: operational

5. Resolved: legacy auth/session persistence duplicated Supabase Auth and stored noisy browser telemetry in the primary app database.
   - Impact before remediation: `public.auth_sessions` duplicated Supabase-managed session state and `public.auth_logs` accumulated browser-generated auth/session events with little operational value.
   - Affected paths: `src/lib/authLogger.ts`, `public.auth_logs`, `public.auth_sessions`, `public.handle_auth_token_storage`, `public.refresh_auth_token`, `public.update_session_version`
   - Resolution: removed the browser-to-database auth logger, dropped the dead custom session functions, and removed both tables from the live schema.
   - Outcome: Supabase Auth is now the only session source of truth for the product.
   - Effort: completed

### Architecture

1. Medium: Paystack checkout orchestration is cleaner, but it is still hook-centric rather than domain-service-centric.
   - Impact: checkout intent creation, split eligibility, and modal orchestration are safer than before, but they are still harder to test in isolation than a dedicated checkout-intent service or edge endpoint would be.
   - Affected paths: `src/hooks/payment/usePaystackCheckout.ts`, `src/utils/payment/paystackUtils.ts`, `src/components/payment/PaystackCheckout.tsx`
   - Recommended remediation: move Paystack order validation and checkout-intent preparation into a typed feature service or dedicated edge function.
   - Effort: medium

2. Medium: Several large page and utility modules remain overloaded.
   - Impact: local edits remain risky and slow.
   - Affected paths: `src/pages/buyer/BeatDetail.tsx`, `src/pages/buyer/Cart.tsx`, `src/lib/storage.ts`, `src/utils/payment/usdcTransactions.ts`
   - Recommended remediation: split state machines, IO utilities, and rendering concerns.
   - Effort: medium to large

3. Resolved: auth/profile lifecycle integrity no longer depends on best-effort browser inserts.
   - Impact before remediation: authenticated users could exist in Supabase Auth without a matching `public.users` row, which broke protected Edge Functions and left signup/callback/session restore behavior inconsistent.
   - Affected paths: `src/hooks/auth/useAuthMethods.ts`, `src/hooks/auth/useAuthState.ts`, `src/context/AuthContext.tsx`, `src/pages/auth/Callback.tsx`, `src/components/cart/GuestCheckoutForm.tsx`, `supabase/migrations/20260321013000_auth_profile_bootstrap.sql`
   - Resolution: centralized profile bootstrap/repair in `src/features/auth/profileService.ts`, replaced ad hoc `users` inserts in auth flows, added a database trigger for future auth users, and reconciled the one orphaned legacy profile/email collision in the live project.
   - Outcome: the linked Supabase project now has `0` auth users missing a `public.users` row, and the auth callback/session restore path always repairs or loads the profile through one contract.
   - Effort: completed

### Design And UX

1. Medium: The repo has theme tokens, but layout ownership is still fragmented.
   - Impact: page-to-page consistency is harder to enforce, especially across buyer, producer, and admin surfaces.
   - Affected paths: `src/components/layout/*`, `src/pages/*`
   - Recommended remediation: define one canonical shell per audience and standardize loading, error, empty, and success states.
   - Effort: medium

2. Medium: Hidden/demo surfaces were left in the product shell until this pass.
   - Impact: confidence in the route surface and release discipline is reduced.
   - Affected paths: `src/App.tsx`, `src/pages/Sandbox.tsx`, `src/pages/temp-proposal-mocks/*`
   - Current mitigation: experimental routes are now gated behind dev mode or an explicit env flag.
   - Recommended remediation: move non-production artifacts into a separate preview app or Storybook-style environment.
   - Effort: medium

### Performance And Operability

1. High: The main production bundle is still oversized.
   - Impact: slower load and parse times, especially on lower-end devices.
   - Affected paths: build output from `npm run build`, route-heavy app shell, payment/wallet dependencies
   - Recommended remediation: split route groups more aggressively, isolate wallet/payment code, and re-check chunking after route cleanup.
   - Effort: medium

2. High: The lint baseline remains unacceptable.
   - Impact: the repo has weak automated guardrails and high regression risk.
   - Affected paths: broad repo-wide issue, especially hooks, payment utilities, edge functions, and layout modules
   - Recommended remediation: adopt a ratchet rule where touched files must be cleaned immediately and the remaining backlog is burned down in batches.
   - Effort: medium to large

3. Medium: Build and runtime diagnostics still rely heavily on console logging.
   - Impact: production debugging is noisy while structured operational insight is limited.
   - Affected paths: auth, payment, wallet, storage, and edge-function code paths
   - Recommended remediation: replace ad hoc logs with a documented logging and monitoring strategy.
   - Effort: medium

## Critical Flow Inventory

- Auth: login, signup, callback, session refresh, protected route checks
- Checkout and payments: cart validation, order creation, Paystack checkout, Solana payment, fulfillment verification
- Producer upload: file upload, preview generation, storage writes
- Admin curation: trending, featured, weekly picks, producer-of-the-week operations
- Referrals: invite flow and referral edge-function operations

## Live Verification Notes

- Verified anonymous protection on the live Supabase project:
  - `paystack-webhook` returns `400` for missing signatures and `401` for invalid signatures.
  - `execute-payouts` returns `401` without a bearer token.
- Verified authenticated role/ownership behavior with a disposable buyer account and matching `public.users` row:
  - `execute-payouts` returns `403` for a buyer.
  - `paystack-operations` now returns `403` for a buyer after the live redeploy correction.
  - `verify-paystack-payment` returns `404` for a non-existent order after auth succeeds.
  - `verify-solana-payment` returns `404` for a non-existent order after auth succeeds.
- Found and corrected a production-only deployment hazard:
  - `paystack-operations` was still serving an older public bundle even after a nominal successful deploy from the legacy CLI path.
  - The live function had to be explicitly replaced and re-deployed using `supabase functions deploy --use-api` before the hardened auth checks actually took effect.
  - Recommendation: treat `--use-api` plus post-deploy source/behavior verification as mandatory for existing Edge Functions until the CLI path is upgraded and revalidated.
- Observed an auth/profile dependency worth keeping visible:
  - protected Edge Functions rely on a matching `public.users` record as well as a valid Supabase auth token.
  - this dependency is now enforced by a live `auth.users` bootstrap trigger plus shared client-side repair logic rather than best-effort inserts scattered across the UI.
- Verified removal of redundant custom auth persistence from the live database:
  - `public.auth_sessions` had `0` live rows before removal and no live trigger wiring into it.
  - `public.auth_logs` had `17,092` live rows of browser-generated auth/session diagnostics before removal.
  - after migration `20260321003000_remove_custom_auth_tracking`, both tables and the custom session functions no longer exist in the linked Supabase project.
- Verified auth/profile reconciliation and bootstrap in the live database:
  - after migration `20260321013000_auth_profile_bootstrap`, the linked Supabase project has `0` auth users missing a `public.users` row.
  - the one orphaned legacy `public.users` row that collided on `anumades@gmail.com` was adopted onto the real auth user ID, and its follower reference moved with it.
  - the `auth.users` trigger `on_auth_user_created` now exists in the live project, so future signups get a `public.users` row even if the browser never runs repair code.

## Recommended Next Wave

1. Schedule and monitor `execute-payouts`, including alerting for stale `processing` payouts and repeated retry exhaustion.
2. Continue extracting checkout orchestration out of `Cart.tsx` and `usePaystackCheckout.ts`, ideally behind a server-authenticated checkout-intent endpoint.
3. Start the lint ratchet on touched files, beginning with payment, auth, and layout modules.
4. Standardize buyer, producer, and admin state handling for loading, error, and success flows.
