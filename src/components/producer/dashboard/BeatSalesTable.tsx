
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { Music, ChevronRight } from "lucide-react";
import { BeatSalesDetailSheet } from "./BeatSalesDetailSheet";

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
  currency_breakdown: {
    NGN: number;
    USD: number;
  };
}

interface BeatSalesTableProps {
  producerId: string;
  currency: string;
}

export function BeatSalesTable({ producerId, currency }: BeatSalesTableProps) {
  const [salesData, setSalesData] = useState<BeatSaleData[]>([]);
  const [loading, setLoading] = useState(true);

  // State for detail sheet
  const [selectedBeatId, setSelectedBeatId] = useState<string | null>(null);
  const [selectedBeatTitle, setSelectedBeatTitle] = useState("");
  const [selectedBeatImage, setSelectedBeatImage] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

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

        // Apply currency filter
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
              currency_breakdown: {
                NGN: 0,
                USD: 0
              }
            });
          }

          const beatData = salesMap.get(beatId)!;
          beatData.sales_count += 1;
          beatData.total_revenue += (order.total_price || 0);

          // Track currency breakdown
          if (order.currency_used === 'NGN') {
            beatData.currency_breakdown.NGN += (order.total_price || 0);
          } else if (order.currency_used === 'USD') {
            beatData.currency_breakdown.USD += (order.total_price || 0);
          }

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
    setSelectedBeatImage(beat.beat_cover_image);
    setIsSheetOpen(true);
  };

  if (loading) {
    return (
      <Card className="bg-[#030407]/40 border-white/5 backdrop-blur-3xl rounded-[2.5rem]">
        <CardHeader>
          <CardTitle className="text-white font-black italic uppercase tracking-tighter">Beat Sales Performance</CardTitle>
          <CardDescription className="text-white/40 italic">Revenue breakdown for your beats</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-xl bg-white/5" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-48 bg-white/5" />
                  <Skeleton className="h-4 w-24 bg-white/5" />
                </div>
                <Skeleton className="h-6 w-16 bg-white/5" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (salesData.length === 0) {
    return (
      <Card className="bg-[#030407]/40 border-white/5 backdrop-blur-3xl rounded-[2.5rem]">
        <CardHeader>
          <CardTitle className="text-white font-black italic uppercase tracking-tighter">Beat Sales Performance</CardTitle>
          <CardDescription className="text-white/40 italic">Revenue breakdown for your beats</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Music className="h-12 w-12 text-white/10 mx-auto mb-4" />
            <p className="text-white/20 font-black uppercase italic tracking-widest text-[10px] mb-2">No sales data recorded yet</p>
            <p className="text-xs text-white/10 italic">Your performance analytics will appear here once your beats are purchased.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-[#030407]/40 border-white/5 backdrop-blur-3xl rounded-[2.5rem] overflow-hidden">
        <CardHeader className="p-8">
          <CardTitle className="text-white font-black italic uppercase tracking-tighter text-xl">Beat Sales Performance</CardTitle>
          <CardDescription className="text-white/40 italic">Revenue breakdown for your beats with completed sales</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {/* Mobile card layout */}
          <div className="space-y-4 md:hidden px-8 pb-8">
            {salesData.map((beat) => (
              <div
                key={beat.beat_id}
                className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 space-y-4 cursor-pointer hover:bg-white/[0.05] transition-all"
                onClick={() => handleRowClick(beat)}
              >
                <div className="flex items-center gap-4">
                  {beat.beat_cover_image ? (
                    <img
                      src={beat.beat_cover_image}
                      alt={beat.beat_title}
                      className="h-14 w-14 rounded-xl object-cover border border-white/10"
                    />
                  ) : (
                    <div className="h-14 w-14 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                      <Music className="h-7 w-7 text-white/20" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-white italic tracking-tighter uppercase text-base truncate">{beat.beat_title}</h3>
                    {beat.beat_genre && (
                      <span className="text-[10px] font-black uppercase italic tracking-widest text-white/30">
                        {beat.beat_genre}
                      </span>
                    )}
                  </div>
                  <ChevronRight className="h-5 w-5 text-white/20" />
                </div>

                <div className="grid grid-cols-2 gap-6 text-xs">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/20 italic mb-1">Sales</p>
                    <p className="font-bold text-white italic uppercase tracking-tighter">{beat.sales_count}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/20 italic mb-1">Revenue</p>
                    <p className="font-bold text-white italic uppercase tracking-tighter">
                      {formatCurrency(beat.total_revenue, currency)}
                    </p>
                  </div>
                </div>

                {/* Currency breakdown for mobile */}
                {(beat.currency_breakdown.NGN > 0 || beat.currency_breakdown.USD > 0) && (
                  <div className="pt-4 border-t border-white/5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/10 italic mb-2">Revenue Breakdown:</p>
                    <div className="flex flex-wrap gap-4 text-[10px] font-bold text-white/30 uppercase italic tracking-widest">
                      {beat.currency_breakdown.NGN > 0 && (
                        <span>NGN: {formatCurrency(beat.currency_breakdown.NGN, 'NGN')}</span>
                      )}
                      {beat.currency_breakdown.USD > 0 && (
                        <span>USD: {formatCurrency(beat.currency_breakdown.USD, 'USD')}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Desktop table layout */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="px-8 font-black uppercase italic tracking-widest text-white/30 text-[10px]">Beat</TableHead>
                  <TableHead className="font-black uppercase italic tracking-widest text-white/30 text-[10px]">Price</TableHead>
                  <TableHead className="text-center font-black uppercase italic tracking-widest text-white/30 text-[10px]">Sales</TableHead>
                  <TableHead className="text-right font-black uppercase italic tracking-widest text-white/30 text-[10px]">Revenue</TableHead>
                  <TableHead className="font-black uppercase italic tracking-widest text-white/30 text-[10px]">Last Sale</TableHead>
                  <TableHead className="font-black uppercase italic tracking-widest text-white/30 text-[10px]">Currency Split</TableHead>
                  <TableHead className="w-[80px] px-8"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesData.map((beat) => (
                  <TableRow
                    key={beat.beat_id}
                    className="border-white/5 hover:bg-white/[0.02] cursor-pointer transition-colors group"
                    onClick={() => handleRowClick(beat)}
                  >
                    <TableCell className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        {beat.beat_cover_image ? (
                          <img
                            src={beat.beat_cover_image}
                            alt={beat.beat_title}
                            className="h-12 w-12 rounded-xl object-cover border border-white/10"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                            <Music className="h-6 w-6 text-white/20" />
                          </div>
                        )}
                        <div>
                          <p className="font-black text-white italic tracking-tighter uppercase text-base">{beat.beat_title}</p>
                          {beat.beat_genre && (
                            <span className="text-[10px] font-black uppercase italic tracking-widest text-white/30">
                              {beat.beat_genre}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-bold text-white/40 italic text-sm">
                      {formatCurrency(
                        currency === 'NGN' ? beat.basic_price_local : beat.basic_price_diaspora,
                        currency
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="bg-white/5 text-white/60 px-3 py-1 rounded-full font-black italic uppercase tracking-widest text-[9px]">
                        {beat.sales_count} Sales
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-black text-white italic tracking-tighter text-lg">
                      {formatCurrency(beat.total_revenue, currency)}
                    </TableCell>
                    <TableCell className="text-white/40 font-bold italic text-xs uppercase">
                      {formatDate(beat.last_purchase_date)}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-[10px] font-black uppercase italic tracking-widest text-white/20">
                        {beat.currency_breakdown.NGN > 0 && (
                          <div className="text-emerald-500/50">NGN: {formatCurrency(beat.currency_breakdown.NGN, 'NGN')}</div>
                        )}
                        {beat.currency_breakdown.USD > 0 && (
                          <div className="text-accent/50">USD: {formatCurrency(beat.currency_breakdown.USD, 'USD')}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-8 text-right">
                      <ChevronRight className="h-5 w-5 text-white/10 group-hover:text-white/40 transition-colors inline-block" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <BeatSalesDetailSheet
        isOpen={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        beatId={selectedBeatId}
        beatTitle={selectedBeatTitle}
        beatCoverImage={selectedBeatImage}
        currency={currency}
      />
    </>
  );
}
