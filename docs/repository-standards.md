# Repository Standards

This document defines the target structure for the next refactor waves. It is intentionally practical: it describes where new code should go now, even while legacy code is still being moved.

## Current Direction

- `src/routes`
  - Owns route grouping, route-level lazy loading, experimental route gating, and route fallback UI.
  - `App.tsx` should only compose global providers and render `AppRoutes`.
- `src/components`
  - Reserved for reusable presentational UI, shared layout primitives, and low-level UI building blocks.
  - Business logic should not originate here unless the component is the clear feature owner.
- `src/pages`
  - Temporary home for route entry screens.
  - Page files should become thin composition layers over feature hooks/services.
- `src/services`
  - Reserved for integration-facing logic and external IO that is not feature-local.
- `src/lib`
  - Reserved for framework-agnostic helpers, thin adapters, and shared low-level utilities.
- `src/features` (target state)
  - New domain work should trend toward `src/features/<domain>`.
  - Each domain should eventually own its hooks, services, schemas, and route-facing composition.

## Route Ownership

- Public browsing and auth routes belong in `src/routes/publicRoutes.tsx`.
- Buyer-facing account and purchase routes belong in `src/routes/buyerRoutes.tsx`.
- Producer routes belong in `src/routes/producerRoutes.tsx`.
- Admin routes belong in `src/routes/adminRoutes.tsx`.
- Demo or non-production surfaces belong in `src/routes/experimentalRoutes.tsx` and must stay gated.

## Rules For New Work

- Do not add new routes directly in `App.tsx`.
- Do not add new privileged data mutations directly inside page components if a feature hook/service can own them.
- Do not add new environment-specific constants directly inside product code when they belong in the env contract.
- Every touched file should leave cleaner than it was: reduce `any`, remove dead code, and tighten boundaries as part of the change.

## Immediate Extraction Targets

These are the next files that should be thinned into domain-owned layers:

- `src/pages/buyer/Cart.tsx`
- `src/pages/buyer/BeatDetail.tsx`
- `src/pages/producer/Settings.tsx`
- `src/hooks/payment/usePaystackCheckout.ts`
- `src/hooks/payment/useSolanaPayment.tsx`

## Definition Of Done For Batch 1

- `App.tsx` no longer owns route declarations.
- Route groups are separated by audience.
- Experimental routes stay out of the default production surface.
- The repo has a documented structure target for subsequent refactors.
