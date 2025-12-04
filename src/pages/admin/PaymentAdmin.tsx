import React, { useEffect, useState } from 'react';
import { usePaystackAdmin } from '@/hooks/payment/usePaystackAdmin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-4">
      <div className="text-sm text-muted-foreground">
        Showing {startItem}-{endItem} of {totalCount} items
      </div>
      
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevious}
              disabled={currentPage <= 1 || isLoading}
              className="gap-1 pl-2.5"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
          </PaginationItem>
          
          {generatePageNumbers().map((pageNum) => (
            <PaginationItem key={pageNum}>
              <Button
                variant={currentPage === pageNum ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(pageNum)}
                disabled={isLoading}
                className="w-10 h-10"
              >
                {pageNum}
              </Button>
            </PaginationItem>
          ))}
          
          {totalPages > 5 && currentPage < totalPages - 2 && (
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
          )}
          
          <PaginationItem>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNext}
              disabled={currentPage >= totalPages || isLoading}
              className="gap-1 pr-2.5"
            >
              Next
              <ChevronRight className="h-4 w-4" />
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
  const variantStyles = {
    default: 'bg-card',
    success: 'bg-green-500/10 border-green-500/20',
    warning: 'bg-yellow-500/10 border-yellow-500/20',
    danger: 'bg-red-500/10 border-red-500/20'
  };
  
  return (
    <Card className={variantStyles[variant]}>
      <CardContent className="p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
          </div>
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
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
  
  // Load overview stats on mount
  useEffect(() => {
    fetchOverviewStats();
  }, [fetchOverviewStats]);
  
  // Smart tab loading
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
        return <Badge className="bg-green-500">Completed</Badge>;
      case 'pending':
      case 'processing':
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case 'failed':
      case 'error':
        return <Badge className="bg-red-500">Failed</Badge>;
      default:
        return <Badge className="bg-gray-500">{status}</Badge>;
    }
  };
  
  const formatCurrency = (amount: number, currency: string = 'NGN') => {
    if (currency === 'USDC' || currency === 'USD') {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    }
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
  };
  
  const LoadingSkeleton = ({ rows = 5 }) => (
    <div className="space-y-3">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Management
        </CardTitle>
        <CardDescription>
          Overview of platform transactions, producers, and buyers
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="flex flex-col sm:grid sm:grid-cols-4 w-full mb-8 h-auto gap-1">
            <TabsTrigger value="overview" className="text-xs sm:text-sm w-full">Overview</TabsTrigger>
            <TabsTrigger value="transactions" className="text-xs sm:text-sm w-full">Transactions</TabsTrigger>
            <TabsTrigger value="producers" className="text-xs sm:text-sm w-full">Producers</TabsTrigger>
            <TabsTrigger value="buyers" className="text-xs sm:text-sm w-full">Buyers</TabsTrigger>
          </TabsList>
          
          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Platform Overview</h3>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => fetchOverviewStats()}
                  disabled={isLoading}
                >
                  <RefreshCw size={16} className={isLoading ? "animate-spin mr-2" : "mr-2"} />
                  Refresh
                </Button>
              </div>
              
              {isLoading && !overviewStats ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : overviewStats ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Revenue breakdown by payment method */}
                  <StatCard
                    title="Paystack Revenue"
                    value={formatCurrency(overviewStats.paystackRevenue, 'NGN')}
                    icon={<CreditCard className="h-5 w-5 text-green-500" />}
                    description={`${overviewStats.paystackOrders} orders`}
                    variant="success"
                  />
                  <StatCard
                    title="Crypto Revenue"
                    value={formatCurrency(overviewStats.cryptoRevenue, 'USDC')}
                    icon={<Wallet className="h-5 w-5 text-purple-500" />}
                    description={`${overviewStats.cryptoOrders} orders`}
                    variant="success"
                  />
                  <StatCard
                    title="Completed Orders"
                    value={overviewStats.completedOrders}
                    icon={<CheckCircle className="h-5 w-5 text-green-500" />}
                  />
                  <StatCard
                    title="Pending Orders"
                    value={overviewStats.pendingOrders}
                    icon={<ShoppingCart className="h-5 w-5 text-yellow-500" />}
                    variant={overviewStats.pendingOrders > 0 ? 'warning' : 'default'}
                  />
                  <StatCard
                    title="Total Users"
                    value={overviewStats.totalUsers}
                    icon={<Users className="h-5 w-5 text-primary" />}
                  />
                  <StatCard
                    title="Total Producers"
                    value={overviewStats.totalProducers}
                    icon={<Users className="h-5 w-5 text-primary" />}
                  />
                  <StatCard
                    title="Producers with Bank"
                    value={overviewStats.producersWithBank}
                    icon={<Building2 className="h-5 w-5 text-green-500" />}
                  />
                  <StatCard
                    title="Producers with Crypto"
                    value={overviewStats.producersWithCrypto}
                    icon={<Wallet className="h-5 w-5 text-purple-500" />}
                  />
                  <StatCard
                    title="Need Payment Setup"
                    value={overviewStats.producersNeedingSetup}
                    icon={<AlertTriangle className="h-5 w-5 text-red-500" />}
                    variant={overviewStats.producersNeedingSetup > 0 ? 'danger' : 'default'}
                  />
                </div>
              ) : null}
            </div>
          </TabsContent>
          
          {/* Transactions Tab */}
          <TabsContent value="transactions">
            <div className="border rounded-lg p-4 md:p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
                <div>
                  <h3 className="text-lg font-semibold">All Transactions</h3>
                  <p className="text-sm text-muted-foreground">
                    Complete transaction history across all payment methods
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); fetchTransactions(); }}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Filter status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => fetchTransactions()}
                    disabled={isLoading}
                  >
                    <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
                  </Button>
                </div>
              </div>

              {isLoading ? (
                <LoadingSkeleton rows={5} />
              ) : transactions.length > 0 ? (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[100px]">Date</TableHead>
                          <TableHead className="min-w-[150px]">Buyer</TableHead>
                          <TableHead className="min-w-[120px]">Amount</TableHead>
                          <TableHead className="min-w-[100px]">Method</TableHead>
                          <TableHead className="min-w-[100px]">Status</TableHead>
                          <TableHead className="min-w-[120px]">Reference</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions.map((tx) => (
                          <TableRow key={tx.id}>
                            <TableCell className="text-sm">
                              {tx.date ? format(new Date(tx.date), 'MMM d, yyyy') : '-'}
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{tx.buyer}</div>
                                <div className="text-xs text-muted-foreground">{tx.buyer_email}</div>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">
                              {formatCurrency(tx.amount, tx.currency)}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">
                                {tx.payment_method}
                              </Badge>
                            </TableCell>
                            <TableCell>{getStatusBadge(tx.status)}</TableCell>
                            <TableCell className="text-xs text-muted-foreground font-mono">
                              {tx.reference.slice(0, 12)}...
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  
                  <PaginationControls
                    currentPage={transactionsPagination.currentPage}
                    totalCount={transactionsPagination.totalCount}
                    pageSize={transactionsPagination.pageSize}
                    onPageChange={handleTransactionsPageChange}
                    isLoading={isLoading}
                  />
                </>
              ) : (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mb-4 mx-auto" />
                  <h3 className="text-lg font-medium">No transactions found</h3>
                  <p className="text-muted-foreground">No transaction history available.</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* Producers Tab */}
          <TabsContent value="producers">
            <div className="border rounded-lg p-4 md:p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
                <div>
                  <h3 className="text-lg font-semibold">Producer Payment Status</h3>
                  <p className="text-sm text-muted-foreground">
                    View and manage producer payment setup
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={producerFilter} onValueChange={(val: 'all' | 'needs-setup') => setProducerFilter(val)}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter producers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Producers</SelectItem>
                      <SelectItem value="needs-setup">Needs Setup</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => fetchProducers()}
                    disabled={isLoading}
                  >
                    <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
                  </Button>
                </div>
              </div>

              {isLoading ? (
                <LoadingSkeleton rows={5} />
              ) : producers.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mb-4 mx-auto" />
                  <h3 className="text-lg font-medium">No producers found</h3>
                  <p className="text-muted-foreground">
                    {producerFilter === 'needs-setup' ? 'All producers have payment setup!' : 'No registered producers.'}
                  </p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[150px]">Producer</TableHead>
                          <TableHead className="min-w-[200px]">Email</TableHead>
                          <TableHead className="min-w-[100px]">Bank</TableHead>
                          <TableHead className="min-w-[100px]">Crypto</TableHead>
                          <TableHead className="min-w-[150px]">Verified Name</TableHead>
                          <TableHead className="min-w-[100px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {producers.map((producer) => {
                          const hasBank = producer.bank_code && producer.account_number;
                          const hasCrypto = !!producer.wallet_address;
                          const needsSetup = !hasBank && !hasCrypto;
                          
                          return (
                            <TableRow key={producer.id}>
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  {producer.stage_name || producer.full_name}
                                  {needsSetup && (
                                    <Badge variant="destructive" className="text-xs">
                                      Needs Setup
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="break-all text-sm">{producer.email}</TableCell>
                              <TableCell>
                                {hasBank ? (
                                  <CheckCircle className="h-5 w-5 text-green-500" />
                                ) : (
                                  <XCircle className="h-5 w-5 text-muted-foreground" />
                                )}
                              </TableCell>
                              <TableCell>
                                {hasCrypto ? (
                                  <CheckCircle className="h-5 w-5 text-purple-500" />
                                ) : (
                                  <XCircle className="h-5 w-5 text-muted-foreground" />
                                )}
                              </TableCell>
                              <TableCell className="text-sm">
                                {producer.verified_account_name || '-'}
                              </TableCell>
                              <TableCell>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    setActiveProducerId(producer.id);
                                    setIsEditDialogOpen(true);
                                  }}
                                >
                                  Edit Bank
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                  
                  <PaginationControls
                    currentPage={producersPagination.currentPage}
                    totalCount={producersPagination.totalCount}
                    pageSize={producersPagination.pageSize}
                    onPageChange={handleProducersPageChange}
                    isLoading={isLoading}
                  />
                </>
              )}
            </div>
          </TabsContent>
          
          {/* Buyers Tab */}
          <TabsContent value="buyers">
            <div className="border rounded-lg p-4 md:p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
                <div>
                  <h3 className="text-lg font-semibold">Buyers</h3>
                  <p className="text-sm text-muted-foreground">
                    Users who have purchased beats on the platform
                  </p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => fetchBuyers()}
                  disabled={isLoading}
                >
                  <RefreshCw size={16} className={isLoading ? "animate-spin mr-2" : "mr-2"} />
                  Refresh
                </Button>
              </div>

              {isLoading ? (
                <LoadingSkeleton rows={5} />
              ) : buyers.length > 0 ? (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[150px]">Name</TableHead>
                          <TableHead className="min-w-[200px]">Email</TableHead>
                          <TableHead className="min-w-[100px]">Orders</TableHead>
                          <TableHead className="min-w-[120px]">Total Spent</TableHead>
                          <TableHead className="min-w-[120px]">Last Purchase</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {buyers.map((buyer) => (
                          <TableRow key={buyer.id}>
                            <TableCell className="font-medium">{buyer.full_name}</TableCell>
                            <TableCell className="text-sm">{buyer.email}</TableCell>
                            <TableCell>{buyer.total_orders}</TableCell>
                            <TableCell className="font-medium">
                              {formatCurrency(buyer.total_spent)}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {buyer.last_purchase ? format(new Date(buyer.last_purchase), 'MMM d, yyyy') : '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  
                  <PaginationControls
                    currentPage={buyersPagination.currentPage}
                    totalCount={buyersPagination.totalCount}
                    pageSize={buyersPagination.pageSize}
                    onPageChange={handleBuyersPageChange}
                    isLoading={isLoading}
                  />
                </>
              ) : (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mb-4 mx-auto" />
                  <h3 className="text-lg font-medium">No buyers found</h3>
                  <p className="text-muted-foreground">No completed purchases yet.</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Edit Bank Details Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md mx-auto">
            <DialogHeader>
              <DialogTitle>Edit Bank Details</DialogTitle>
              <DialogDescription>
                Update the producer's bank account information
              </DialogDescription>
            </DialogHeader>
            
            {activeProducerId && (
              <ProducerBankDetailsForm 
                producerId={activeProducerId}
                onSuccess={() => {
                  setIsEditDialogOpen(false);
                  fetchProducers();
                }}
              />
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
