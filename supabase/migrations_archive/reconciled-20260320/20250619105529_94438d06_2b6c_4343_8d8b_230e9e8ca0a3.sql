
-- Create a function to get random published beats for trending selection
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
