import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { ReferralStatsCard } from "@/components/referrals/ReferralStatsCard";
import { ReferralLinkSection } from "@/components/referrals/ReferralLinkSection";
import { TasksSection } from "@/components/referrals/TasksSection";
import { ReferralRulesCard } from "@/components/referrals/ReferralRulesCard";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { ReferralStats, Referral } from "@/types/referral";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";

export default function InviteAndEarn() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [todaysPoints, setTodaysPoints] = useState(0);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch session once
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.access_token) {
          setLoading(false);
          return;
        }

        const headers = {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        };

        // Fetch stats and referrals in parallel for faster loading
        const [statsResponse, listResponse] = await Promise.all([
          fetch(`https://uoezlwkxhbzajdivrlby.supabase.co/functions/v1/referral-operations?action=stats`, { headers }),
          fetch(`https://uoezlwkxhbzajdivrlby.supabase.co/functions/v1/referral-operations?action=list`, { headers })
        ]);
        
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData);
        }

        if (listResponse.ok) {
          const refData = await listResponse.json();
          setReferrals(Array.isArray(refData) ? refData : []);
          
          // Calculate today's points from successful referrals
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const pointsToday = (Array.isArray(refData) ? refData : [])
            .filter((ref: Referral) => {
              const refDate = new Date(ref.created_at);
              refDate.setHours(0, 0, 0, 0);
              return ref.status === 'successful' && refDate.getTime() === today.getTime();
            })
            .reduce((sum: number, ref: Referral) => sum + (ref.reward_points || 0), 0);
          
          setTodaysPoints(pointsToday);
        }
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
      <MainLayout>
        <div className="container py-8 max-w-6xl mx-auto">
          <Skeleton className="h-10 w-48 mb-8" />
          <div className="grid gap-4 md:grid-cols-3 mb-8">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <Skeleton className="h-64 mb-8" />
          <Skeleton className="h-96" />
        </div>
      </MainLayout>
    );
  }

  if (!stats) {
    return (
      <MainLayout>
        <div className="container py-8 max-w-6xl mx-auto text-center">
          <p>Unable to load referral data. Please try again later.</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container py-8 max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Invite & Earn</h1>
          <p className="text-muted-foreground">
            Share OrderSounds with friends and earn points for every successful referral
          </p>
        </div>

        <ReferralStatsCard stats={stats} todaysPoints={todaysPoints} />
        <ReferralLinkSection referralCode={stats.referralCode} />
        <TasksSection />
        <ReferralRulesCard />
      </div>
    </MainLayout>
  );
}
