-- Phase 1: Clean up soundpack data model
-- Remove orphan beat records that should be soundpacks (category='Soundpack' but no soundpack_id)
DELETE FROM beats 
WHERE category = 'Soundpack' 
AND soundpack_id IS NULL;

-- Update soundpack item beats to have correct type and category
UPDATE beats 
SET 
  type = 'soundpack_item',
  category = 'Music Beat'
WHERE soundpack_id IS NOT NULL 
AND category = 'Soundpack';

-- Add comment for clarity
COMMENT ON COLUMN beats.soundpack_id IS 'Links beat to parent soundpack. Beats with soundpack_id are individual files within a soundpack, not standalone beats.';