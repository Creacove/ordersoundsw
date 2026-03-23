-- Create daily_tasks table
CREATE TABLE daily_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  action_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on daily_tasks
ALTER TABLE daily_tasks ENABLE ROW LEVEL SECURITY;

-- Everyone can view active tasks
CREATE POLICY "Anyone can view active tasks"
  ON daily_tasks FOR SELECT
  USING (is_active = true);

-- Admins have full access
CREATE POLICY "Admins have full access to tasks"
  ON daily_tasks FOR ALL
  USING (is_admin());

-- Create task_submissions table
CREATE TABLE task_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES daily_tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  screenshot_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(task_id, user_id)
);

-- Enable RLS on task_submissions
ALTER TABLE task_submissions ENABLE ROW LEVEL SECURITY;

-- Users can view their own submissions
CREATE POLICY "Users can view own submissions"
  ON task_submissions FOR SELECT
  USING (user_id = auth.uid());

-- Users can create submissions
CREATE POLICY "Users can create submissions"
  ON task_submissions FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Admins can manage all submissions
CREATE POLICY "Admins can manage all submissions"
  ON task_submissions FOR ALL
  USING (is_admin());

-- Create storage bucket for task screenshots
INSERT INTO storage.buckets (id, name, public)
VALUES ('task-screenshots', 'task-screenshots', false);

-- Storage policies
CREATE POLICY "Users can upload their own screenshots"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'task-screenshots' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own screenshots"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'task-screenshots'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Admins can view all task screenshots"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'task-screenshots'
    AND is_admin()
  );

-- Function to award points for task completion
CREATE OR REPLACE FUNCTION award_task_points(
  submission_uuid UUID,
  admin_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sub RECORD;
  task_points INTEGER;
BEGIN
  -- Get submission details
  SELECT * INTO sub 
  FROM task_submissions 
  WHERE id = submission_uuid AND status = 'pending'
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Submission not found or already processed';
  END IF;
  
  -- Get task points
  SELECT points INTO task_points 
  FROM daily_tasks 
  WHERE id = sub.task_id;
  
  -- Update submission status
  UPDATE task_submissions
  SET 
    status = 'approved',
    reviewed_by = admin_user_id,
    reviewed_at = NOW()
  WHERE id = submission_uuid;
  
  -- Award points to user
  UPDATE users
  SET referral_points = referral_points + task_points
  WHERE id = sub.user_id;
  
  RETURN true;
END;
$$;