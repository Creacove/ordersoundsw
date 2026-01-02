-- ========================================
-- Enable RLS on tables with policies but RLS disabled
-- ========================================

-- Enable RLS on auth_sessions table
ALTER TABLE public.auth_sessions ENABLE ROW LEVEL SECURITY;

-- Enable RLS on beats table
ALTER TABLE public.beats ENABLE ROW LEVEL SECURITY;

-- Enable RLS on line_items table
ALTER TABLE public.line_items ENABLE ROW LEVEL SECURITY;

-- Enable RLS on payments table
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Enable RLS on playlists table
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;