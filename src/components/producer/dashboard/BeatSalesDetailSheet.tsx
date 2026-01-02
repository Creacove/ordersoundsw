
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

                console.log('Beat Sales Detail Query:', { beatId, currency, data, error });

                if (error) {
                    console.error("Error fetching beat transactions:", error);
                    return;
                }

                if (!data || data.length === 0) {
                    console.warn('No transactions found for beat:', beatId, 'currency:', currency);
                    setTransactions([]);
                    return;
                }

                // Now fetch buyer info separately for each unique buyer_id
                const buyerIds = [...new Set(data.map((item: any) => item.orders.buyer_id).filter(Boolean))];
                console.log('Fetching buyer info for IDs:', buyerIds);

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

                console.log('Mapped transactions:', mappedTransactions);
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
            <SheetContent className="w-full sm:max-w-xl flex flex-col h-full bg-background border-l shadow-2xl">
                <SheetHeader className="pb-4 border-b space-y-4">
                    <div className="flex items-center gap-4">
                        {beatCoverImage ? (
                            <img
                                src={beatCoverImage}
                                alt={beatTitle}
                                className="h-16 w-16 rounded-md object-cover border"
                            />
                        ) : (
                            <div className="h-16 w-16 rounded-md bg-muted flex items-center justify-center">
                                <Music className="h-8 w-8 text-muted-foreground" />
                            </div>
                        )}
                        <div>
                            <SheetTitle className="text-xl md:text-2xl leading-tight">{beatTitle}</SheetTitle>
                            <SheetDescription>
                                Sales History ({currency})
                            </SheetDescription>
                        </div>
                    </div>

                    <div className="flex items-center justify-between bg-muted/30 p-3 rounded-lg border">
                        <div className="flex flex-col">
                            <span className="text-sm text-muted-foreground">Total Revenue</span>
                            <span className="text-xl font-bold">{formatCurrency(totalRevenue, currency)}</span>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-sm text-muted-foreground">Total Sales</span>
                            <span className="text-xl font-bold">{transactions.length}</span>
                        </div>
                    </div>
                </SheetHeader>

                <ScrollArea className="flex-1 -mx-6 px-6">
                    {loading ? (
                        <div className="space-y-4 py-4">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="flex flex-col space-y-2 border-b pb-4">
                                    <div className="flex justify-between">
                                        <Skeleton className="h-4 w-32" />
                                        <Skeleton className="h-4 w-16" />
                                    </div>
                                    <div className="flex justify-between">
                                        <Skeleton className="h-3 w-24" />
                                        <Skeleton className="h-3 w-20" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : transactions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                                <DollarSign className="h-6 w-6 opacity-30" />
                            </div>
                            <p className="font-medium">No sales found for this currency</p>
                            <p className="text-sm mt-1">Try switching the currency filter if you expect to see sales.</p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {/* Mobile-friendly list view */}
                            <div className="md:hidden space-y-4 py-4">
                                {transactions.map((tx) => (
                                    <div key={tx.order_id} className="border rounded-lg p-3 space-y-2 bg-card">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-2">
                                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                    <User className="h-4 w-4 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm">{tx.buyer_name}</p>
                                                    <p className="text-xs text-muted-foreground">{tx.license_type} License</p>
                                                </div>
                                            </div>
                                            <span className="font-bold text-sm bg-green-50 text-green-700 px-2 py-0.5 rounded">
                                                {formatCurrency(tx.price_paid, tx.currency)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs text-muted-foreground pt-2 border-t">
                                            <span className="flex items-center">
                                                <Calendar className="h-3 w-3 mr-1" />
                                                {formatDate(tx.purchase_date)}
                                            </span>
                                            <span className="font-mono">{tx.currency}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Desktop table view */}
                            <div className="hidden md:block py-4">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Buyer</TableHead>
                                            <TableHead>License</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead className="text-right">Price</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {transactions.map((tx) => (
                                            <TableRow key={tx.order_id}>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{tx.buyer_name}</span>
                                                        {tx.buyer_email && (
                                                            <span className="text-xs text-muted-foreground">{tx.buyer_email}</span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="font-normal">{tx.license_type}</Badge>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground text-sm">
                                                    {new Date(tx.purchase_date).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell className="text-right font-medium">
                                                    {formatCurrency(tx.price_paid, tx.currency)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )}
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}
