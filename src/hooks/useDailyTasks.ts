import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DailyTask, TaskSubmission, TaskWithSubmission } from '@/types/dailyTasks';
import { toast } from 'sonner';

export const useDailyTasks = () => {
  const queryClient = useQueryClient();

  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['daily-tasks'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('daily-tasks-operations?action=list-tasks');

      if (error) throw error;
      return data.tasks as DailyTask[];
    },
  });

  const { data: submissions } = useQuery({
    queryKey: ['my-task-submissions'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('daily-tasks-operations?action=my-submissions');

      if (error) throw error;
      return data.submissions as TaskSubmission[];
    },
  });

  const tasksWithSubmissions: TaskWithSubmission[] = (tasks || []).map(task => ({
    ...task,
    submission: submissions?.find(s => s.task_id === task.id),
  }));

  const submitTaskMutation = useMutation({
    mutationFn: async ({ taskId, screenshotUrl }: { taskId: string; screenshotUrl: string }) => {
      const { data, error } = await supabase.functions.invoke('daily-tasks-operations', {
        body: {
          action: 'submit-task',
          task_id: taskId,
          screenshot_url: screenshotUrl,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-task-submissions'] });
      toast.success('Task submitted successfully! Awaiting admin review.');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to submit task');
    },
  });

  return {
    tasks: tasksWithSubmissions,
    isLoading: tasksLoading,
    submitTask: submitTaskMutation.mutate,
    isSubmitting: submitTaskMutation.isPending,
  };
};

export const useAdminTasks = () => {
  const queryClient = useQueryClient();

  const { data: pendingSubmissions, isLoading } = useQuery({
    queryKey: ['pending-task-submissions'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('daily-tasks-operations?action=pending-submissions');

      if (error) throw error;
      return data.submissions as TaskSubmission[];
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async (taskData: {
      title: string;
      description: string;
      points: number;
      action_url?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('daily-tasks-operations', {
        body: {
          action: 'create-task',
          ...taskData,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-tasks'] });
      toast.success('Task created successfully!');
    },
    onError: () => {
      toast.error('Failed to create task');
    },
  });

  const awardPointsMutation = useMutation({
    mutationFn: async (submissionId: string) => {
      const { data, error } = await supabase.functions.invoke('daily-tasks-operations', {
        body: {
          action: 'award-points',
          submission_id: submissionId,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-task-submissions'] });
      toast.success('Points awarded successfully!');
    },
    onError: () => {
      toast.error('Failed to award points');
    },
  });

  const rejectSubmissionMutation = useMutation({
    mutationFn: async ({ submissionId, notes }: { submissionId: string; notes: string }) => {
      const { data, error } = await supabase.functions.invoke('daily-tasks-operations', {
        body: {
          action: 'reject-submission',
          submission_id: submissionId,
          admin_notes: notes,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-task-submissions'] });
      toast.success('Submission rejected');
    },
    onError: () => {
      toast.error('Failed to reject submission');
    },
  });

  return {
    pendingSubmissions,
    isLoading,
    createTask: createTaskMutation.mutate,
    isCreating: createTaskMutation.isPending,
    awardPoints: awardPointsMutation.mutate,
    isAwarding: awardPointsMutation.isPending,
    rejectSubmission: rejectSubmissionMutation.mutate,
    isRejecting: rejectSubmissionMutation.isPending,
  };
};
