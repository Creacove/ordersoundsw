This directory stores retired Supabase migration files that are intentionally excluded from the active
`supabase/migrations` history.

Why this exists:
- the repository accumulated duplicate migration files for the same version numbers
- several local-only historical migrations were never part of the linked remote project's canonical history
- leaving those files in `supabase/migrations` caused `supabase db push` to treat the repo as out of sync

Rules:
- only `supabase/migrations` is used for active Supabase migration execution
- files moved here are retained for audit/reference only
- if a retired migration still contains required schema changes, reintroduce them as a new forward-only migration
