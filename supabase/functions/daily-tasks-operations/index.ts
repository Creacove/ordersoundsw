import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DailyTask {
  id: string;
  title: string;
  description: string;
  points: number;
  action_url?: string;
  is_active: boolean;
}

interface TaskSubmission {
  id: string;
  task_id: string;
  user_id: string;
  screenshot_url: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const authHeader = req.headers.get('Authorization')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse body for all requests
    const body = req.method === 'POST' ? await req.json() : {};
    const action = body.action;

    if (action === 'list-tasks') {
        const { data: tasks, error } = await supabase
          .from('daily_tasks')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (error) throw error;

        return new Response(JSON.stringify({ tasks }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    if (action === 'my-submissions') {
        const { data: submissions, error } = await supabase
          .from('task_submissions')
          .select(`
            *,
            task:daily_tasks(title, points)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        return new Response(JSON.stringify({ submissions }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    if (action === 'pending-submissions') {
        // Check if user is admin
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        if (userData?.role !== 'admin') {
          return new Response(JSON.stringify({ error: 'Admin access required' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { data: submissions, error } = await supabase
          .from('task_submissions')
          .select(`
            *,
            task:daily_tasks(title, points),
            user:users!task_submissions_user_id_fkey(full_name, email)
          `)
          .eq('status', 'pending')
          .order('created_at', { ascending: false });

        if (error) throw error;

        return new Response(JSON.stringify({ submissions }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    if (action === 'create-task') {
        // Check if user is admin
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        if (userData?.role !== 'admin') {
          return new Response(JSON.stringify({ error: 'Admin access required' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { data: task, error } = await supabase
          .from('daily_tasks')
          .insert({
            title: body.title,
            description: body.description,
            points: body.points,
            action_url: body.action_url,
            frequency: body.frequency || 'once',
            created_by: user.id,
          })
          .select()
          .single();

        if (error) throw error;

        return new Response(JSON.stringify({ task }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    if (action === 'submit-task') {
        // Get task frequency
        const { data: task, error: taskError } = await supabase
          .from('daily_tasks')
          .select('frequency')
          .eq('id', body.task_id)
          .single();

        if (taskError || !task) {
          return new Response(
            JSON.stringify({ error: 'Task not found' }), 
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Check existing approved submissions
        const { data: lastApproved } = await supabase
          .from('task_submissions')
          .select('reviewed_at')
          .eq('task_id', body.task_id)
          .eq('user_id', user.id)
          .eq('status', 'approved')
          .order('reviewed_at', { ascending: false })
          .limit(1)
          .single();

        if (lastApproved) {
          if (task.frequency === 'once') {
            return new Response(
              JSON.stringify({ error: 'This task can only be completed once' }), 
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          if (task.frequency === 'daily') {
            const hoursSince = (new Date().getTime() - new Date(lastApproved.reviewed_at).getTime()) / (1000 * 60 * 60);
            if (hoursSince < 24) {
              return new Response(
                JSON.stringify({ error: `You can complete this task again in ${Math.ceil(24 - hoursSince)} hours` }), 
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              );
            }
          }
        }

        const { data: submission, error } = await supabase
          .from('task_submissions')
          .insert({
            task_id: body.task_id,
            user_id: user.id,
            screenshot_url: body.screenshot_url,
          })
          .select()
          .single();

        if (error) throw error;

        return new Response(JSON.stringify({ submission }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    if (action === 'award-points') {
        // Check if user is admin
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        if (userData?.role !== 'admin') {
          return new Response(JSON.stringify({ error: 'Admin access required' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { data, error } = await supabase.rpc('award_task_points', {
          submission_uuid: body.submission_id,
          admin_user_id: user.id,
        });

        if (error) throw error;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    if (action === 'reject-submission') {
        // Check if user is admin
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        if (userData?.role !== 'admin') {
          return new Response(JSON.stringify({ error: 'Admin access required' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { error } = await supabase
          .from('task_submissions')
          .update({
            status: 'rejected',
            admin_notes: body.admin_notes,
            reviewed_by: user.id,
            reviewed_at: new Date().toISOString(),
          })
          .eq('id', body.submission_id);

        if (error) throw error;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
