import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PaginationState {
  currentPage: number;
  pageSize: number;
  totalCount: number;
}

interface OverviewStats {
  paystackRevenue: number;
  cryptoRevenue: number;
  paystackOrders: number;
  cryptoOrders: number;
  completedOrders: number;
  pendingOrders: number;
  totalUsers: number;
  totalProducers: number;
  producersWithBank: number;
  producersWithCrypto: number;
  producersNeedingSetup: number;
}

interface BuyerData {
  id: string;
  full_name: string;
  email: string;
  total_orders: number;
  total_spent: number;
  last_purchase: string | null;
}

export function usePaystackAdmin() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [buyers, setBuyers] = useState<BuyerData[]>([]);
  const [overviewStats, setOverviewStats] = useState<OverviewStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [producerFilter, setProducerFilter] = useState<'all' | 'needs-setup'>('all');
  
  // Pagination states
  const [producersPagination, setProducersPagination] = useState<PaginationState>({
    currentPage: 1,
    pageSize: 20,
    totalCount: 0
  });
  
  const [transactionsPagination, setTransactionsPagination] = useState<PaginationState>({
    currentPage: 1,
    pageSize: 20,
    totalCount: 0
  });

  const [buyersPagination, setBuyersPagination] = useState<PaginationState>({
    currentPage: 1,
    pageSize: 20,
    totalCount: 0
  });
  
  // Fetch overview statistics
  const fetchOverviewStats = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Fetch all stats in parallel
      const [
        { count: completedCount },
        { count: pendingCount },
        { data: revenueData },
        { count: totalUsers },
        { count: totalProducers },
        { data: producersData }
      ] = await Promise.all([
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('orders').select('total_price, payment_method, currency_used').eq('status', 'completed'),
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'producer'),
        supabase.from('users').select('id, bank_code, account_number, wallet_address').eq('role', 'producer')
      ]);
      
      // Separate revenue by payment method
      const paystackOrders = revenueData?.filter(o => o.payment_method === 'Paystack') || [];
      const cryptoOrders = revenueData?.filter(o => o.payment_method === 'solana_usdc') || [];
      
      const paystackRevenue = paystackOrders.reduce((sum, order) => sum + (order.total_price || 0), 0);
      const cryptoRevenue = cryptoOrders.reduce((sum, order) => sum + (order.total_price || 0), 0);
      
      const producersWithBank = producersData?.filter(p => p.bank_code && p.account_number).length || 0;
      const producersWithCrypto = producersData?.filter(p => p.wallet_address).length || 0;
      const producersNeedingSetup = producersData?.filter(p => !p.bank_code && !p.wallet_address).length || 0;
      
      setOverviewStats({
        paystackRevenue,
        cryptoRevenue,
        paystackOrders: paystackOrders.length,
        cryptoOrders: cryptoOrders.length,
        completedOrders: completedCount || 0,
        pendingOrders: pendingCount || 0,
        totalUsers: totalUsers || 0,
        totalProducers: totalProducers || 0,
        producersWithBank,
        producersWithCrypto,
        producersNeedingSetup
      });
    } catch (error) {
      console.error('Error fetching overview stats:', error);
      toast.error('Failed to fetch overview statistics');
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Use React Query for producers with pagination and filter
  const { 
    data: producersData, 
    isLoading: producersLoading, 
    refetch: refetchProducers 
  } = useQuery({
    queryKey: ['admin-producers', producersPagination.currentPage, producersPagination.pageSize, producerFilter],
    queryFn: async () => {
      const offset = (producersPagination.currentPage - 1) * producersPagination.pageSize;
      
      // Build query based on filter
      let countQuery = supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'producer');
      let dataQuery = supabase
        .from('users')
        .select('id, full_name, email, stage_name, bank_code, account_number, verified_account_name, wallet_address, created_date')
        .eq('role', 'producer');
      
      if (producerFilter === 'needs-setup') {
        countQuery = countQuery.is('bank_code', null).is('wallet_address', null);
        dataQuery = dataQuery.is('bank_code', null).is('wallet_address', null);
      }
      
      const { count } = await countQuery;
      
      const { data, error } = await dataQuery
        .range(offset, offset + producersPagination.pageSize - 1)
        .order('created_date', { ascending: false });
      
      if (error) {
        console.error('Error fetching producers:', error);
        throw error;
      }
      
      setProducersPagination(prev => ({ ...prev, totalCount: count || 0 }));
      
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
  
  // Fetch buyers with order history
  const fetchBuyers = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const offset = (buyersPagination.currentPage - 1) * buyersPagination.pageSize;
      
      // Get buyers who have made orders
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select(`
          buyer_id,
          total_price,
          order_date,
          status,
          users:buyer_id (
            id,
            full_name,
            email
          )
        `)
        .eq('status', 'completed')
        .order('order_date', { ascending: false });
      
      if (error) throw error;
      
      // Aggregate by buyer
      const buyerMap = new Map<string, BuyerData>();
      
      ordersData?.forEach(order => {
        const user = order.users as any;
        if (!user) return;
        
        const existing = buyerMap.get(user.id);
        if (existing) {
          existing.total_orders += 1;
          existing.total_spent += order.total_price || 0;
          if (!existing.last_purchase || order.order_date > existing.last_purchase) {
            existing.last_purchase = order.order_date;
          }
        } else {
          buyerMap.set(user.id, {
            id: user.id,
            full_name: user.full_name,
            email: user.email,
            total_orders: 1,
            total_spent: order.total_price || 0,
            last_purchase: order.order_date
          });
        }
      });
      
      const buyersArray = Array.from(buyerMap.values())
        .sort((a, b) => b.total_spent - a.total_spent);
      
      setBuyersPagination(prev => ({ ...prev, totalCount: buyersArray.length }));
      setBuyers(buyersArray.slice(offset, offset + buyersPagination.pageSize));
    } catch (error) {
      console.error('Error fetching buyers:', error);
      toast.error('Failed to fetch buyers');
    } finally {
      setIsLoading(false);
    }
  }, [buyersPagination.currentPage, buyersPagination.pageSize]);
  
  // Fetch transactions with pagination and status filter
  const fetchTransactions = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const offset = (transactionsPagination.currentPage - 1) * transactionsPagination.pageSize;
      
      // Build query with optional status filter
      let countQuery = supabase.from('orders').select('*', { count: 'exact', head: true });
      let dataQuery = supabase.from('orders').select(`
        id,
        payment_reference,
        total_price,
        status,
        order_date,
        payment_method,
        currency_used,
        users:buyer_id (
          full_name,
          email
        )
      `);
      
      if (statusFilter !== 'all') {
        countQuery = countQuery.eq('status', statusFilter);
        dataQuery = dataQuery.eq('status', statusFilter);
      }
      
      const { count } = await countQuery;
      
      const { data: ordersData, error } = await dataQuery
        .order('order_date', { ascending: false })
        .range(offset, offset + transactionsPagination.pageSize - 1);
      
      if (error) throw error;
      
      // Transform for display
      const formattedTransactions = (ordersData || []).map(order => ({
        id: order.id,
        reference: order.payment_reference || `ORDER_${order.id.slice(0, 8)}`,
        buyer: (order.users as any)?.full_name || 'Unknown',
        buyer_email: (order.users as any)?.email || '',
        amount: order.total_price || 0,
        currency: order.currency_used || 'NGN',
        payment_method: order.payment_method || 'Unknown',
        status: order.status,
        date: order.order_date
      }));
      
      setTransactions(formattedTransactions);
      setTransactionsPagination(prev => ({ ...prev, totalCount: count || 0 }));
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Failed to fetch transactions');
    } finally {
      setIsLoading(false);
    }
  }, [transactionsPagination.currentPage, transactionsPagination.pageSize, statusFilter]);
  
  // Update a producer's bank details
  const updateProducerBankInfo = async (producerId: string, bankCode: string, accountNumber: string) => {
    try {
      setIsUpdating(true);
      
      const { error } = await supabase
        .from('users')
        .update({
          bank_code: bankCode,
          account_number: accountNumber
        })
        .eq('id', producerId);
      
      if (error) throw error;
      
      toast.success('Bank details updated successfully');
      refetchProducers();
      return true;
    } catch (error) {
      console.error('Error updating bank details:', error);
      toast.error('Failed to update bank details');
      return false;
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Pagination handlers
  const handleProducersPageChange = (page: number) => {
    setProducersPagination(prev => ({ ...prev, currentPage: page }));
  };
  
  const handleTransactionsPageChange = (page: number) => {
    setTransactionsPagination(prev => ({ ...prev, currentPage: page }));
  };

  const handleBuyersPageChange = (page: number) => {
    setBuyersPagination(prev => ({ ...prev, currentPage: page }));
  };
  
  return {
    transactions,
    buyers,
    overviewStats,
    producers: producersData || [],
    isLoading: isLoading || producersLoading,
    isUpdating,
    producersPagination,
    transactionsPagination,
    buyersPagination,
    statusFilter,
    producerFilter,
    setStatusFilter,
    setProducerFilter,
    fetchOverviewStats,
    fetchProducers: refetchProducers,
    fetchTransactions,
    fetchBuyers,
    updateProducerBankInfo,
    handleProducersPageChange,
    handleTransactionsPageChange,
    handleBuyersPageChange
  };
}
