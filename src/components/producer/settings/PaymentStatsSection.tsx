
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CreditCard, Clock, Activity, ArrowRight, CheckCircle2, AlertCircle, ShoppingCart } from "lucide-react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { formatCurrency } from '@/utils/formatters';

interface Transaction {
  id: string;
  beat_title: string;
  beat_id: string;
  date: string;
  amount: number;
  currency: string;
  status: string;
  reference: string;
}

interface PaymentAnalytics {
  total_earnings: number;
  pending_balance: number;
  successful_payments: number;
  pending_payments: number;
  recent_transactions: Transaction[];
}

interface PaymentStatsSectionProps {
  userId: string;
  hasVerifiedAccount: boolean;
  verifiedAccountName?: string | null;
}

export function PaymentStatsSection({ userId, hasVerifiedAccount, verifiedAccountName }: PaymentStatsSectionProps) {
  const [paymentAnalytics, setPaymentAnalytics] = useState<PaymentAnalytics | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPaymentAnalytics();
  }, [userId]);

  const fetchPaymentAnalytics = async () => {
    try {
      setLoadingAnalytics(true);
      
      // Get producer's beats
      const { data: producerBeats, error: beatsError } = await supabase
        .from('beats')
        .select('id')
        .eq('producer_id', userId);
        
      if (beatsError) throw beatsError;
      
      if (!producerBeats || producerBeats.length === 0) {
        setPaymentAnalytics({
          total_earnings: 0,
          pending_balance: 0,
          successful_payments: 0,
          pending_payments: 0,
          recent_transactions: []
        });
        setLoadingAnalytics(false);
        return;
      }
      
      const beatIds = producerBeats.map(beat => beat.id);
      
      // Get transactions for producer's beats only
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('line_items')
        .select(`
          id,
          price_charged,
          currency_code,
          beat_id,
          order_id,
          orders:order_id(
            order_date, 
            status, 
            payment_reference
          ),
          beats:beat_id(
            title,
            id
          )
        `)
        .in('beat_id', beatIds);
        
      if (transactionsError) throw transactionsError;
      
      // Get payouts for this producer
      const { data: payoutsData, error: payoutsError } = await supabase
        .from('payouts')
        .select('*')
        .eq('producer_id', userId)
        .order('created_at', { ascending: false });
        
      if (payoutsError) throw payoutsError;

      const recentTransactions: Transaction[] = (transactionsData || [])
        .filter(item => item && item.orders && item.beats)
        .map(item => ({
          id: item.id,
          beat_title: item.beats?.title || 'Untitled Beat',
          beat_id: item.beat_id || '',
          date: item.orders?.order_date || '',
          amount: item.price_charged || 0,
          currency: item.currency_code || 'NGN',
          status: item.orders?.status || 'unknown',
          reference: item.orders?.payment_reference || ''
        })) || [];
      
      // Calculate total earnings from transactions (90% goes to producer)
      const totalEarnings = recentTransactions.reduce((sum, transaction) => {
        return transaction.status === 'completed' ? sum + (transaction.amount * 0.9) : sum;
      }, 0);
      
      // Calculate total paid out from completed payouts
      const completedPayouts = payoutsData?.filter(p => p.status === 'successful') || [];
      const pendingPayouts = payoutsData?.filter(p => p.status === 'pending') || [];
      const totalPaidOut = completedPayouts.reduce((sum, payout) => sum + payout.amount, 0);
      
      // Calculate pending balance as the difference between total earnings and paid out amount
      const pendingBalance = totalEarnings - totalPaidOut;
      
      setPaymentAnalytics({
        total_earnings: totalEarnings,
        pending_balance: pendingBalance,
        successful_payments: completedPayouts.length,
        pending_payments: pendingPayouts.length,
        recent_transactions: recentTransactions
      });
    } catch (error) {
      console.error("Error fetching payment analytics:", error);
      toast({
        title: "Error",
        description: "Failed to load payment analytics",
        variant: "destructive"
      });
    } finally {
      setLoadingAnalytics(false);
    }
  };

  return (
    <div className="space-y-8 mt-12">
      <div className="flex items-center gap-3">
        <CreditCard size={20} className="text-[#9A3BDC]" />
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 italic">Revenue Statistics</h3>
      </div>

      {loadingAnalytics ? (
        <div className="flex items-center justify-center py-20 bg-white/[0.02] border border-white/5 rounded-[2.5rem]">
          <Loader2 className="h-8 w-8 animate-spin text-[#9A3BDC] mr-4" />
          <p className="text-[10px] font-black uppercase tracking-widest text-white/20 italic">Synchronizing Financials...</p>
        </div>
      ) : paymentAnalytics ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-8 hover:bg-white/[0.04] transition-all group overflow-hidden relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#9A3BDC]/5 blur-3xl -mr-12 -mt-12 rounded-full" />
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                  <CreditCard size={14} />
                </div>
                <span className="text-[9px] font-black text-white/20 uppercase tracking-widest italic">Lifetime Earnings</span>
              </div>
              <p className="text-3xl font-black text-white italic tracking-tighter uppercase tabular-nums">
                {formatCurrency(paymentAnalytics.total_earnings)}
              </p>
            </div>
            
            <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-8 hover:bg-white/[0.04] transition-all group overflow-hidden relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 blur-3xl -mr-12 -mt-12 rounded-full" />
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                  <Clock size={14} />
                </div>
                <span className="text-[9px] font-black text-white/20 uppercase tracking-widest italic">Pending Balance</span>
              </div>
              <p className="text-3xl font-black text-white italic tracking-tighter uppercase tabular-nums">
                {formatCurrency(paymentAnalytics.pending_balance)}
              </p>
            </div>
            
            <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-8 hover:bg-white/[0.04] transition-all group overflow-hidden relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#9A3BDC]/5 blur-3xl -mr-12 -mt-12 rounded-full" />
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-xl bg-[#9A3BDC]/10 flex items-center justify-center text-[#9A3BDC]">
                  <Activity size={14} />
                </div>
                <span className="text-[9px] font-black text-white/20 uppercase tracking-widest italic">Total Payouts</span>
              </div>
              <p className="text-3xl font-black text-white italic tracking-tighter uppercase tabular-nums">
                {paymentAnalytics.successful_payments}
              </p>
            </div>
          </div>
          
          <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8 md:p-12">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40">
                  <ShoppingCart size={20} />
                </div>
                <div>
                   <h3 className="text-xl font-black text-white italic tracking-tighter uppercase">Recent Transactions</h3>
                   <p className="text-[10px] font-black uppercase tracking-widest text-white/20 italic">Latest completed beat sales</p>
                </div>
              </div>
            </div>

            {paymentAnalytics.recent_transactions && paymentAnalytics.recent_transactions.length > 0 ? (
               <div className="space-y-1">
                 {paymentAnalytics.recent_transactions
                    .filter(transaction => transaction.status === 'completed')
                    .slice(0, 5)
                    .map((transaction) => (
                      <div key={transaction.id} className="flex flex-col md:flex-row md:items-center justify-between p-6 rounded-2xl hover:bg-white/[0.02] transition-colors border-b border-white/5 last:border-0 group">
                         <div className="flex items-center gap-4 mb-4 md:mb-0">
                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/20 group-hover:bg-[#9A3BDC]/10 group-hover:text-[#9A3BDC] transition-colors">
                               <Activity size={18} />
                            </div>
                            <div>
                               <p className="text-sm font-black text-white italic tracking-tight uppercase">{transaction.beat_title}</p>
                               <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest italic">
                                 {transaction.date ? new Date(transaction.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                               </p>
                            </div>
                         </div>
                         <div className="text-right">
                            <p className="text-lg font-black text-white italic tracking-tighter uppercase">
                               {formatCurrency(transaction.amount * 0.9, transaction.currency)}
                            </p>
                            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500/50 italic">{transaction.status}</span>
                         </div>
                      </div>
                    ))}
               </div>
            ) : (
              <div className="text-center py-10 opacity-20">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] italic">No transaction history found</p>
              </div>
            )}
          </div>
          
          <div className={cn(
            "rounded-[2rem] p-10 flex flex-col md:flex-row items-center justify-between gap-8 border transition-all",
            hasVerifiedAccount 
              ? "bg-[#9A3BDC]/5 border-[#9A3BDC]/20" 
              : "bg-amber-500/5 border-amber-500/20"
          )}>
            <div className="flex items-center gap-6">
               <div className={cn(
                 "w-16 h-16 rounded-[1.5rem] flex items-center justify-center shrink-0",
                 hasVerifiedAccount ? "bg-[#9A3BDC]/10 text-[#9A3BDC]" : "bg-amber-500/10 text-amber-500"
               )}>
                  {hasVerifiedAccount ? <CheckCircle2 size={32} /> : <AlertCircle size={32} />}
               </div>
               <div>
                  <h3 className={cn(
                    "text-xl font-black italic tracking-tighter uppercase mb-2",
                    hasVerifiedAccount ? "text-white" : "text-amber-500"
                  )}>
                    {hasVerifiedAccount ? "Payout Network Operational" : "Payout Configuration Required"}
                  </h3>
                  <p className="text-white/40 text-sm italic font-medium max-w-xl">
                    {hasVerifiedAccount 
                      ? `Your account is successfully integrated with ${verifiedAccountName}. Earnings are automatically distributed via smart split logic (90/10 split).`
                      : "We need your settlement details to route earnings to your node. Please configure your bank or wallet information above."}
                  </p>
               </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-20 bg-white/[0.02] border border-white/5 rounded-[2.5rem]">
          <p className="text-white/20 font-black uppercase italic tracking-[0.2em]">
            {hasVerifiedAccount 
              ? "No financial telemetry available. Establish sales to generate records."
              : "Financial routing inactive. Payout configuration required."}
          </p>
        </div>
      )}
    </div>
  );
}
