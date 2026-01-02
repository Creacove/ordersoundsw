-- Fix existing soundpack items to match their parent soundpack status
UPDATE beats 
SET status = CASE 
  WHEN EXISTS (
    SELECT 1 FROM soundpacks 
    WHERE soundpacks.id = beats.soundpack_id 
    AND soundpacks.published = true
  ) THEN 'published'
  ELSE 'draft'
END
WHERE beats.soundpack_id IS NOT NULL
AND beats.type = 'soundpack_item';

-- Clean up duplicate slug soundpacks (keep most recent)
DELETE FROM soundpacks
WHERE id NOT IN (
  SELECT DISTINCT ON (slug) id
  FROM soundpacks
  ORDER BY slug, created_at DESC
);