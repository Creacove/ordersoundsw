
import React, { useEffect, useState } from 'react';
import { usePaystackAdmin } from '@/hooks/payment/usePaystackAdmin';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProducerBankDetailsForm } from '@/components/payment/ProducerBankDetailsForm';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  AlertCircle, 
  CheckCircle, 
  RefreshCw, 
  CreditCard, 
  ChevronLeft, 
  ChevronRight,
  Users,
  TrendingUp,
  Wallet,
  Building2,
  AlertTriangle,
  XCircle,
  ShoppingCart
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

// Pagination Controls Component
interface PaginationControlsProps {
  currentPage: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  totalCount,
  pageSize,
  onPageChange,
  isLoading = false
}) => {
  const totalPages = Math.ceil(totalCount / pageSize);
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalCount);
  
  if (totalCount === 0) return null;
  
  const handlePrevious = () => {
    if (currentPage > 1) onPageChange(currentPage - 1);
  };
  
  const handleNext = () => {
    if (currentPage < totalPages) onPageChange(currentPage + 1);
  };
  
  const generatePageNumbers = () => {
    const pages = [];
    const showPages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(showPages / 2));
    let endPage = Math.min(totalPages, startPage + showPages - 1);
    
    if (endPage - startPage < showPages - 1) {
      startPage = Math.max(1, endPage - showPages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  };
  
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-8 border-t border-white/5 mt-8">
      <div className="text-xs font-black uppercase tracking-widest text-white/30 italic">
        Showing {startItem}-{endItem} of {totalCount}
      </div>
      
      <Pagination>
        <PaginationContent className="gap-2">
          <PaginationItem>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevious}
              disabled={currentPage <= 1 || isLoading}
              className="h-10 rounded-xl border-white/10 bg-white/[0.02] text-white hover:bg-white/5 font-bold uppercase italic tracking-tighter text-xs"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
          </PaginationItem>
          
          <div className="flex items-center gap-1">
            {generatePageNumbers().map((pageNum) => (
              <PaginationItem key={pageNum}>
                <Button
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => onPageChange(pageNum)}
                  disabled={isLoading}
                  className={`w-10 h-10 rounded-xl border-white/10 font-black italic transition-all ${currentPage === pageNum ? 'bg-white text-black hover:bg-white/90' : 'bg-white/[0.02] text-white hover:bg-white/5'}`}
                >
                  {pageNum}
                </Button>
              </PaginationItem>
            ))}
          </div>
          
          <PaginationItem>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNext}
              disabled={currentPage >= totalPages || isLoading}
              className="h-10 rounded-xl border-white/10 bg-white/[0.02] text-white hover:bg-white/5 font-bold uppercase italic tracking-tighter text-xs"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
};

