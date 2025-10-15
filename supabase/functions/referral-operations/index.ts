import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReferralStats {
  points: number;
  referralCount: number;
  referralCode: string;
  successfulReferrals: number;
}

interface Referral {
  id: string;
  referred_email: string;
  status: string;
  created_at: string;
  reward_points: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Get user from auth header
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Invalid token');
    }

    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    if (req.method === 'GET') {
      if (action === 'stats') {
        // Get referral stats for a user
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('referral_code, referral_points, referred_count')
          .eq('id', user.id)
          .single();

        if (userError) throw userError;

        // Count successful referrals
        const { count: successfulCount } = await supabase
          .from('referrals')
          .select('*', { count: 'exact', head: true })
          .eq('referrer_user_id', user.id)
          .eq('status', 'successful');

        const stats: ReferralStats = {
          points: userData.referral_points || 0,
          referralCount: userData.referred_count || 0,
          referralCode: userData.referral_code || '',
          successfulReferrals: successfulCount || 0
        };

        return new Response(JSON.stringify(stats), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (action === 'list') {
        // Get referral history
        const { data: referrals, error: refError } = await supabase
          .from('referrals')
          .select('id, referred_email, status, created_at, reward_points')
          .eq('referrer_user_id', user.id)
          .order('created_at', { ascending: false });

        if (refError) throw refError;

        return new Response(JSON.stringify(referrals || []), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    if (req.method === 'POST') {
      const body = await req.json();

      if (body.action === 'create') {
        // Create referral on signup
        const { referralCode, newUserId, newUserEmail } = body;

        // Find referrer by code
        const { data: referrer, error: refError } = await supabase
          .from('users')
          .select('id')
          .eq('referral_code', referralCode)
          .single();

        if (refError || !referrer) {
          return new Response(
            JSON.stringify({ error: 'Invalid referral code' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Prevent self-referral
        if (referrer.id === newUserId) {
          return new Response(
            JSON.stringify({ error: 'Cannot refer yourself' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Create referral record
        const { data: referral, error: createError } = await supabase
          .from('referrals')
          .insert({
            referrer_user_id: referrer.id,
            referred_user_id: newUserId,
            referred_email: newUserEmail,
            status: 'pending'
          })
          .select()
          .single();

        if (createError) throw createError;

        // Log the event
        await supabase.from('referral_logs').insert({
          event_type: 'referral_created',
          user_id: newUserId,
          referral_id: referral.id,
          metadata: { referrer_id: referrer.id, referral_code: referralCode }
        });

        return new Response(JSON.stringify({ success: true, referral }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (body.action === 'award') {
        // Award points when onboarding completes
        const { userId } = body;

        // Find pending referral for this user
        const { data: referral, error: findError } = await supabase
          .from('referrals')
          .select('id, referrer_user_id')
          .eq('referred_user_id', userId)
          .eq('status', 'pending')
          .single();

        if (findError || !referral) {
          return new Response(
            JSON.stringify({ success: false, message: 'No pending referral found' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Call the atomic award function
        const { data: result, error: awardError } = await supabase
          .rpc('award_referral_success', { referral_uuid: referral.id });

        if (awardError) throw awardError;

        const awardResult = result?.[0];

        // Log the success
        await supabase.from('referral_logs').insert({
          event_type: 'referral_success',
          user_id: userId,
          referral_id: referral.id,
          metadata: { 
            points_awarded: 10,
            referrer_id: awardResult?.referrer_id,
            total_points: awardResult?.total_points
          }
        });

        // Mark onboarding as complete
        await supabase
          .from('users')
          .update({ onboarding_completed: true })
          .eq('id', userId);

        return new Response(JSON.stringify({ 
          success: awardResult?.success || false,
          message: awardResult?.message || 'Unknown error',
          points: awardResult?.total_points || 0
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in referral-operations:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
