import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, BarChart3, Calendar, Music } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { getProducerRoyaltySplits } from "@/lib/beatStorage";
import { getProducerStats, ProducerStats } from "@/lib/producerStats";
import { RoyaltySplit } from "@/types";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

export default function Royalties() {
  const { user, currency } = useAuth();
  const navigate = useNavigate();
  const [royaltySplits, setRoyaltySplits] = useState<RoyaltySplit[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [stats, setStats] = useState<ProducerStats | null>(null);
  const isMobile = useIsMobile();
  
  useEffect(() => {
    document.title = "Royalty Splits | OrderSOUNDS";
    
    // Redirect to login if not authenticated or not a producer
    if (!user) {
      navigate('/login', { state: { from: '/producer/royalties' } });
    } else if (user.role !== 'producer') {
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchRoyaltySplits = async () => {
      if (user && user.id) {
        setLoading(true);
        try {
          const splits = await getProducerRoyaltySplits(user.id);
          setRoyaltySplits(splits);
        } catch (error) {
          console.error("Error fetching royalty splits:", error);
        } finally {
          setLoading(false);
        }
      }
    };
    
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
    
    fetchRoyaltySplits();
    fetchProducerStats();
  }, [user]);

  // Group splits by beat
  const beatSplits = royaltySplits.reduce((acc, split) => {
    if (!acc[split.beat_id]) {
      acc[split.beat_id] = {
        beatId: split.beat_id,
        beatTitle: split.beat_title,
        beatCoverImage: split.beat_cover_image,
        splits: []
      };
    }
    acc[split.beat_id].splits.push(split);
    return acc;
  }, {} as Record<string, { beatId: string; beatTitle: string; beatCoverImage: string | null; splits: RoyaltySplit[] }>);

  const groupedSplits = Object.values(beatSplits);

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
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: currency === 'USD' ? 2 : 0,
      maximumFractionDigits: currency === 'USD' ? 2 : 0,
    }).format(amount || 0);
  };

  return (
    <MainLayout>
      <div className="container py-6 md:py-8">
        <h1 className="heading-responsive-lg mb-4 md:mb-8">Royalty Splits & Earnings</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 section-mobile-spacing">
          {/* Stats Cards */}
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
                  <div className="text-xl font-bold">{formatCurrency(stats?.totalRevenue || 0)}</div>
                  <p className="text-sm text-muted-foreground">
                    Lifetime earnings from your beats
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
              <CardTitle className="text-sm font-medium">Sales</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-xl font-bold">{stats?.beatsSold || 0}</div>
                  <p className="text-sm text-muted-foreground">
                    Total beats purchased
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
                    Year over year growth
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Add margin-top on desktop to create spacing between stats and splits */}
        <Card className="mt-6 md:mt-10">
          <CardHeader>
            <CardTitle className="text-xl md:text-2xl">Royalty Splits</CardTitle>
            <CardDescription className="text-sm">Manage splits with collaborators on your beats</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-6">
                {[1, 2].map((index) => (
                  <div key={index} className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-12 w-12 rounded-md" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </div>
                    <Skeleton className="h-24 w-full" />
                  </div>
                ))}
              </div>
            ) : groupedSplits.length > 0 ? (
              <div className="space-y-6 md:space-y-8">
                {groupedSplits.map((beatGroup) => (
                  <div key={beatGroup.beatId} className="border rounded-lg card-mobile-padding">
                    <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-4">
                      {beatGroup.beatCoverImage ? (
                        <img 
                          src={beatGroup.beatCoverImage} 
                          alt={beatGroup.beatTitle}
                          className="h-12 w-12 md:h-16 md:w-16 object-cover rounded-md" 
                        />
                      ) : (
                        <div className="h-12 w-12 md:h-16 md:w-16 rounded-md bg-muted flex items-center justify-center">
                          <Music className="h-6 w-6 md:h-8 md:w-8 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <h3 className="text-base md:text-lg font-semibold leading-tight line-clamp-1">{beatGroup.beatTitle}</h3>
                        <p className="text-sm text-muted-foreground">
                          {beatGroup.splits.length} collaborator{beatGroup.splits.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-3 md:space-y-4">
                      {beatGroup.splits.map((split) => (
                        <div key={split.id} className="flex items-center gap-2 md:gap-4">
                          <Avatar className="h-8 w-8 md:h-10 md:w-10 border">
                            <div className="flex items-center justify-center h-full w-full bg-primary/10 text-primary font-medium text-xs md:text-sm">
                              {split.collaborator_name.substring(0, 2).toUpperCase()}
                            </div>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between mb-1 items-center">
                              <div className="truncate pr-2">
                                <span className="font-medium text-sm md:text-base">{split.collaborator_name}</span>
                                <span className="text-sm text-muted-foreground ml-1 md:ml-2 hidden xs:inline">({split.collaborator_role})</span>
                              </div>
                              <span className="font-bold text-sm md:text-base whitespace-nowrap">{split.percentage}%</span>
                            </div>
                            <div className="xs:hidden text-xs text-muted-foreground mb-1">
                              {split.collaborator_role}
                            </div>
                            <Progress value={split.percentage} className="h-1.5 md:h-2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 md:py-10">
                <p className="text-base text-muted-foreground mb-4">You don't have any royalty splits set up yet</p>
                <Button variant="outline" onClick={() => navigate('/producer/beats')}>
                  Set Up Splits
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
