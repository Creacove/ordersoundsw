
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DollarSign, TrendingUp, BarChart3, Calendar, Clock } from "lucide-react";
import { getProducerStats, ProducerStats } from "@/lib/producerStats";
import { Skeleton } from "@/components/ui/skeleton";
import { BeatSalesTable } from "@/components/producer/dashboard/BeatSalesTable";
import { EarningsChart } from "@/components/producer/dashboard/EarningsChart";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { formatCurrency } from "@/utils/formatters";
import { SectionTitle } from "@/components/ui/SectionTitle";

type Payout = Database['public']['Tables']['payouts']['Row'];

export default function Earnings() {
    const { user, currency } = useAuth();
    const navigate = useNavigate();
    const [statsLoading, setStatsLoading] = useState(true);
    const [stats, setStats] = useState<ProducerStats | null>(null);
    const [payouts, setPayouts] = useState<Payout[]>([]);
    const [payoutsLoading, setPayoutsLoading] = useState(true);

    useEffect(() => {
        document.title = "Earnings Dashboard | OrderSOUNDS";

        if (!user) {
            navigate('/login', { state: { from: '/producer/earnings' } });
        } else if (user.role !== 'producer') {
            navigate('/');
        }
    }, [user, navigate]);

    useEffect(() => {
        const fetchProducerStats = async () => {
            if (user && user.id) {
                setStatsLoading(true);
                try {
                    const selectedCurrency = currency === 'NGN' ? 'NGN' : 'USD';
                    const producerStats = await getProducerStats(user.id, selectedCurrency);
                    setStats(producerStats);
                } catch (error) {
                    console.error("Error fetching producer stats:", error);
                } finally {
                    setStatsLoading(false);
                }
            }
        };

        const fetchPayouts = async () => {
            if (user && user.id) {
                setPayoutsLoading(true);
                try {
                    const { data: payoutsData, error: payoutsError } = await supabase
                        .from('payouts')
                        .select('*')
                        .eq('producer_id', user.id)
                        .order('created_at', { ascending: false })
                        .limit(10);

                    if (payoutsError) throw payoutsError;
                    setPayouts(payoutsData || []);
                } catch (error) {
                    console.error("Error fetching payouts:", error);
                } finally {
                    setPayoutsLoading(false);
                }
            }
        };

        fetchProducerStats();
        fetchPayouts();
    }, [user, currency]);

    if (!user || user.role !== 'producer') {
        return null;
    }

    const formatStatsCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: currency === 'USD' ? 2 : 0,
            maximumFractionDigits: currency === 'USD' ? 2 : 0,
        }).format(amount || 0);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'successful':
            case 'completed':
                return <Badge className="bg-emerald-500/10 text-emerald-500 border-none rounded-full px-3 py-0.5 font-bold uppercase italic tracking-widest text-[9px]">Completed</Badge>;
            case 'pending':
                return <Badge className="bg-yellow-500/10 text-yellow-500 border-none rounded-full px-3 py-0.5 font-bold uppercase italic tracking-widest text-[9px]">Pending</Badge>;
            case 'failed':
                return <Badge className="bg-red-500/10 text-red-500 border-none rounded-full px-3 py-0.5 font-bold uppercase italic tracking-widest text-[9px]">Failed</Badge>;
            default:
                return <Badge className="bg-white/5 text-white/40 border-none rounded-full px-3 py-0.5 font-bold uppercase italic tracking-widest text-[9px]">{status}</Badge>;
        }
    };

    return (
        <div className="container py-8 md:py-12 px-4 md:px-6 max-w-7xl">
            <div className="mb-12">
                <SectionTitle 
                  title="Earnings Dashboard" 
                  icon={<DollarSign className="h-6 w-6" />}
                />
                <p className="text-white/40 italic mt-2 text-lg">Detailed overview of your sales and payouts.</p>
            </div>

            <div className="space-y-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/30 italic">Total Revenue</span>
                            <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-[#9A3BDC]">
                                <DollarSign size={16} />
                            </div>
                        </div>
                        {statsLoading ? <Skeleton className="h-8 w-24 bg-white/5" /> : (
                            <div>
                                <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">{formatStatsCurrency(stats?.totalRevenue || 0)}</h3>
                                <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest italic mt-1">Lifetime Earnings</p>
                            </div>
                        )}
                    </div>

                    <div className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/30 italic">This Month</span>
                            <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-[#9A3BDC]">
                                <Calendar size={16} />
                            </div>
                        </div>
                        {statsLoading ? <Skeleton className="h-8 w-24 bg-white/5" /> : (
                            <div>
                                <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">{formatStatsCurrency(stats?.monthlyRevenue || 0)}</h3>
                                <div className="flex items-center gap-1 mt-1">
                                    <TrendingUp size={10} className={stats && stats.revenueChange >= 0 ? "text-emerald-500" : "text-red-500"} />
                                    <p className={`text-[10px] font-bold uppercase tracking-widest italic ${stats && stats.revenueChange >= 0 ? "text-emerald-500/50" : "text-red-500/50"}`}>
                                        {stats && stats.revenueChange >= 0 ? `+${stats.revenueChange}%` : `${stats?.revenueChange || 0}%`} Growth
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/30 italic">Beats Sold</span>
                            <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-[#9A3BDC]">
                                <BarChart3 size={16} />
                            </div>
                        </div>
                        {statsLoading ? <Skeleton className="h-8 w-16 bg-white/5" /> : (
                            <div>
                                <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">{stats?.beatsSold || 0}</h3>
                                <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest italic mt-1">Total Sales</p>
                            </div>
                        )}
                    </div>

                    <div className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/30 italic">Sales Growth</span>
                            <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-[#9A3BDC]">
                                <TrendingUp size={16} />
                            </div>
                        </div>
                        {statsLoading ? <Skeleton className="h-8 w-16 bg-white/5" /> : (
                            <div>
                                <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">{stats?.salesChange || 0}%</h3>
                                <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest italic mt-1">Yearly Growth</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-10">
                    <div className="flex items-center gap-8">
                        <h2 className="text-sm font-black uppercase tracking-widest text-white/20 italic whitespace-nowrap">Revenue History</h2>
                        <div className="h-px w-full bg-white/5" />
                    </div>
                    <div className="relative p-[1px] rounded-[2.5rem] bg-gradient-to-br from-white/10 to-transparent">
                      <div className="bg-[#030407] rounded-[2.4rem] p-8 md:p-12 overflow-hidden">
                        <EarningsChart data={stats?.revenueByMonth || []} loading={statsLoading} />
                      </div>
                    </div>
                </div>

                <div className="space-y-10">
                    <div className="flex items-center gap-8">
                        <h2 className="text-sm font-black uppercase tracking-widest text-white/20 italic whitespace-nowrap">Payout History</h2>
                        <div className="h-px w-full bg-white/5" />
                    </div>
                    <div className="relative p-[1px] rounded-[2.5rem] bg-gradient-to-br from-white/10 to-transparent">
                      <div className="bg-[#030407] rounded-[2.4rem] p-8 overflow-hidden">
                        {payoutsLoading ? (
                            <div className="space-y-4">
                                <Skeleton className="h-16 w-full rounded-2xl bg-white/5" />
                                <Skeleton className="h-16 w-full rounded-2xl bg-white/5" />
                                <Skeleton className="h-16 w-full rounded-2xl bg-white/5" />
                            </div>
                        ) : payouts.length > 0 ? (
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                  <thead>
                                      <tr className="border-b border-white/5">
                                          <th className="h-14 px-4 text-left align-middle font-black uppercase italic tracking-widest text-white/30 text-[10px]">Date</th>
                                          <th className="h-14 px-4 text-left align-middle font-black uppercase italic tracking-widest text-white/30 text-[10px]">Amount</th>
                                          <th className="h-14 px-4 text-left align-middle font-black uppercase italic tracking-widest text-white/30 text-[10px]">Status</th>
                                          <th className="h-14 px-4 text-right align-middle font-black uppercase italic tracking-widest text-white/30 text-[10px]">Reference</th>
                                      </tr>
                                  </thead>
                                  <tbody>
                                      {payouts.map((payout) => (
                                          <tr key={payout.id} className="border-b border-white/5 transition-colors hover:bg-white/[0.02]">
                                              <td className="p-6 align-middle text-white/40 font-bold italic">
                                                  {payout.payout_date ? new Date(payout.payout_date).toLocaleDateString() :
                                                      payout.created_at ? new Date(payout.created_at).toLocaleDateString() : 'N/A'}
                                              </td>
                                              <td className="p-6 align-middle font-black text-white italic tracking-tighter text-base">
                                                  {formatCurrency(payout.amount)}
                                              </td>
                                              <td className="p-6 align-middle">
                                                  {getStatusBadge(payout.status)}
                                              </td>
                                              <td className="p-6 align-middle text-right font-mono text-[10px] text-white/20 italic">
                                                  {payout.transaction_reference || '—'}
                                              </td>
                                          </tr>
                                      ))}
                                  </tbody>
                              </table>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-center bg-white/[0.01] rounded-[2rem] border border-dashed border-white/5">
                                <div className="h-16 w-16 rounded-3xl bg-white/5 flex items-center justify-center mb-6">
                                    <Clock className="h-8 w-8 text-white/10" />
                                </div>
                                <h3 className="font-black text-white italic tracking-tighter uppercase text-xl mb-2">No Payouts Yet</h3>
                                <p className="text-white/30 italic max-w-sm mb-8 px-4">
                                    Your payout history is empty. Once you've earned enough, payouts will be processed to your linked account.
                                </p>
                                <Button variant="outline" className="h-12 rounded-xl border-white/10 bg-white/5 text-white font-bold px-8 hover:bg-white/10 transition-all" onClick={() => navigate('/producer/settings')}>
                                    Update Payment Info
                                </Button>
                            </div>
                        )}
                      </div>
                    </div>
                </div>

                <div className="space-y-10">
                    <div className="flex items-center gap-8">
                        <h2 className="text-sm font-black uppercase tracking-widest text-white/20 italic whitespace-nowrap">Beat Sales</h2>
                        <div className="h-px w-full bg-white/5" />
                    </div>
                    <BeatSalesTable producerId={user?.id || ''} currency={currency} />
                </div>
            </div>
        </div>
    );
}

const Badge = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${className}`}>
    {children}
  </span>
);
