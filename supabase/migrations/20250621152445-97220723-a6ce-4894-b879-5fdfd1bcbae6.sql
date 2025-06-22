
-- Add backup column for safe migration
ALTER TABLE public.beats 
ADD COLUMN cover_image_backup text;
