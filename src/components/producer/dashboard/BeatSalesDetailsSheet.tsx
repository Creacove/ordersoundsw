import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, User as UserIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface Transaction {
    id: string;
    purchase_date: string;
    price: number;
    buyer_name: string;
    buyer_email: string;
    buyer_id: string;
    buyer_avatar?: string;
    status: string;
}

interface BeatSalesDetailsSheetProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    beatId: string | null;
    beatTitle: string;
    currency: string;
}

export function BeatSalesDetailsSheet({
    isOpen,
    onOpenChange,
    beatId,
    beatTitle,
    currency,
}: BeatSalesDetailsSheetProps) {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && beatId) {
            fetchTransactions();
        }
    }, [isOpen, beatId, currency]);

    const fetchTransactions = async () => {
        if (!beatId) return;
        setLoading(true);
        try {
            let query = supabase
                .from('user_purchased_beats')
                .select(`
          purchase_date,
          orders!inner(
            id,
            total_price,
            status,
            currency_used,
            buyer:users!orders_buyer_id_fkey(
              id,
              full_name,
              email,
              profile_picture
            )
          )
        `)
                .eq('beat_id', beatId)
                .eq('orders.status', 'completed')
                .order('purchase_date', { ascending: false });

            if (currency === 'NGN') {
                query = query.eq('orders.currency_used', 'NGN');
            } else {
                query = query.in('orders.currency_used', ['USD', 'USDC']);
            }

            const { data, error } = await query;

            if (error) throw error;

            const formattedTransactions: Transaction[] = data.map((item: any) => ({
                id: item.orders.id,
                purchase_date: item.purchase_date,
                price: item.orders.total_price,
                buyer_name: item.orders.buyer.full_name || 'Unknown Buyer',
                buyer_email: item.orders.buyer.email,
                buyer_id: item.orders.buyer.id,
                buyer_avatar: item.orders.buyer.profile_picture,
                status: item.orders.status,
            }));

            setTransactions(formattedTransactions);
        } catch (error) {
            console.error("Error fetching transactions:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent className="w-[400px] sm:w-[540px]">
                <SheetHeader className="mb-6">
                    <SheetTitle className="text-xl">{beatTitle}</SheetTitle>
                    <SheetDescription>
                        Sales history for this beat in {currency}.
                    </SheetDescription>
                </SheetHeader>

                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center gap-4">
                                <Skeleton className="h-10 w-10 rounded-full" />
                                <div className="space-y-2 flex-1">
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-2/3" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : transactions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[50vh] text-muted-foreground">
                        <p>No transactions found for this period.</p>
                    </div>
                ) : (
                    <ScrollArea className="h-[calc(100vh-140px)] pr-4">
                        <div className="space-y-1">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[180px] sm:w-auto">Buyer</TableHead>
                                        <TableHead className="w-[100px] whitespace-nowrap">Date</TableHead>
                                        <TableHead className="text-right whitespace-nowrap w-[100px]">Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {transactions.map((tx) => (
                                        <TableRow key={tx.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3 max-w-[180px] sm:max-w-none">
                                                    <Avatar className="h-8 w-8 flex-shrink-0">
                                                        <AvatarImage src={tx.buyer_avatar} />
                                                        <AvatarFallback><UserIcon className="h-4 w-4" /></AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="font-medium text-sm truncate">{tx.buyer_name}</span>
                                                        <span className="text-xs text-muted-foreground truncate hidden sm:block">
                                                            {tx.buyer_email}
                                                        </span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground whitespace-nowrap align-middle">
                                                {formatDate(tx.purchase_date)}
                                            </TableCell>
                                            <TableCell className="text-right font-medium whitespace-nowrap align-middle">
                                                {formatCurrency(tx.price, currency)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </ScrollArea>
                )}
            </SheetContent>
        </Sheet>
    );
}
