
-- Create a table for tracking auth events
CREATE TABLE IF NOT EXISTS public.auth_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  user_id UUID,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Add an index on event_type for faster queries
CREATE INDEX IF NOT EXISTS idx_auth_logs_event_type ON public.auth_logs(event_type);

-- Add an index on user_id for faster user-specific queries
CREATE INDEX IF NOT EXISTS idx_auth_logs_user_id ON public.auth_logs(user_id);

-- Add an index on created_at for time-based queries
CREATE INDEX IF NOT EXISTS idx_auth_logs_created_at ON public.auth_logs(created_at);

-- Setup RLS policies
ALTER TABLE public.auth_logs ENABLE ROW LEVEL SECURITY;

-- Allow admins to see all logs
CREATE POLICY "Admins can see all auth logs" 
ON public.auth_logs FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Allow users to see their own logs
CREATE POLICY "Users can see their own auth logs" 
ON public.auth_logs FOR SELECT 
USING (
  auth.uid() = user_id
);

-- Allow inserts from any authenticated user
CREATE POLICY "Allow auth log inserts" 
ON public.auth_logs FOR INSERT
WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'anon');
