import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { Music, ChevronRight } from "lucide-react";
import { BeatSalesDetailsSheet } from "./BeatSalesDetailsSheet";

interface BeatSaleData {
  beat_id: string;
  beat_title: string;
  beat_cover_image: string | null;
  beat_genre: string | null;
  basic_price_local: number;
  basic_price_diaspora: number;
  sales_count: number;
  total_revenue: number;
  last_purchase_date: string;
}

interface BeatSalesTableProps {
  producerId: string;
  currency: string;
}

export function BeatSalesTable({ producerId, currency }: BeatSalesTableProps) {
  const [salesData, setSalesData] = useState<BeatSaleData[]>([]);
  const [loading, setLoading] = useState(true);

  // Drill-down state
  const [selectedBeatId, setSelectedBeatId] = useState<string | null>(null);
  const [selectedBeatTitle, setSelectedBeatTitle] = useState<string>("");
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    const fetchBeatSalesData = async () => {
      if (!producerId) return;

      setLoading(true);
      try {
        // Get beats with completed sales using optimized query
        let salesQuery = supabase
          .from('user_purchased_beats')
          .select(`
            beat_id,
            purchase_date,
            currency_code,
            orders!inner(
              id,
              total_price,
              status,
              currency_used
            ),
            beats!inner(
              id,
              title,
              cover_image,
              genre,
              basic_license_price_local,
              basic_license_price_diaspora,
              producer_id
            )
          `)
          .eq('beats.producer_id', producerId)
          .eq('orders.status', 'completed')
          .order('purchase_date', { ascending: false });

        // Apply strict currency filter
        if (currency === 'NGN') {
          salesQuery = salesQuery.eq('orders.currency_used', 'NGN');
        } else {
          salesQuery = salesQuery.in('orders.currency_used', ['USD', 'USDC']);
        }

        const { data: beatSales, error } = await salesQuery;

        if (error) {
          console.error('Error fetching beat sales:', error);
          return;
        }

        // Process and aggregate the data
        const salesMap = new Map<string, BeatSaleData>();

        beatSales?.forEach(sale => {
          const beat = sale.beats;
          const order = sale.orders;

          if (!beat || !order) return;

          const beatId = beat.id;

          if (!salesMap.has(beatId)) {
            salesMap.set(beatId, {
              beat_id: beatId,
              beat_title: beat.title,
              beat_cover_image: beat.cover_image,
              beat_genre: beat.genre,
              basic_price_local: beat.basic_license_price_local || 0,
              basic_price_diaspora: beat.basic_license_price_diaspora || 0,
              sales_count: 0,
              total_revenue: 0,
              last_purchase_date: sale.purchase_date || '',
            });
          }

          const beatData = salesMap.get(beatId)!;
          beatData.sales_count += 1;
          beatData.total_revenue += (order.total_price || 0);

          // Update last purchase date if more recent
          if (sale.purchase_date && sale.purchase_date > beatData.last_purchase_date) {
            beatData.last_purchase_date = sale.purchase_date;
          }
        });

        // Convert to array and sort by total revenue
        const processedData = Array.from(salesMap.values())
          .sort((a, b) => b.total_revenue - a.total_revenue);

        setSalesData(processedData);
      } catch (error) {
        console.error('Error processing beat sales data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBeatSalesData();
  }, [producerId, currency]);

  const handleRowClick = (beat: BeatSaleData) => {
    setSelectedBeatId(beat.beat_id);
    setSelectedBeatTitle(beat.beat_title);
    setDetailsOpen(true);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Beat Sales Performance</CardTitle>
          <CardDescription>Revenue breakdown for your beats with sales</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-md" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (salesData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Beat Sales Performance</CardTitle>
          <CardDescription>Revenue breakdown for your beats with sales</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Music className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-2">No sales data available for {currency}</p>
            <p className="text-sm text-muted-foreground">Sales made in {currency} will appear here.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Beat Sales Performance</CardTitle>
          <CardDescription>
            Revenue breakdown for your beats ({currency === 'NGN' ? 'Naira Sales' : 'USD/USDC Sales'})
            <span className="block text-xs text-muted-foreground mt-1 font-normal">
              Click on a row to view transaction details
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Mobile-first responsive design */}
          <div className="space-y-4 md:hidden">
            {/* Mobile card layout */}
            {salesData.map((beat) => (
              <div
                key={beat.beat_id}
                className="border rounded-lg p-4 space-y-3 active:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => handleRowClick(beat)}
              >
                <div className="flex items-center gap-3">
                  {beat.beat_cover_image ? (
                    <img
                      src={beat.beat_cover_image}
                      alt={beat.beat_title}
                      className="h-12 w-12 rounded-md object-cover"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-md bg-muted flex items-center justify-center">
                      <Music className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{beat.beat_title}</h3>
                    {beat.beat_genre && (
                      <Badge variant="outline" className="text-xs mt-1">
                        {beat.beat_genre}
                      </Badge>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Sales</p>
                    <p className="font-semibold">{beat.sales_count}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Revenue</p>
                    <p className="font-semibold">
                      {formatCurrency(beat.total_revenue, currency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Unit Price</p>
                    <p className="font-semibold">
                      {formatCurrency(
                        currency === 'NGN' ? beat.basic_price_local : beat.basic_price_diaspora,
                        currency
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Last Sale</p>
                    <p className="font-semibold">
                      {formatDate(beat.last_purchase_date)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table layout */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Beat</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead className="text-center">Sales</TableHead>
                  <TableHead className="text-right">Total Revenue</TableHead>
                  <TableHead>Last Sale</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesData.map((beat) => (
                  <TableRow
                    key={beat.beat_id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleRowClick(beat)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {beat.beat_cover_image ? (
                          <img
                            src={beat.beat_cover_image}
                            alt={beat.beat_title}
                            className="h-10 w-10 rounded-md object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
                            <Music className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{beat.beat_title}</p>
                          {beat.beat_genre && (
                            <Badge variant="outline" className="text-xs mt-1">
                              {beat.beat_genre}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatCurrency(
                        currency === 'NGN' ? beat.basic_price_local : beat.basic_price_diaspora,
                        currency
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{beat.sales_count}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(beat.total_revenue, currency)}
                    </TableCell>
                    <TableCell>
                      {formatDate(beat.last_purchase_date)}
                    </TableCell>
                    <TableCell>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <BeatSalesDetailsSheet
        isOpen={detailsOpen}
        onOpenChange={setDetailsOpen}
        beatId={selectedBeatId}
        beatTitle={selectedBeatTitle}
        currency={currency}
      />
    </>
  );
}
