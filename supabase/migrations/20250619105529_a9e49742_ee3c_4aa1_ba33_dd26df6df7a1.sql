
-- Drop the problematic database functions with SQL ambiguity issues
DROP FUNCTION IF EXISTS public.refresh_featured_beats(integer);
DROP FUNCTION IF EXISTS public.refresh_weekly_picks(integer);

-- Update the existing function to be more generic (remove the NOT logic)
CREATE OR REPLACE FUNCTION public.get_random_published_beats(beat_count integer DEFAULT 5)
RETURNS TABLE(id uuid, title text, producer_id uuid)
LANGUAGE sql
STABLE
AS $$
  SELECT b.id, b.title, b.producer_id
  FROM public.beats b
  WHERE b.status = 'published'
  ORDER BY RANDOM()
  LIMIT beat_count;
$$;
