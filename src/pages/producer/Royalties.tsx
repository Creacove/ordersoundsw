
import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, BarChart3, Calendar, Music, Eye } from "lucide-react";
import { getProducerStats, ProducerStats } from "@/lib/producerStats";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import { Badge } from "@/components/ui/badge";

interface SoldBeat {
  id: string;
  title: string;
  cover_image_url: string | null;
  sales_count: number;
  total_revenue: number;
  currency_breakdown: {
    ngn: number;
    usd: number;
  };
}

export default function Royalties() {
  const { user, currency } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [stats, setStats] = useState<ProducerStats | null>(null);
  const [soldBeats, setSoldBeats] = useState<SoldBeat[]>([]);
  const [selectedBeatRoyalties, setSelectedBeatRoyalties] = useState<string | null>(null);
  const [royaltyData, setRoyaltyData] = useState<any[]>([]);
  const isMobile = useIsMobile();
  
  useEffect(() => {
    document.title = "Earnings & Royalties | OrderSOUNDS";
    
    // Redirect to login if not authenticated or not a producer
    if (!user) {
      navigate('/login', { state: { from: '/producer/royalties' } });
    } else if (user.role !== 'producer') {
      navigate('/');
    }
  }, [user, navigate]);

  // Fetch sold beats with earnings data
  useEffect(() => {
    const fetchSoldBeats = async () => {
      if (!user?.id) return;
      
      setLoading(true);
      try {
        // Get beats that have completed sales
        const { data: salesData, error } = await supabase
          .from('user_purchased_beats')
          .select(`
            beat_id,
            beats!inner(
              id,
              title,
              cover_image_url,
              producer_id
            ),
            orders!inner(
              total_price,
              currency_used,
              status
            )
          `)
          .eq('beats.producer_id', user.id)
          .eq('orders.status', 'completed');

        if (error) throw error;

        // Process the data to get sold beats with earnings
        const beatSalesMap: Record<string, {
          beat: any;
          sales_count: number;
          total_revenue: number;
          currency_breakdown: { ngn: number; usd: number };
        }> = {};

        salesData?.forEach(sale => {
          const beatId = sale.beat_id;
          const beat = sale.beats;
          const order = sale.orders as any;
          
          if (!beatSalesMap[beatId]) {
            beatSalesMap[beatId] = {
              beat,
              sales_count: 0,
              total_revenue: 0,
              currency_breakdown: { ngn: 0, usd: 0 }
            };
          }
          
          beatSalesMap[beatId].sales_count += 1;
          beatSalesMap[beatId].total_revenue += order.total_price || 0;
          
          if (order.currency_used === 'NGN') {
            beatSalesMap[beatId].currency_breakdown.ngn += order.total_price || 0;
          } else if (order.currency_used === 'USD') {
            beatSalesMap[beatId].currency_breakdown.usd += order.total_price || 0;
          }
        });

        // Convert to array and sort by revenue
        const soldBeatsData = Object.values(beatSalesMap)
          .map(data => ({
            id: data.beat.id,
            title: data.beat.title,
            cover_image_url: data.beat.cover_image_url,
            sales_count: data.sales_count,
            total_revenue: data.total_revenue,
            currency_breakdown: data.currency_breakdown
          }))
          .sort((a, b) => b.total_revenue - a.total_revenue);

        setSoldBeats(soldBeatsData);
      } catch (error) {
        console.error("Error fetching sold beats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSoldBeats();
  }, [user]);

  // Fetch producer stats
  useEffect(() => {
    const fetchProducerStats = async () => {
      if (user && user.id) {
        setStatsLoading(true);
        try {
          const producerStats = await getProducerStats(user.id);
          setStats(producerStats);
        } catch (error) {
          console.error("Error fetching producer stats:", error);
        } finally {
          setStatsLoading(false);
        }
      }
    };
    
    fetchProducerStats();
  }, [user]);

  // Fetch royalty splits for selected beat
  const fetchRoyaltyData = async (beatId: string) => {
    try {
      const { data, error } = await supabase
        .from('royalty_splits')
        .select('*')
        .eq('beat_id', beatId);
      
      if (error) throw error;
      setRoyaltyData(data || []);
    } catch (error) {
      console.error("Error fetching royalty data:", error);
      setRoyaltyData([]);
    }
  };

  const handleViewRoyalties = (beatId: string) => {
    if (selectedBeatRoyalties === beatId) {
      setSelectedBeatRoyalties(null);
      setRoyaltyData([]);
    } else {
      setSelectedBeatRoyalties(beatId);
      fetchRoyaltyData(beatId);
    }
  };

  // Filter sold beats by currency if USD is selected
  const filteredSoldBeats = currency === 'USD' 
    ? soldBeats.filter(beat => beat.currency_breakdown.usd > 0)
    : soldBeats;

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

  // Format currency using the global currency from AuthContext
  const formatCurrency = (amount: number, currencyCode?: string) => {
    const targetCurrency = currencyCode || currency;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: targetCurrency,
      minimumFractionDigits: targetCurrency === 'USD' ? 2 : 0,
      maximumFractionDigits: targetCurrency === 'USD' ? 2 : 0,
    }).format(amount || 0);
  };

  return (
    <MainLayout>
      <div className="container py-6 md:py-8">
        <h1 className="heading-responsive-lg mb-4 md:mb-8">Earnings & Royalties</h1>
        
        {/* Earnings Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 section-mobile-spacing">
          <Card className="card-mobile-padding">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-xl font-bold">
                    {currency === 'USD' 
                      ? formatCurrency(filteredSoldBeats.reduce((sum, beat) => sum + beat.currency_breakdown.usd, 0), 'USD')
                      : formatCurrency(stats?.totalRevenue || 0)
                    }
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {currency === 'USD' ? 'From USDC payments' : 'Lifetime earnings'}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
          
          <Card className="card-mobile-padding">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Beats Sold</CardTitle>
              <Music className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading || loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-xl font-bold">
                    {currency === 'USD' 
                      ? filteredSoldBeats.reduce((sum, beat) => sum + (beat.currency_breakdown.usd > 0 ? beat.sales_count : 0), 0)
                      : filteredSoldBeats.reduce((sum, beat) => sum + beat.sales_count, 0)
                    }
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {currency === 'USD' ? 'USDC purchases' : 'Total completed sales'}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
          
          <Card className="card-mobile-padding">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-xl font-bold">
                    {formatCurrency(stats?.monthlyRevenue || 0)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {stats && stats.revenueChange > 0 ? `+${stats.revenueChange}%` : `${stats?.revenueChange || 0}%`} from last month
                  </p>
                </>
              )}
            </CardContent>
          </Card>
          
          <Card className="card-mobile-padding">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Growth</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-xl font-bold">{stats?.salesChange || 0}%</div>
                  <p className="text-sm text-muted-foreground">
                    Sales growth rate
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Sold Beats with Earnings */}
        <Card className="mt-6 md:mt-10">
          <CardHeader>
            <CardTitle className="text-xl md:text-2xl">Beats with Sales</CardTitle>
            <CardDescription className="text-sm">
              Your beats that have generated revenue 
              {currency === 'USD' && ' (filtered by USDC payments)'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((index) => (
                  <div key={index} className="flex items-center gap-4">
                    <Skeleton className="h-16 w-16 rounded-md" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredSoldBeats.length > 0 ? (
              <div className="space-y-4">
                {filteredSoldBeats.map((beat) => (
                  <div key={beat.id} className="border rounded-lg p-4">
                    <div className="flex items-center gap-4 mb-3">
                      {beat.cover_image_url ? (
                        <img 
                          src={beat.cover_image_url} 
                          alt={beat.title}
                          className="h-16 w-16 object-cover rounded-md" 
                        />
                      ) : (
                        <div className="h-16 w-16 rounded-md bg-muted flex items-center justify-center">
                          <Music className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold">{beat.title}</h3>
                        <div className="flex items-center gap-4 mt-1">
                          <Badge variant="secondary">
                            {currency === 'USD' && beat.currency_breakdown.usd > 0
                              ? `${Math.floor(beat.currency_breakdown.usd / (beat.currency_breakdown.usd / beat.sales_count))} USDC sales`
                              : `${beat.sales_count} sales`
                            }
                          </Badge>
                          <span className="font-semibold text-lg">
                            {currency === 'USD' 
                              ? formatCurrency(beat.currency_breakdown.usd, 'USD')
                              : formatCurrency(beat.total_revenue)
                            }
                          </span>
                        </div>
                        {currency !== 'USD' && beat.currency_breakdown.usd > 0 && (
                          <div className="text-sm text-muted-foreground mt-1">
                            NGN: {formatCurrency(beat.currency_breakdown.ngn, 'NGN')} | 
                            USD: {formatCurrency(beat.currency_breakdown.usd, 'USD')}
                          </div>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewRoyalties(beat.id)}
                        className="flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        {selectedBeatRoyalties === beat.id ? 'Hide' : 'View'} Royalties
                      </Button>
                    </div>
                    
                    {/* Royalty splits for selected beat */}
                    {selectedBeatRoyalties === beat.id && (
                      <div className="mt-4 p-4 bg-muted/50 rounded-md">
                        {royaltyData.length > 0 ? (
                          <div className="space-y-2">
                            <h4 className="font-medium">Royalty Splits:</h4>
                            {royaltyData.map((split, index) => (
                              <div key={index} className="flex justify-between items-center">
                                <span>{split.collaborator_name} ({split.collaborator_role})</span>
                                <span className="font-medium">{split.percentage}%</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            No royalty splits configured for this beat.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-base text-muted-foreground mb-4">
                  {currency === 'USD' 
                    ? "You don't have any USDC sales yet"
                    : "You don't have any sold beats yet"
                  }
                </p>
                <Button variant="outline" onClick={() => navigate('/producer/beats')}>
                  Upload Beats
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
