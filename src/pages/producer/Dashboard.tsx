
import { useState, useEffect } from "react";
import { useBeats } from "@/hooks/useBeats";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";
import { supabase } from "@/integrations/supabase/client";
import { getProducerStats } from "@/lib/producerStats";
import { StatsCards } from "@/components/producer/dashboard/StatsCards";
import { AnalyticsCharts } from "@/components/producer/dashboard/AnalyticsCharts";
import { GenreDistribution } from "@/components/producer/dashboard/GenreDistribution";
import { RecentActivity } from "@/components/producer/dashboard/RecentActivity";
import { TopSellingBeats } from "@/components/producer/dashboard/TopSellingBeats";
import { BankDetailsCard } from "@/components/producer/dashboard/BankDetailsCard";
import { WalletDetailsCard } from "@/components/producer/dashboard/WalletDetailsCard";
import { Activity, LayoutDashboard, Sparkles } from "lucide-react";

export default function ProducerDashboard() {
  const { user, currency } = useAuth();
  const { getProducerBeats } = useBeats();
  const { notifications } = useNotifications();
  const [showBankDetails, setShowBankDetails] = useState(false);
  const [showWalletDetails, setShowWalletDetails] = useState(false);
  const [producerData, setProducerData] = useState<any>(null);
  const [isLoadingProducer, setIsLoadingProducer] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    document.title = "Studio Dashboard | OrderSOUNDS";
    
    const fetchProducerData = async () => {
      if (!user) return;

      try {
        setIsLoadingProducer(true);
        const { data, error } = await supabase
          .from("users")
          .select(
            "bank_code, account_number, verified_account_name, paystack_subaccount_code, paystack_split_code, wallet_address"
          )
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Error fetching producer data:", error);
          return;
        }

        setProducerData(data);

        if (!data.wallet_address) {
          setShowWalletDetails(true);
        }

        if (!data.paystack_subaccount_code || !data.paystack_split_code) {
          setShowBankDetails(true);
        }
      } catch (fetchError) {
        console.error("Error fetching producer data:", fetchError);
      } finally {
        setIsLoadingProducer(false);
      }
    };

    fetchProducerData();
  }, [user]);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;

      try {
        setIsLoadingStats(true);
        const selectedCurrency = currency === "NGN" ? "NGN" : "USD";
        const producerStats = await getProducerStats(user.id, selectedCurrency);
        setStats(producerStats);
      } catch (fetchError) {
        console.error("Error fetching producer stats:", fetchError);
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchStats();
  }, [user, currency]);

  const producerBeats = user ? getProducerBeats(user.id) : [];

  const topSellingBeats = [...producerBeats]
    .sort((a, b) => (b.purchase_count || 0) - (a.purchase_count || 0))
    .slice(0, 5);

  const recentNotifications = notifications
    .filter((notification) => user && notification.recipient_id === user.id)
    .slice(0, 5);

  const handleWalletDetailsSubmitted = () => {
    setShowWalletDetails(false);
    if (user) {
      supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single()
        .then(({ data }) => { if (data) setProducerData(data); });
    }
  };

  const handleBankDetailsSubmitted = () => {
    setShowBankDetails(false);
    if (user) {
      supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single()
        .then(({ data }) => { if (data) setProducerData(data); });
    }
  };

  return (
    <div className="container py-8 md:py-12 px-4 md:px-6 max-w-7xl relative overflow-hidden">
      {/* Background Aesthetics */}
      <div className="absolute top-0 right-0 w-[40vw] h-[40vh] bg-primary/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
      
      <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-8 relative z-10">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
              <LayoutDashboard size={20} className="text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white italic tracking-tighter uppercase leading-none">
              Studio <span className="text-primary">Command</span>
            </h1>
          </div>
          <p className="text-white/40 italic text-lg tracking-tight">Real-time performance metrics and studio activity.</p>
        </div>
        
        <div className="flex items-center gap-4 bg-white/[0.03] border border-white/5 rounded-2xl p-4 px-6 backdrop-blur-xl">
           <div className="flex flex-col items-end">
              <span className="text-[10px] font-black uppercase tracking-widest text-primary italic leading-none mb-1">Status: Operational</span>
              <span className="text-xs font-bold text-white italic tracking-tighter uppercase">Live Analytics Streaming</span>
           </div>
           <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Activity size={18} className="text-primary animate-pulse" />
           </div>
        </div>
      </div>

      <div className="space-y-16 relative z-10">
        {!isLoadingProducer && (showWalletDetails || showBankDetails) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-top-4 duration-700">
            {showWalletDetails && user && (
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-purple-600 rounded-[2.6rem] blur opacity-20 group-hover:opacity-40 transition duration-1000" />
                <div className="relative p-[1px] rounded-[2.5rem] bg-gradient-to-br from-white/10 to-transparent h-full">
                  <div className="bg-[#030407]/90 backdrop-blur-xl rounded-[2.4rem] p-4 h-full">
                     <WalletDetailsCard userId={user.id} producerData={producerData} onSuccess={handleWalletDetailsSubmitted} />
                  </div>
                </div>
              </div>
            )}

            {showBankDetails && user && (
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-[2.6rem] blur opacity-20 group-hover:opacity-40 transition duration-1000" />
                <div className="relative p-[1px] rounded-[2.5rem] bg-gradient-to-br from-white/10 to-transparent h-full">
                  <div className="bg-[#030407]/90 backdrop-blur-xl rounded-[2.4rem] p-4 h-full">
                     <BankDetailsCard userId={user.id} producerData={producerData} onSuccess={handleBankDetailsSubmitted} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="space-y-8">
          <div className="flex items-center gap-6">
            <h2 className="text-xs font-black uppercase tracking-widest text-white/20 italic whitespace-nowrap flex items-center gap-2">
              <Sparkles size={14} className="text-primary" />
              Core Metrics
            </h2>
            <div className="h-px w-full bg-gradient-to-r from-white/5 to-transparent" />
          </div>
          <StatsCards stats={stats} isLoadingStats={isLoadingStats} currency={currency} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-8">
            <div className="flex items-center gap-6">
              <h2 className="text-xs font-black uppercase tracking-widest text-white/20 italic whitespace-nowrap">Revenue Trends</h2>
              <div className="h-px w-full bg-gradient-to-r from-white/5 to-transparent" />
            </div>
            <div className="relative p-[1px] rounded-[2.5rem] bg-gradient-to-br from-white/10 to-transparent shadow-2xl">
              <div className="bg-[#030407]/40 rounded-[2.4rem] p-4 backdrop-blur-xl">
                <AnalyticsCharts stats={stats} isLoadingStats={isLoadingStats} currency={currency} />
              </div>
            </div>
          </div>
          <div className="space-y-8">
            <div className="flex items-center gap-6">
              <h2 className="text-xs font-black uppercase tracking-widest text-white/20 italic whitespace-nowrap">Catalog Mix</h2>
              <div className="h-px w-full bg-gradient-to-r from-white/5 to-transparent" />
            </div>
            <div className="relative p-[1px] rounded-[2.5rem] bg-gradient-to-br from-white/10 to-transparent shadow-2xl">
              <div className="bg-[#030407]/40 rounded-[2.4rem] p-4 backdrop-blur-xl h-full">
                <GenreDistribution stats={stats} isLoadingStats={isLoadingStats} />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-8">
            <div className="flex items-center gap-6">
              <h2 className="text-xs font-black uppercase tracking-widest text-white/20 italic whitespace-nowrap">Studio Feed</h2>
              <div className="h-px w-full bg-gradient-to-r from-white/5 to-transparent" />
            </div>
            <div className="relative p-[1px] rounded-[2.5rem] bg-gradient-to-br from-white/10 to-transparent shadow-2xl">
              <div className="bg-[#030407]/40 rounded-[2.4rem] p-4 backdrop-blur-xl">
                <RecentActivity notifications={recentNotifications} />
              </div>
            </div>
          </div>
          <div className="space-y-8">
            <div className="flex items-center gap-6">
              <h2 className="text-xs font-black uppercase tracking-widest text-white/20 italic whitespace-nowrap">Top Performing Projects</h2>
              <div className="h-px w-full bg-gradient-to-r from-white/5 to-transparent" />
            </div>
            <div className="relative p-[1px] rounded-[2.5rem] bg-gradient-to-br from-white/10 to-transparent shadow-2xl">
              <div className="bg-[#030407]/40 rounded-[2.4rem] p-4 backdrop-blur-xl">
                <TopSellingBeats beats={topSellingBeats} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
