-- Fix signup bug: Remove password_hash column from users table
-- Supabase Auth manages passwords in auth.users, not public.users

-- First make it nullable for safe rollback
ALTER TABLE public.users ALTER COLUMN password_hash DROP NOT NULL;

-- Then drop the column entirely
ALTER TABLE public.users DROP COLUMN password_hash;