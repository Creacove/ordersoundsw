
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Music, Calendar, DollarSign, User } from "lucide-react";

interface TransactionDetail {
    order_id: string;
    purchase_date: string;
    buyer_name: string;
    buyer_email: string | null;
    price_paid: number;
    currency: string;
    license_type: string;
    status: string;
}

interface BeatSalesDetailSheetProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    beatId: string | null;
    beatTitle: string;
    beatCoverImage: string | null;
    currency: string; // Global currency filter
}

export function BeatSalesDetailSheet({
    isOpen,
    onOpenChange,
    beatId,
    beatTitle,
    beatCoverImage,
    currency,
}: BeatSalesDetailSheetProps) {
    const [transactions, setTransactions] = useState<TransactionDetail[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTransactions = async () => {
            if (!beatId || !isOpen) return;

            setLoading(true);
            try {
                // Build query to fetch sales for this beat
                let query = supabase
                    .from('user_purchased_beats')
                    .select(`
            purchase_date,
            license_type,
            order_id,
            orders!inner(
              id,
              total_price,
              currency_used,
              status,
              buyer_id
            )
          `)
                    .eq('beat_id', beatId)
                    .eq('orders.status', 'completed')
                    .order('purchase_date', { ascending: false });

                // STRICT CURRENCY FILTERING
                if (currency === 'NGN') {
                    query = query.eq('orders.currency_used', 'NGN');
                } else {
                    // For USD context, we usually include USD and USDC
                    query = query.in('orders.currency_used', ['USD', 'USDC']);
                }

                const { data, error } = await query;

                if (error) {
                    console.error("Error fetching beat transactions:", error);
                    return;
                }

                if (!data || data.length === 0) {
                    setTransactions([]);
                    return;
                }

                // Now fetch buyer info separately for each unique buyer_id
                const buyerIds = [...new Set(data.map((item: any) => item.orders.buyer_id).filter(Boolean))];

                let buyersMap = new Map<string, any>();

                if (buyerIds.length > 0) {
                    const { data: buyersData, error: buyersError } = await supabase
                        .from('users')
                        .select('id, full_name, email')
                        .in('id', buyerIds);

                    if (!buyersError && buyersData) {
                        buyersData.forEach(buyer => {
                            buyersMap.set(buyer.id, buyer);
                        });
                    }
                }

                const mappedTransactions: TransactionDetail[] = data.map((item: any, index: number) => {
                    // Show buyer as numbered for privacy (database RLS prevents access to user details)
                    const buyerId = item.orders?.buyer_id;
                    const buyerName = buyerId ? `Buyer #${index + 1}` : "Guest";

                    return {
                        order_id: item.orders.id,
                        purchase_date: item.purchase_date,
                        buyer_name: buyerName,
                        buyer_email: null,
                        price_paid: item.orders.total_price || 0,
                        currency: item.orders.currency_used || 'NGN',
                        license_type: item.license_type || 'Basic',
                        status: item.orders.status
                    };
                });

                setTransactions(mappedTransactions);
            } catch (err) {
                console.error("Unexpected error loading transactions:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchTransactions();
    }, [beatId, isOpen, currency]);

    // Determine total revenue for THIS view (filtered by currency)
    const totalRevenue = transactions.reduce((sum, t) => sum + t.price_paid, 0);

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-xl flex flex-col h-full bg-[#030407] border-white/5 shadow-2xl p-0">
                <SheetHeader className="p-8 border-b border-white/5 space-y-8 bg-black/20">
                    <div className="flex items-center gap-6">
                        <div className="relative group shrink-0">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#9A3BDC] to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                            {beatCoverImage ? (
                                <img
                                    src={beatCoverImage}
                                    alt={beatTitle}
                                    className="h-20 w-20 rounded-2xl object-cover border border-white/10 relative"
                                />
                            ) : (
                                <div className="h-20 w-20 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 relative">
                                    <Music className="h-10 w-10 text-white/20" />
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <SheetTitle className="text-2xl font-black text-white italic tracking-tighter uppercase truncate leading-none mb-2">{beatTitle}</SheetTitle>
                            <SheetDescription className="text-white/40 italic flex items-center gap-2">
                                <Calendar size={14} className="text-[#9A3BDC]" />
                                Sales History • {currency}
                            </SheetDescription>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl">
                             <span className="text-[10px] font-black uppercase tracking-widest text-white/20 italic block mb-1">Total Revenue</span>
                             <span className="text-2xl font-black text-white italic tracking-tighter uppercase">{formatCurrency(totalRevenue, currency)}</span>
                        </div>
                        <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl text-right">
                             <span className="text-[10px] font-black uppercase tracking-widest text-white/20 italic block mb-1">Total Sales</span>
                             <span className="text-2xl font-black text-white italic tracking-tighter uppercase">{transactions.length}</span>
                        </div>
                    </div>
                </SheetHeader>

                <ScrollArea className="flex-1 p-8">
                    {loading ? (
                        <div className="space-y-6">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="flex flex-col space-y-3 bg-white/[0.01] border border-white/5 rounded-2xl p-6">
                                    <div className="flex justify-between items-center">
                                        <Skeleton className="h-5 w-32 bg-white/5" />
                                        <Skeleton className="h-6 w-20 bg-white/5" />
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <Skeleton className="h-3 w-24 bg-white/5" />
                                        <Skeleton className="h-3 w-16 bg-white/5" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : transactions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="h-16 w-16 rounded-3xl bg-white/5 flex items-center justify-center mb-6">
                                <DollarSign className="h-8 w-8 text-white/10" />
                            </div>
                            <h3 className="font-black text-white italic tracking-tighter uppercase text-xl mb-2">No Sales Found</h3>
                            <p className="text-white/30 italic max-w-xs mx-auto">
                                No completed sales were found for this beat using the current currency filter.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-6 pb-8">
                            {transactions.map((tx) => (
                                <div key={tx.order_id} className="group relative bg-white/[0.02] border border-white/5 rounded-2xl p-6 hover:bg-white/[0.04] transition-all overflow-hidden">
                                     {/* Ranking line like on the Beats page */}
                                     <div className="absolute top-0 left-0 w-1 h-0 group-hover:h-full bg-[#9A3BDC] transition-all duration-300" />
                                     
                                     <div className="flex justify-between items-start mb-4">
                                         <div className="flex items-center gap-4">
                                             <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                                                 <User className="h-5 w-5 text-white/40" />
                                             </div>
                                             <div>
                                                 <p className="font-black text-white italic tracking-tighter uppercase text-base">{tx.buyer_name}</p>
                                                 <div className="flex items-center gap-2">
                                                     <Badge className="bg-white/5 text-white/40 hover:bg-white/5 border-none rounded-full px-2 py-0 font-bold uppercase italic tracking-widest text-[8px]">
                                                         {tx.license_type} License
                                                     </Badge>
                                                 </div>
                                             </div>
                                         </div>
                                         <div className="text-right">
                                             <p className="font-black text-white italic tracking-tighter uppercase text-xl">
                                                 {formatCurrency(tx.price_paid, tx.currency)}
                                             </p>
                                             <p className="text-[9px] font-bold text-emerald-500/50 uppercase tracking-widest italic">{tx.status}</p>
                                         </div>
                                     </div>
                                     
                                     <div className="flex justify-between items-center pt-4 border-t border-white/5">
                                         <div className="flex items-center gap-2 text-[10px] font-bold text-white/20 uppercase tracking-widest italic">
                                             <Calendar size={12} />
                                             {formatDate(tx.purchase_date)}
                                         </div>
                                         <span className="font-black text-white/10 uppercase italic tracking-[0.2em] text-[10px]">
                                             ID: {tx.order_id.substring(0, 8)}
                                         </span>
                                     </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}
