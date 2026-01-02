-- Make task-screenshots bucket public so images can be viewed
-- This fixes the broken image links in task submissions
UPDATE storage.buckets 
SET public = true 
WHERE id = 'task-screenshots';