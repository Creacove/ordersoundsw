
import { useState, useEffect } from "react";
import { ReferralStatsCard } from "@/components/referrals/ReferralStatsCard";
import { ReferralLinkSection } from "@/components/referrals/ReferralLinkSection";
import { TasksSection } from "@/components/referrals/TasksSection";
import { ReferralRulesCard } from "@/components/referrals/ReferralRulesCard";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { ReferralStats, Referral } from "@/types/referral";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { Gift, ShieldCheck, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function InviteAndEarn() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [todaysPoints, setTodaysPoints] = useState(0);

  useEffect(() => {
    document.title = "Invite & Earn | OrderSOUNDS";
    
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);

        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.access_token) {
          setLoading(false);
          return;
        }

        const headers = {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        };

        const [statsResponse, listResponse, taskSubmissionsResponse] = await Promise.all([
          fetch(`https://uoezlwkxhbzajdivrlby.supabase.co/functions/v1/referral-operations?action=stats`, { headers }),
          fetch(`https://uoezlwkxhbzajdivrlby.supabase.co/functions/v1/referral-operations?action=list`, { headers }),
          fetch(`https://uoezlwkxhbzajdivrlby.supabase.co/functions/v1/daily-tasks-operations`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ action: 'my-submissions' })
          })
        ]);
        
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData);
        }

        let referralPointsToday = 0;
        let taskPointsToday = 0;

        if (listResponse.ok) {
          const refData = await listResponse.json();
          setReferrals(Array.isArray(refData) ? refData : []);
          
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          referralPointsToday = (Array.isArray(refData) ? refData : [])
            .filter((ref: Referral) => {
              const refDate = new Date(ref.created_at);
              refDate.setHours(0, 0, 0, 0);
              return ref.status === 'successful' && refDate.getTime() === today.getTime();
            })
            .reduce((sum: number, ref: Referral) => sum + (ref.reward_points || 0), 0);
        }

        if (taskSubmissionsResponse.ok) {
          const taskData = await taskSubmissionsResponse.json();
          const submissions = taskData.submissions || [];
          
          const twentyFourHoursAgo = new Date();
          twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
          
          taskPointsToday = submissions
            .filter((sub: any) => {
              if (sub.status !== 'approved' || !sub.reviewed_at) return false;
              const reviewedDate = new Date(sub.reviewed_at);
              return reviewedDate >= twentyFourHoursAgo;
            })
            .reduce((sum: number, sub: any) => sum + (sub.task?.points || 0), 0);
        }

        setTodaysPoints(referralPointsToday + taskPointsToday);
      } catch (error) {
        console.error('Error fetching referral data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, navigate]);

  if (loading) {
    return (
      <div className="container py-20 px-4 md:px-6">
        <div className="mx-auto flex min-h-[400px] max-w-xl flex-col items-center justify-center p-12 text-center rounded-[2.5rem] bg-white/[0.02] border border-white/5">
          <LoaderCircle className="h-10 w-10 animate-spin text-[#9A3BDC] mb-4" />
          <h2 className="text-2xl font-black italic tracking-tighter text-white uppercase">Loading...</h2>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="container py-20 px-4 md:px-6">
        <div className="max-w-md mx-auto p-12 rounded-[2.5rem] bg-white/[0.02] border border-white/5 flex flex-col items-center text-center">
          <ShieldCheck className="h-10 w-10 text-red-500/50 mb-6" />
          <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase mb-4">Something Went Wrong</h1>
          <p className="text-white/50 italic mb-8">We couldn't load your referral data. Please try again.</p>
          <Button onClick={() => window.location.reload()} className="h-12 px-8 rounded-xl font-bold bg-white text-black">Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 md:py-12 px-4 md:px-6 max-w-7xl">
      <div className="mb-12">
        <SectionTitle 
          title="Invite & Earn" 
          icon={<Gift className="h-6 w-6" />}
        />
        <p className="text-white/40 italic mt-2">Invite friends, complete tasks, and earn reward points.</p>
      </div>

      <div className="space-y-12">
        <ReferralStatsCard stats={stats} todaysPoints={todaysPoints} />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           <ReferralLinkSection referralCode={stats.referralCode} />
           <ReferralRulesCard />
        </div>

        <div className="relative p-[1px] rounded-[2.5rem] bg-gradient-to-br from-white/10 to-transparent">
          <div className="bg-[#030407] rounded-[2.4rem] p-8 md:p-12 overflow-hidden">
            <TasksSection />
          </div>
        </div>
      </div>
    </div>
  );
}
