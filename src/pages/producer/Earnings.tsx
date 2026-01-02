import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DollarSign, TrendingUp, BarChart3, Calendar, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { getProducerStats, ProducerStats } from "@/lib/producerStats";
import { Skeleton } from "@/components/ui/skeleton";
import { BeatSalesTable } from "@/components/producer/dashboard/BeatSalesTable";
import { EarningsChart } from "@/components/producer/dashboard/EarningsChart";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { formatCurrency } from "@/utils/formatters";

type Payout = Database['public']['Tables']['payouts']['Row'];

export default function Earnings() {
    const { user, currency } = useAuth();
    const navigate = useNavigate();
    const [statsLoading, setStatsLoading] = useState(true);
    const [stats, setStats] = useState<ProducerStats | null>(null);
    const [payouts, setPayouts] = useState<Payout[]>([]);
    const [payoutsLoading, setPayoutsLoading] = useState(true);

    useEffect(() => {
        document.title = "Earnings | OrderSOUNDS";

        // Redirect to login if not authenticated or not a producer
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
                    // Get payouts for this producer
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

    // If not logged in or not a producer, show login prompt
    if (!user || user.role !== 'producer') {
        return (
            <MainLayout>
                <div className="container py-16">
                    <div className="text-center">
                        <h1 className="heading-responsive-md mb-4">Producer Access Required</h1>
                        <p className="text-responsive-base mb-4">You need to be logged in as a producer to access this page.</p>
                        <Button onClick={() => navigate('/login')}>Login</Button>
                    </div>
                </div>
            </MainLayout>
        );
    }

    // Format currency helper
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
                return <div className="flex items-center text-green-600 bg-green-50 px-2 py-1 rounded text-xs font-medium"><CheckCircle className="w-3 h-3 mr-1" /> Paid</div>;
            case 'pending':
                return <div className="flex items-center text-amber-600 bg-amber-50 px-2 py-1 rounded text-xs font-medium"><Clock className="w-3 h-3 mr-1" /> Pending</div>;
            case 'failed':
                return <div className="flex items-center text-red-600 bg-red-50 px-2 py-1 rounded text-xs font-medium"><AlertCircle className="w-3 h-3 mr-1" /> Failed</div>;
            default:
                return <div className="px-2 py-1 rounded text-xs bg-gray-100">{status}</div>;
        }
    };

    return (
        <MainLayout>
            <div className="container py-6 md:py-8 space-y-8">
                <div>
                    <h1 className="heading-responsive-lg text-3xl font-bold tracking-tight">Earnings</h1>
                    <p className="text-muted-foreground mt-2">Track your revenue, sales performance, and payouts.</p>
                </div>

                {/* Stats Cards Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            {statsLoading ? (
                                <Skeleton className="h-8 w-24" />
                            ) : (
                                <>
                                    <div className="text-2xl font-bold">{formatStatsCurrency(stats?.totalRevenue || 0)}</div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Lifetime earnings
                                    </p>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">This Month</CardTitle>
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            {statsLoading ? (
                                <Skeleton className="h-8 w-24" />
                            ) : (
                                <>
                                    <div className="text-2xl font-bold">
                                        {formatStatsCurrency(stats?.monthlyRevenue || 0)}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {stats && stats.revenueChange > 0 ? `+${stats.revenueChange}%` : `${stats?.revenueChange || 0}%`} from last month
                                    </p>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Sales</CardTitle>
                            <BarChart3 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            {statsLoading ? (
                                <Skeleton className="h-8 w-16" />
                            ) : (
                                <>
                                    <div className="text-2xl font-bold">{stats?.beatsSold || 0}</div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Total beats purchased
                                    </p>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Growth</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            {statsLoading ? (
                                <Skeleton className="h-8 w-16" />
                            ) : (
                                <>
                                    <div className="text-2xl font-bold">{stats?.salesChange || 0}%</div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Year over year growth
                                    </p>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 gap-4">
                    <EarningsChart data={stats?.revenueByMonth || []} loading={statsLoading} />
                </div>

                {/* Payouts Section */}
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Payouts</CardTitle>
                        <CardDescription>History of funds transferred to your bank account</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {payoutsLoading ? (
                            <div className="space-y-2">
                                <Skeleton className="h-8 w-full" />
                                <Skeleton className="h-8 w-full" />
                                <Skeleton className="h-8 w-full" />
                            </div>
                        ) : payouts.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Date</th>
                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Amount</th>
                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground text-right">Reference</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {payouts.map((payout) => (
                                            <tr key={payout.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                                <td className="p-4 align-middle">
                                                    {payout.payout_date ? new Date(payout.payout_date).toLocaleDateString() :
                                                        payout.created_at ? new Date(payout.created_at).toLocaleDateString() : 'N/A'}
                                                </td>
                                                <td className="p-4 align-middle font-medium">
                                                    {formatCurrency(payout.amount)}
                                                </td>
                                                <td className="p-4 align-middle">
                                                    {getStatusBadge(payout.status)}
                                                </td>
                                                <td className="p-4 align-middle text-right font-mono text-xs text-muted-foreground">
                                                    {payout.transaction_reference || '—'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8 text-center bg-muted/5 rounded-lg border border-dashed">
                                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                                    <Clock className="h-6 w-6 text-muted-foreground" />
                                </div>
                                <h3 className="font-semibold text-lg">No payouts yet</h3>
                                <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-4">
                                    Payouts will appear here once your earnings have been processed and sent to your bank account.
                                </p>
                                <Button variant="outline" size="sm" onClick={() => navigate('/producer/settings')}>
                                    Check Payout Settings
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Beat Sales Performance Table */}
                <div>
                    <BeatSalesTable producerId={user?.id || ''} currency={currency} />
                </div>
            </div>
        </MainLayout>
    );
}
