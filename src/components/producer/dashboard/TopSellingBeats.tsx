
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Beat } from "@/types";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface TopSellingBeatsProps {
  beats: Beat[];
}

interface BeatSalesData {
  beatId: string;
  completedSales: number;
}

export function TopSellingBeats({ beats }: TopSellingBeatsProps) {
  const navigate = useNavigate();
  const { currency } = useAuth();
  const [salesData, setSalesData] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);

  // Fetch actual completed sales data
  useEffect(() => {
    const fetchSalesData = async () => {
      if (beats.length === 0) {
        setLoading(false);
        return;
      }

      try {
        const beatIds = beats.map(beat => beat.id);
        
        const { data: completedSales, error } = await supabase
          .from('user_purchased_beats')
          .select(`
            beat_id,
            orders!inner(status)
          `)
          .in('beat_id', beatIds)
          .eq('orders.status', 'completed');

        if (error) {
          console.error('Error fetching sales data:', error);
          setLoading(false);
          return;
        }

        // Count completed sales per beat
        const salesCount = new Map<string, number>();
        completedSales?.forEach(sale => {
          const count = salesCount.get(sale.beat_id) || 0;
          salesCount.set(sale.beat_id, count + 1);
        });

        setSalesData(salesCount);
      } catch (error) {
        console.error('Error fetching sales data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSalesData();
  }, [beats]);

  const handleBeatClick = (beatId: string) => {
    navigate(`/beat/${beatId}`);
  };

  // Sort beats by actual completed sales count
  const sortedBeats = [...beats]
    .map(beat => ({
      ...beat,
      actualSales: salesData.get(beat.id) || 0
    }))
    .sort((a, b) => b.actualSales - a.actualSales)
    .slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Selling Beats</CardTitle>
        <CardDescription>Your best performing tracks by completed sales</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {loading ? (
            <p className="text-muted-foreground text-sm">Loading sales data...</p>
          ) : sortedBeats.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              You haven't uploaded any beats yet. Go to Upload Beat to get started.
            </p>
          ) : (
            sortedBeats.map((beat, index) => (
              <div 
                key={beat.id} 
                className="flex items-center gap-3 pb-4 border-b last:border-0 cursor-pointer hover:bg-muted/50 p-2 rounded-md transition-colors"
                onClick={() => handleBeatClick(beat.id)}
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="font-semibold text-sm">{index + 1}</span>
                </div>
                <div className="w-10 h-10 rounded overflow-hidden shrink-0">
                  <img
                    src={beat.cover_image || '/placeholder.svg'}
                    alt={beat.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{beat.title}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-muted-foreground">
                      {beat.actualSales} completed sales
                    </p>
                    {beat.plays > 0 && (
                      <Badge variant="outline" className="text-xs px-1.5 py-0">
                        {beat.plays} plays
                      </Badge>
                    )}
                    {beat.favorites_count > 0 && (
                      <Badge variant="outline" className="text-xs px-1.5 py-0 bg-red-50">
                        {beat.favorites_count} likes
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-sm">
                    {currency === 'NGN' ? '₦' : '$'}
                    {(currency === 'NGN' ? 
                      beat.basic_license_price_local : 
                      beat.basic_license_price_diaspora || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
