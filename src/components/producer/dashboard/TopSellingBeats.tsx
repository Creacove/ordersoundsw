
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Beat } from "@/types";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface TopSellingBeatsProps {
  beats: Beat[];
}

interface BeatWithSales extends Beat {
  completed_sales_count?: number;
}

export function TopSellingBeats({ beats }: TopSellingBeatsProps) {
  const navigate = useNavigate();
  const { currency } = useAuth();
  const [beatsWithSales, setBeatsWithSales] = useState<BeatWithSales[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const handleBeatClick = (beatId: string) => {
    navigate(`/beat/${beatId}`);
  };

  // Fetch completed sales count for each beat
  useEffect(() => {
    const fetchSalesData = async () => {
      if (!beats || beats.length === 0) {
        setBeatsWithSales([]);
        setIsLoading(false);
        return;
      }

      try {
        const beatIds = beats.map(beat => beat.id);
        
        // Get completed sales count for each beat
        const { data: salesData, error } = await supabase
          .from('user_purchased_beats')
          .select(`
            beat_id,
            orders!inner(status)
          `)
          .in('beat_id', beatIds)
          .eq('orders.status', 'completed');

        if (error) throw error;

        // Count completed sales per beat
        const salesCountMap: Record<string, number> = {};
        salesData?.forEach(sale => {
          const beatId = sale.beat_id;
          salesCountMap[beatId] = (salesCountMap[beatId] || 0) + 1;
        });

        // Add sales count to beats and sort by completed sales
        const beatsWithSalesData = beats
          .map(beat => ({
            ...beat,
            completed_sales_count: salesCountMap[beat.id] || 0
          }))
          .sort((a, b) => (b.completed_sales_count || 0) - (a.completed_sales_count || 0))
          .slice(0, 5); // Top 5

        setBeatsWithSales(beatsWithSalesData);
      } catch (error) {
        console.error('Error fetching sales data:', error);
        // Fallback to original beats without sales data
        setBeatsWithSales(beats.slice(0, 5));
      } finally {
        setIsLoading(false);
      }
    };

    fetchSalesData();
  }, [beats]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Selling Beats</CardTitle>
        <CardDescription>Your best performing tracks (by completed sales)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isLoading ? (
            <p className="text-muted-foreground text-sm">Loading sales data...</p>
          ) : beatsWithSales.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              You haven't uploaded any beats yet. Go to Upload Beat to get started.
            </p>
          ) : (
            beatsWithSales.map((beat, index) => (
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
                    src={beat.cover_image_url}
                    alt={beat.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{beat.title}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-muted-foreground">
                      {beat.completed_sales_count || 0} completed sales
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
