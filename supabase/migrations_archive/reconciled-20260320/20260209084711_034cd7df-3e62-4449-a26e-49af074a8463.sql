-- Create a weighted random beats function that favors newer beats
-- Weights: <30 days = 3x, 30-90 days = 2x, >90 days = 1x

CREATE OR REPLACE FUNCTION public.get_weighted_random_beats(
  beat_count integer DEFAULT 5,
  category text DEFAULT 'trending'
)
RETURNS TABLE(id uuid, title text, producer_id uuid)
LANGUAGE sql
STABLE
AS $function$
  WITH weighted_beats AS (
    SELECT 
      b.id,
      b.title,
      b.producer_id,
      -- Weight based on upload date recency
      CASE
        WHEN b.upload_date >= NOW() - INTERVAL '30 days' THEN 3.0
        WHEN b.upload_date >= NOW() - INTERVAL '90 days' THEN 2.0
        ELSE 1.0
      END AS weight,
      -- Random value for sorting
      RANDOM() as rand_val
    FROM public.beats b
    WHERE b.status = 'published'
    -- Exclude beats that already have the target status
    AND CASE 
      WHEN category = 'trending' THEN NOT COALESCE(b.is_trending, false)
      WHEN category = 'featured' THEN NOT COALESCE(b.is_featured, false)
      WHEN category = 'weekly_pick' THEN NOT COALESCE(b.is_weekly_pick, false)
      ELSE true
    END
  )
  SELECT 
    wb.id,
    wb.title,
    wb.producer_id
  FROM weighted_beats wb
  -- Order by weight * random to give weighted probability
  ORDER BY wb.weight * wb.rand_val DESC
  LIMIT beat_count;
$function$;