-- Add frequency column to daily_tasks
ALTER TABLE daily_tasks 
ADD COLUMN frequency text NOT NULL DEFAULT 'once' 
CHECK (frequency IN ('once', 'daily', 'unlimited'));

-- Drop unique constraint to allow multiple submissions
ALTER TABLE task_submissions 
DROP CONSTRAINT IF EXISTS task_submissions_task_id_user_id_key;