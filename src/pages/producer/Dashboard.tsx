
import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useBeats } from "@/hooks/useBeats";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getProducerStats } from "@/lib/producerStats";

// Import refactored components
import { StatsCards } from "@/components/producer/dashboard/StatsCards";
import { AnalyticsCharts } from "@/components/producer/dashboard/AnalyticsCharts";
import { GenreDistribution } from "@/components/producer/dashboard/GenreDistribution";
import { RecentActivity } from "@/components/producer/dashboard/RecentActivity";
import { TopSellingBeats } from "@/components/producer/dashboard/TopSellingBeats";
import { BankDetailsCard } from "@/components/producer/dashboard/BankDetailsCard";
import { WalletDetailsCard } from "@/components/producer/dashboard/WalletDetailsCard";

export default function ProducerDashboard() {
  const { user, currency } = useAuth();
  const { beats, getProducerBeats } = useBeats();
  const { notifications } = useNotifications();
  const navigate = useNavigate();
  const [showBankDetails, setShowBankDetails] = useState(false);
  const [showWalletDetails, setShowWalletDetails] = useState(false);
  const [producerData, setProducerData] = useState<any>(null);
  const [isLoadingProducer, setIsLoadingProducer] = useState(true);
  const [stats, setStats] = useState(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  
  // Remove the refreshTrigger state that was causing continuous refreshes
  
  // Fetch producer data including bank details and subaccount info
  useEffect(() => {
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

        // Show wallet details form if wallet_address is not set up yet
        if (!data.wallet_address) {
          setShowWalletDetails(true);
          console.log("Wallet address not found, showing wallet details form");
        } else {
          console.log("Wallet address found:", data.wallet_address);
        }

        // Show bank details form if not set up yet
        if (!data.paystack_subaccount_code || !data.paystack_split_code) {
          setShowBankDetails(true);
        }
      } catch (error) {
        console.error("Error fetching producer data:", error);
      } finally {
        setIsLoadingProducer(false);
      }
    };

    fetchProducerData();
  }, [user]); // Only dependency is user, no refresh trigger

  // Fetch producer analytics data
  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;

      try {
        setIsLoadingStats(true);
        const selectedCurrency = currency === 'NGN' ? 'NGN' : 'USD';
        const producerStats = await getProducerStats(user.id, selectedCurrency);
        setStats(producerStats);
      } catch (error) {
        console.error("Error fetching producer stats:", error);
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchStats();
  }, [user, currency]); // Include currency to refetch when it changes

  // Remove the interval that was causing periodic refreshes

  const producerBeats = user ? getProducerBeats(user.id) : [];

  // Sort beats by purchase count in descending order
  const topSellingBeats = [...producerBeats]
    .sort((a, b) => (b.purchase_count || 0) - (a.purchase_count || 0))
    .slice(0, 5);

  // Get recent notifications for this producer
  const recentNotifications = notifications
    .filter((notification) => user && notification.recipient_id === user.id)
    .slice(0, 5);

  const handleWalletDetailsSubmitted = () => {
    setShowWalletDetails(false);
    // Fetch producer data again after wallet details are submitted
    if (user) {
      supabase
        .from("users")
        .select(
          "bank_code, account_number, verified_account_name, paystack_subaccount_code, paystack_split_code, wallet_address"
        )
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (data) {
            setProducerData(data);
          }
        });
    }
  };

  const handleBankDetailsSubmitted = () => {
    setShowBankDetails(false);
    // Fetch producer data again after bank details are submitted
    if (user) {
      supabase
        .from("users")
        .select(
          "bank_code, account_number, verified_account_name, paystack_subaccount_code, paystack_split_code, wallet_address"
        )
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (data) {
            setProducerData(data);
          }
        });
    }
  };

  return (
    <MainLayout>
      <div className="container py-8">
        <h1 className="text-2xl font-bold mb-6">Producer Dashboard</h1>

        {isLoadingProducer ? (
          <div className="text-center">Loading details...</div>
        ) : (
          <>
            {showWalletDetails && user && (
              <WalletDetailsCard
                userId={user.id}
                producerData={producerData}
                onSuccess={handleWalletDetailsSubmitted}
              />
            )}
            
            {showBankDetails && user && (
              <BankDetailsCard
                userId={user.id}
                producerData={producerData}
                onSuccess={handleBankDetailsSubmitted}
              />
            )}
          </>
        )}

        <StatsCards
          stats={stats}
          isLoadingStats={isLoadingStats}
          currency={currency}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <AnalyticsCharts
            stats={stats}
            isLoadingStats={isLoadingStats}
            currency={currency}
          />
          <GenreDistribution stats={stats} isLoadingStats={isLoadingStats} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <RecentActivity notifications={recentNotifications} />
          <TopSellingBeats beats={topSellingBeats} />
        </div>
      </div>
    </MainLayout>
  );
}
