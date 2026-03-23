
-- Extend the existing function to support different beat categories
CREATE OR REPLACE FUNCTION public.get_random_published_beats_by_category(
  beat_count integer DEFAULT 5,
  category text DEFAULT 'trending'
)
RETURNS TABLE(id uuid, title text, producer_id uuid)
LANGUAGE sql
STABLE
AS $$
  SELECT b.id, b.title, b.producer_id
  FROM public.beats b
  WHERE b.status = 'published'
  AND CASE 
    WHEN category = 'trending' THEN NOT b.is_trending
    WHEN category = 'featured' THEN NOT b.is_featured
    WHEN category = 'weekly_pick' THEN NOT b.is_weekly_pick
    ELSE true
  END
  ORDER BY RANDOM()
  LIMIT beat_count;
$$;

-- Create function to refresh featured beats (limit: 1 beat)
CREATE OR REPLACE FUNCTION public.refresh_featured_beats(beat_count integer DEFAULT 1)
RETURNS TABLE(id uuid, title text, producer_id uuid)
LANGUAGE plpgsql
AS $$
DECLARE
  selected_beats uuid[];
BEGIN
  -- Validate beat count (max 3 for featured)
  IF beat_count > 3 THEN
    RAISE EXCEPTION 'Maximum 3 featured beats allowed';
  END IF;

  -- Reset all featured beats
  UPDATE public.beats 
  SET is_featured = false 
  WHERE status = 'published' AND is_featured = true;

  -- Get random published beats that aren't already featured
  SELECT array_agg(b.id) INTO selected_beats
  FROM (
    SELECT b.id
    FROM public.beats b
    WHERE b.status = 'published'
    ORDER BY RANDOM()
    LIMIT beat_count
  ) b;

  -- Set selected beats as featured
  UPDATE public.beats 
  SET is_featured = true 
  WHERE id = ANY(selected_beats);

  -- Return the selected beats
  RETURN QUERY
  SELECT b.id, b.title, b.producer_id
  FROM public.beats b
  WHERE b.id = ANY(selected_beats);
END;
$$;

-- Create function to refresh weekly picks (limit: 5-7 beats)
CREATE OR REPLACE FUNCTION public.refresh_weekly_picks(beat_count integer DEFAULT 6)
RETURNS TABLE(id uuid, title text, producer_id uuid)
LANGUAGE plpgsql
AS $$
DECLARE
  selected_beats uuid[];
BEGIN
  -- Validate beat count (5-7 for weekly picks)
  IF beat_count < 5 OR beat_count > 7 THEN
    RAISE EXCEPTION 'Weekly picks must be between 5 and 7 beats';
  END IF;

  -- Reset all weekly picks
  UPDATE public.beats 
  SET is_weekly_pick = false 
  WHERE status = 'published' AND is_weekly_pick = true;

  -- Get random published beats that aren't already weekly picks
  SELECT array_agg(b.id) INTO selected_beats
  FROM (
    SELECT b.id
    FROM public.beats b
    WHERE b.status = 'published'
    ORDER BY RANDOM()
    LIMIT beat_count
  ) b;

  -- Set selected beats as weekly picks
  UPDATE public.beats 
  SET is_weekly_pick = true 
  WHERE id = ANY(selected_beats);

  -- Return the selected beats
  RETURN QUERY
  SELECT b.id, b.title, b.producer_id
  FROM public.beats b
  WHERE b.id = ANY(selected_beats);
END;
$$;