// Stat Card Component
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, description, variant = 'default' }) => {
  return (
    <div className={`p-6 rounded-[2rem] border transition-all duration-300 ${
      variant === 'success' ? 'bg-emerald-500/[0.03] border-emerald-500/10' :
      variant === 'warning' ? 'bg-yellow-500/[0.03] border-yellow-500/10' :
      variant === 'danger' ? 'bg-red-500/[0.03] border-red-500/10' :
      'bg-white/[0.02] border-white/5'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-white/30 italic">{title}</p>
        <div className={`h-10 w-10 rounded-2xl flex items-center justify-center ${
          variant === 'success' ? 'bg-emerald-500/10 text-emerald-500' :
          variant === 'warning' ? 'bg-yellow-500/10 text-yellow-500' :
          variant === 'danger' ? 'bg-red-500/10 text-red-500' :
          'bg-white/5 text-[#9A3BDC]'
        }`}>
          {icon}
        </div>
      </div>
      <div>
        <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">{value}</h3>
        {description && <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest italic mt-1">{description}</p>}
      </div>
    </div>
  );
};

export default function PaymentAdmin() {
  const [activeProducerId, setActiveProducerId] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  const {
    transactions,
    buyers,
    overviewStats,
    producers,
    isLoading,
    isUpdating,
    producersPagination,
    transactionsPagination,
    buyersPagination,
    statusFilter,
    producerFilter,
    setStatusFilter,
    setProducerFilter,
    fetchOverviewStats,
    fetchProducers,
    fetchTransactions,
    fetchBuyers,
    updateProducerBankInfo,
    handleProducersPageChange,
    handleTransactionsPageChange,
    handleBuyersPageChange
  } = usePaystackAdmin();
  
  useEffect(() => {
    fetchOverviewStats();
  }, [fetchOverviewStats]);
  
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    
    switch (tab) {
      case 'overview':
        if (!overviewStats) fetchOverviewStats();
        break;
      case 'producers':
        if (producers.length === 0) fetchProducers();
        break;
      case 'buyers':
        if (buyers.length === 0) fetchBuyers();
        break;
      case 'transactions':
        if (transactions.length === 0) fetchTransactions();
        break;
    }
  };
  
  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'success':
      case 'settled':
      case 'completed':
        return <Badge className="bg-emerald-500/10 text-emerald-500 border-none rounded-full px-3 py-0.5 font-bold uppercase italic tracking-widest text-[9px]">Completed</Badge>;
      case 'pending':
      case 'processing':
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-none rounded-full px-3 py-0.5 font-bold uppercase italic tracking-widest text-[9px]">Pending</Badge>;
      case 'failed':
      case 'error':
        return <Badge className="bg-red-500/10 text-red-500 border-none rounded-full px-3 py-0.5 font-bold uppercase italic tracking-widest text-[9px]">Failed</Badge>;
      default:
        return <Badge className="bg-white/5 text-white/40 border-none rounded-full px-3 py-0.5 font-bold uppercase italic tracking-widest text-[9px]">{status}</Badge>;
    }
  };
  
  const formatCurrency = (amount: number, currency: string = 'NGN') => {
    if (currency === 'USDC' || currency === 'USD') {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    }
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
  };
  
  const LoadingSkeleton = ({ rows = 5 }) => (
    <div className="space-y-4">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-16 w-full rounded-2xl bg-white/[0.02]" />
      ))}
    </div>
  );
  
  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between border-b border-white/5 pb-8">
        <div className="space-y-1">
          <h2 className="text-xl font-black text-white italic tracking-tighter uppercase">Payment Overview</h2>
          <p className="text-white/40 text-xs italic">Real-time stats of platform revenue and asset flow.</p>
        </div>
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="bg-white/[0.02] border border-white/5 p-1 rounded-2xl h-12">
            <TabsTrigger value="overview" className="rounded-xl px-6 font-bold data-[state=active]:bg-white data-[state=active]:text-black transition-all uppercase italic tracking-tighter text-xs">Overview</TabsTrigger>
            <TabsTrigger value="transactions" className="rounded-xl px-6 font-bold data-[state=active]:bg-white data-[state=active]:text-black transition-all uppercase italic tracking-tighter text-xs">Ledger</TabsTrigger>
            <TabsTrigger value="producers" className="rounded-xl px-6 font-bold data-[state=active]:bg-white data-[state=active]:text-black transition-all uppercase italic tracking-tighter text-xs">Producers</TabsTrigger>
            <TabsTrigger value="buyers" className="rounded-xl px-6 font-bold data-[state=active]:bg-white data-[state=active]:text-black transition-all uppercase italic tracking-tighter text-xs">Buyers</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <div className="outline-none">
        {/* Overview Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-white/60 uppercase tracking-widest italic">Platform Health</h3>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => fetchOverviewStats()}
                disabled={isLoading}
                className="text-[#9A3BDC] hover:text-[#9A3BDC]/80 font-bold uppercase italic tracking-widest text-[10px] gap-2"
              >
                <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
                REFRESH
              </Button>
            </div>
            
            {isLoading && !overviewStats ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-[2rem] bg-white/[0.02]" />)}
              </div>
            ) : overviewStats ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  title="Paystack Yield"
                  value={formatCurrency(overviewStats.paystackRevenue, 'NGN')}
                  icon={<CreditCard className="h-5 w-5" />}
                  description={`${overviewStats.paystackOrders} Orders`}
                  variant="success"
                />
                <StatCard
                  title="USDC Liquidity"
                  value={formatCurrency(overviewStats.cryptoRevenue, 'USDC')}
                  icon={<Wallet className="h-5 w-5" />}
                  description={`${overviewStats.cryptoOrders} Orders`}
                  variant="success"
                />
                <StatCard
                  title="Total Users"
                  value={overviewStats.totalUsers}
                  icon={<Users className="h-5 w-5" />}
                />
                <StatCard
                  title="Total Producers"
                  value={overviewStats.totalProducers}
                  icon={<Users className="h-5 w-5" />}
                />
                <StatCard
                  title="Bank Linked"
                  value={overviewStats.producersWithBank}
                  icon={<Building2 className="h-5 w-5" />}
                  variant="success"
                />
                <StatCard
                  title="Wallet Linked"
                  value={overviewStats.producersWithCrypto}
                  icon={<Wallet className="h-5 w-5" />}
                  variant="success"
                />
                <StatCard
                  title="Pending Orders"
                  value={overviewStats.pendingOrders}
                  icon={<ShoppingCart className="h-5 w-5" />}
                  variant={overviewStats.pendingOrders > 0 ? 'warning' : 'default'}
                />
                <StatCard
                  title="Setup Required"
                  value={overviewStats.producersNeedingSetup}
                  icon={<AlertTriangle className="h-5 w-5" />}
                  variant={overviewStats.producersNeedingSetup > 0 ? 'danger' : 'default'}
                />
              </div>
            ) : null}
          </div>
        )}
        
        {/* Transactions Tab Content */}
        {activeTab === 'transactions' && (
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-1">
                <h3 className="text-sm font-black text-white/60 uppercase tracking-widest italic">Transaction Ledger</h3>
                <p className="text-white/20 text-[10px] italic">All platform payment transactions.</p>
              </div>
              <div className="flex items-center gap-4">
                <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); fetchTransactions(); }}>
                  <SelectTrigger className="w-[160px] h-12 rounded-2xl border-white/10 bg-white/[0.02] text-white font-bold uppercase italic tracking-tighter text-xs">
                    <SelectValue placeholder="Status Filter" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#030407] border-white/10 text-white">
                    <SelectItem value="all">ALL NODES</SelectItem>
                    <SelectItem value="completed">COMPLETED</SelectItem>
                    <SelectItem value="pending">PENDING</SelectItem>
                    <SelectItem value="failed">FAILED</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => fetchTransactions()}
                  disabled={isLoading}
                  className="h-12 w-12 rounded-2xl border-white/10 bg-white/[0.02] text-white hover:bg-white/5"
                >
                  <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
                </Button>
              </div>
            </div>

            {isLoading ? (
              <LoadingSkeleton rows={8} />
            ) : transactions.length > 0 ? (
              <div className="overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/5 hover:bg-transparent">
                      <TableHead className="text-white/30 font-black uppercase italic tracking-widest py-6 text-[10px]">Timestamp</TableHead>
                      <TableHead className="text-white/30 font-black uppercase italic tracking-widest py-6 text-[10px]">Source Agent</TableHead>
                      <TableHead className="text-white/30 font-black uppercase italic tracking-widest py-6 text-[10px]">Capital Flow</TableHead>
                      <TableHead className="text-white/30 font-black uppercase italic tracking-widest py-6 text-[10px]">Protocol</TableHead>
                      <TableHead className="text-white/30 font-black uppercase italic tracking-widest py-6 text-[10px]">Status</TableHead>
                      <TableHead className="text-white/30 font-black uppercase italic tracking-widest py-6 text-[10px]">Reference</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx) => (
                      <TableRow key={tx.id} className="border-white/5 hover:bg-white/[0.02] transition-colors group">
                        <TableCell className="text-white/40 font-bold italic py-6">
                          {tx.date ? format(new Date(tx.date), 'MMM d, HH:mm') : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-0.5">
                            <div className="font-black text-white italic tracking-tighter uppercase">{tx.buyer}</div>
                            <div className="text-[10px] text-white/20 font-bold italic truncate max-w-[150px]">{tx.buyer_email}</div>
                          </div>
                        </TableCell>
                        <TableCell className="font-black text-white italic tracking-tighter text-base">
                          {formatCurrency(tx.amount, tx.currency)}
                        </TableCell>
                        <TableCell>
                          <span className="text-[10px] font-black uppercase tracking-widest text-[#9A3BDC] italic">
                            {tx.payment_method}
                          </span>
                        </TableCell>
                        <TableCell>{getStatusBadge(tx.status)}</TableCell>
                        <TableCell className="text-[10px] text-white/20 font-mono italic">
                          {tx.reference.slice(0, 16).toUpperCase()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                <PaginationControls
                  currentPage={transactionsPagination.currentPage}
                  totalCount={transactionsPagination.totalCount}
                  pageSize={transactionsPagination.pageSize}
                  onPageChange={handleTransactionsPageChange}
                  isLoading={isLoading}
                />
              </div>
            ) : (
              <div className="text-center py-20 bg-white/[0.02] rounded-[2.5rem] border border-white/5">
                <AlertCircle className="h-12 w-12 text-white/10 mb-4 mx-auto" />
                <h3 className="text-xl font-black text-white italic tracking-tighter uppercase">No Transactions Yet</h3>
                <p className="text-white/30 italic">No transactions found.</p>
              </div>
            )}
          </div>
        )}
        
        {/* Producers Tab Content - similar refactor for other tabs... */}
        {activeTab === 'producers' && (
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                  <h3 className="text-sm font-black text-white/60 uppercase tracking-widest italic">Producers</h3>
                  <p className="text-white/20 text-[10px] italic">Manage producer payment settings and distribution setup.</p>
                </div>
                <div className="flex items-center gap-4">
                  <Select value={producerFilter} onValueChange={(val: 'all' | 'needs-setup') => setProducerFilter(val)}>
                    <SelectTrigger className="w-[180px] h-12 rounded-2xl border-white/10 bg-white/[0.02] text-white font-bold uppercase italic tracking-tighter text-xs">
                      <SelectValue placeholder="Filter" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#030407] border-white/10 text-white">
                      <SelectItem value="all">ALL STATUSES</SelectItem>
                      <SelectItem value="needs-setup">SETUP PENDING</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => fetchProducers()}
                    disabled={isLoading}
                    className="h-12 w-12 rounded-2xl border-white/10 bg-white/[0.02] text-white hover:bg-white/5"
                  >
                    <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
                  </Button>
                </div>
            </div>

            {isLoading ? (
                <LoadingSkeleton rows={8} />
            ) : producers.length === 0 ? (
                <div className="text-center py-20 bg-white/[0.02] rounded-[2.5rem] border border-white/5">
                  <AlertCircle className="h-12 w-12 text-white/10 mb-4 mx-auto" />
                  <h3 className="text-xl font-black text-white italic tracking-tighter uppercase">Node Scan: Results Zero</h3>
                  <p className="text-white/30 italic">{producerFilter === 'needs-setup' ? 'All nodes fully synchronized.' : 'No registered source nodes found.'}</p>
                </div>
            ) : (
                <div className="overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-white/5 hover:bg-transparent">
                          <TableHead className="text-white/30 font-black uppercase italic tracking-widest py-6 text-[10px]">Frequency Identification</TableHead>
                          <TableHead className="text-white/30 font-black uppercase italic tracking-widest py-6 text-[10px]">Legacy Node (Bank)</TableHead>
                          <TableHead className="text-white/30 font-black uppercase italic tracking-widest py-6 text-[10px]">Future Node (Web3)</TableHead>
                          <TableHead className="text-white/30 font-black uppercase italic tracking-widest py-6 text-[10px]">Verified Logic</TableHead>
                          <TableHead className="text-white/30 font-black uppercase italic tracking-widest py-6 px-8 text-right text-[10px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {producers.map((producer) => {
                          const hasBank = producer.bank_code && producer.account_number;
                          const hasCrypto = !!producer.wallet_address;
                          const needsSetup = !hasBank && !hasCrypto;
                          
                          return (
                            <TableRow key={producer.id} className="border-white/5 hover:bg-white/[0.02] transition-colors group">
                                <TableCell className="py-6">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-black text-white italic tracking-tighter uppercase text-base">{producer.stage_name || producer.full_name}</span>
                                            {needsSetup && <span className="bg-red-500/10 text-red-500 text-[8px] font-black uppercase italic tracking-widest px-2 py-0.5 rounded-full">INCOMPLETE</span>}
                                        </div>
                                        <span className="text-[10px] text-white/20 font-bold italic">{producer.email}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {hasBank ? (
                                        <div className="flex items-center gap-2 text-emerald-500">
                                            <CheckCircle size={14} />
                                            <span className="text-[10px] font-black uppercase italic tracking-widest">ENABLED</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-white/10">
                                            <XCircle size={14} />
                                            <span className="text-[10px] font-black uppercase italic tracking-widest">OFFLINE</span>
                                        </div>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {hasCrypto ? (
                                        <div className="flex items-center gap-2 text-[#9A3BDC]">
                                            <CheckCircle size={14} />
                                            <span className="text-[10px] font-black uppercase italic tracking-widest">SYNCED</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-white/10">
                                            <XCircle size={14} />
                                            <span className="text-[10px] font-black uppercase italic tracking-widest">VOX NULL</span>
                                        </div>
                                    )}
                                </TableCell>
                                <TableCell className="text-white/40 text-[10px] font-bold italic uppercase tracking-widest">
                                    {producer.verified_account_name || 'UNVERIFIED'}
                                </TableCell>
                                <TableCell className="text-right px-8">
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => {
                                        setActiveProducerId(producer.id);
                                        setIsEditDialogOpen(true);
                                      }}
                                      className="h-10 rounded-xl border-white/10 bg-white/[0.02] text-white hover:bg-white/5 font-bold uppercase italic tracking-tighter text-xs"
                                    >
                                      Edit Node Bank
                                    </Button>
                                </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                    
                    <PaginationControls
                      currentPage={producersPagination.currentPage}
                      totalCount={producersPagination.totalCount}
                      pageSize={producersPagination.pageSize}
                      onPageChange={handleProducersPageChange}
                      isLoading={isLoading}
                    />
                </div>
            )}
          </div>
        )}

        {/* Buyers Tab Content */}
        {activeTab === 'buyers' && (
           <div className="space-y-8">
             <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-sm font-black text-white/60 uppercase tracking-widest italic">Buyers</h3>
                  <p className="text-white/20 text-[10px] italic">Users who have made purchases on the platform.</p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => fetchBuyers()}
                  disabled={isLoading}
                  className="h-12 w-12 rounded-2xl border-white/10 bg-white/[0.02] text-white hover:bg-white/5"
                >
                  <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
                </Button>
             </div>

             {isLoading ? (
               <LoadingSkeleton rows={8} />
             ) : buyers.length > 0 ? (
                <div className="overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-white/5 hover:bg-transparent">
                          <TableHead className="text-white/30 font-black uppercase italic tracking-widest py-6 text-[10px]">Agent Identity</TableHead>
                          <TableHead className="text-white/30 font-black uppercase italic tracking-widest py-6 text-[10px]">Operations</TableHead>
                          <TableHead className="text-white/30 font-black uppercase italic tracking-widest py-6 text-[10px]">Capital Deployed</TableHead>
                          <TableHead className="text-white/30 font-black uppercase italic tracking-widest py-6 text-[10px]">Last Sync</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {buyers.map((buyer) => (
                           <TableRow key={buyer.id} className="border-white/5 hover:bg-white/[0.02] transition-colors group">
                               <TableCell className="py-6">
                                   <div className="flex flex-col gap-1">
                                       <span className="font-black text-white italic tracking-tighter uppercase text-base">{buyer.full_name}</span>
                                       <span className="text-[10px] text-white/20 font-bold italic">{buyer.email}</span>
                                   </div>
                               </TableCell>
                               <TableCell>
                                   <span className="text-lg font-black text-white italic tracking-tighter uppercase">{buyer.total_orders}</span>
                               </TableCell>
                               <TableCell>
                                   <span className="text-lg font-black text-[#9A3BDC] italic tracking-tighter uppercase">{formatCurrency(buyer.total_spent)}</span>
                               </TableCell>
                               <TableCell className="text-white/40 text-[10px] font-bold italic uppercase tracking-widest">
                                   {buyer.last_purchase ? format(new Date(buyer.last_purchase), 'MMM d, yyyy') : 'NEVER'}
                               </TableCell>
                           </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    
                    <PaginationControls
                      currentPage={buyersPagination.currentPage}
                      totalCount={buyersPagination.totalCount}
                      pageSize={buyersPagination.pageSize}
                      onPageChange={handleBuyersPageChange}
                      isLoading={isLoading}
                    />
                </div>
             ) : (
                <div className="text-center py-20 bg-white/[0.02] rounded-[2.5rem] border border-white/5">
                  <AlertCircle className="h-12 w-12 text-white/10 mb-4 mx-auto" />
                  <h3 className="text-xl font-black text-white italic tracking-tighter uppercase">No Buyers Found</h3>
                  <p className="text-white/30 italic">No buyers have made purchases yet.</p>
                </div>
             )}
           </div>
        )}
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md mx-auto bg-[#030407] border-white/10 text-white rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="text-xl font-black italic uppercase tracking-tighter">Edit Producer's Bank Info</DialogTitle>
            <DialogDescription className="text-white/40 italic">
              Update the producer's payment settlement configuration.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-6">
            {activeProducerId && (
              <ProducerBankDetailsForm 
                producerId={activeProducerId}
                onSuccess={() => {
                  setIsEditDialogOpen(false);
                  fetchProducers();
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
