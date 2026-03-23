-- Force PostgREST to reload schema cache after dropping password_hash column
-- This resolves the "Could not find the 'password_hash' column in the schema cache" error

NOTIFY pgrst, 'reload schema';