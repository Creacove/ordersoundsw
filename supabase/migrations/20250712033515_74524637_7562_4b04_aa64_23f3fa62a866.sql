-- Add category column to beats table
ALTER TABLE public.beats 
ADD COLUMN category text DEFAULT 'Music Beat';

-- Set all existing beats to 'Music Beat' category
UPDATE public.beats 
SET category = 'Music Beat' 
WHERE category IS NULL;

-- Make category non-nullable after setting defaults
ALTER TABLE public.beats 
ALTER COLUMN category SET NOT NULL;