-- Add link_url column to site_announcements table
ALTER TABLE site_announcements 
ADD COLUMN IF NOT EXISTS link_url TEXT;