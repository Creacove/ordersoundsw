-- Create announcements table for admin-managed site-wide messages
CREATE TABLE public.site_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.users(id)
);

-- Only one announcement can be active at a time
CREATE UNIQUE INDEX idx_single_active_announcement ON public.site_announcements (is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.site_announcements ENABLE ROW LEVEL SECURITY;

-- Public can read active announcements
CREATE POLICY "Anyone can view active announcements"
  ON public.site_announcements
  FOR SELECT
  USING (is_active = true);

-- Only admins can manage announcements
CREATE POLICY "Admins can manage announcements"
  ON public.site_announcements
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());