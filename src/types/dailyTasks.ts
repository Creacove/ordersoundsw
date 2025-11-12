export interface DailyTask {
  id: string;
  title: string;
  description: string;
  points: number;
  action_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TaskSubmission {
  id: string;
  task_id: string;
  user_id: string;
  screenshot_url: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  task?: {
    title: string;
    points: number;
  };
  user?: {
    full_name: string;
    email: string;
  };
}

export interface TaskWithSubmission extends DailyTask {
  submission?: TaskSubmission;
}
