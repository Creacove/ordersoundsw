import { supabase } from "./supabase";
import { calculatePercentageChange } from "./utils";

// Data points for monthly charts
export interface ChartDataPoint {
  name: string;
  value: number;
}

// Genre distribution data point
export interface GenreDataPoint {
  name: string;
  value: number;
}

export interface ProducerStats {
  totalRevenue: number;
  monthlyRevenue: number;
  beatsSold: number;
  revenueChange: number;
  salesChange: number;
  primaryCurrency: 'NGN' | 'USD';
  // Properties needed by dashboard components
  totalPlays: number;
  playsChange: number;
  totalFavorites: number;
  favoritesChange: number;
  revenueByMonth: ChartDataPoint[];
  playsByMonth: ChartDataPoint[];
  genreDistribution: GenreDataPoint[];
}

export async function getProducerStats(producerId: string): Promise<ProducerStats> {
  try {
    // Get producer's beats
    const { data: producerBeats, error: beatsError } = await supabase
      .from('beats')
      .select('id, plays, favorites_count, genre')
      .eq('producer_id', producerId);
    
    if (beatsError) throw beatsError;
    
    // Extract beat IDs
    const beatIds = producerBeats.map(beat => beat.id);
    
    if (beatIds.length === 0) {
      // Return default stats if producer has no beats
      return getDefaultStats();
    }

    // Calculate total plays
    const totalPlays = producerBeats.reduce((sum, beat) => sum + (beat.plays || 0), 0);
    
    // Calculate total favorites
    const totalFavorites = producerBeats.reduce((sum, beat) => sum + (beat.favorites_count || 0), 0);
    
    // Get total sales and revenue from COMPLETED purchases only
    const { data: salesData, error: salesError } = await supabase
      .from('user_purchased_beats')
      .select(`
        id, 
        beat_id, 
        purchase_date, 
        order_id, 
        orders!inner(id, total_price, currency_used, payment_method, status)
      `)
      .in('beat_id', beatIds)
      .eq('orders.status', 'completed'); // Only get completed orders
    
    if (salesError) throw salesError;
    
    // All sales are now guaranteed to be completed
    const completedSales = salesData || [];
    
    // Calculate total beats sold (count of completed sales)
    const beatsSold = completedSales.length;
    
    // Calculate total revenue from completed orders only
    let totalRevenue = 0;
    let ngnCount = 0;
    let usdCount = 0;
    
    // Create a Set to track unique order IDs to avoid double counting
    const processedOrderIds = new Set();
    
    // Process sales data to calculate revenue
    completedSales.forEach(sale => {
      if (sale.orders) {
        const orderData = sale.orders as any;
        
        // Only count each order once
        if (orderData.id && !processedOrderIds.has(orderData.id)) {
          totalRevenue += (orderData.total_price || 0);
          processedOrderIds.add(orderData.id);
          
          // Count currencies
          if (orderData.currency_used === 'NGN') {
            ngnCount++;
          } else if (orderData.currency_used === 'USD') {
            usdCount++;
          }
        }
      }
    });
    
    // Determine primary currency
    const primaryCurrency = ngnCount >= usdCount ? 'NGN' : 'USD';
    
    // Calculate monthly revenue and sales
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    
    // Current month start and end dates
    const currentMonthStart = new Date(currentYear, currentMonth, 1);
    const previousMonthStart = new Date(previousYear, previousMonth, 1);
    
    // Filter sales for current month
    const thisMonthSales = completedSales.filter(sale => {
      if (!sale.purchase_date) return false;
      const purchaseDate = new Date(sale.purchase_date);
      return purchaseDate >= currentMonthStart;
    });
    
    // Filter sales for previous month
    const lastMonthSales = completedSales.filter(sale => {
      if (!sale.purchase_date) return false;
      const purchaseDate = new Date(sale.purchase_date);
      return purchaseDate >= previousMonthStart && purchaseDate < currentMonthStart;
    });
    
    // Calculate plays and favorites changes (keep existing logic)
    const { data: currentMonthPlayData } = await supabase
      .from('beats')
      .select('plays')
      .eq('producer_id', producerId)
      .gte('updated_at', currentMonthStart.toISOString());
    
    const currentMonthPlays = currentMonthPlayData?.reduce((sum, beat) => sum + (beat.plays || 0), 0) || 0;
    
    const { data: previousMonthPlayData } = await supabase
      .from('beats')
      .select('plays')
      .eq('producer_id', producerId)
      .gte('updated_at', previousMonthStart.toISOString())
      .lt('updated_at', currentMonthStart.toISOString());
    
    const previousMonthPlays = previousMonthPlayData?.reduce((sum, beat) => sum + (beat.plays || 0), 0) || 0;
    
    const { data: currentMonthFavData } = await supabase
      .from('beats')
      .select('favorites_count')
      .eq('producer_id', producerId)
      .gte('updated_at', currentMonthStart.toISOString());
    
    const currentMonthFavorites = currentMonthFavData?.reduce((sum, beat) => sum + (beat.favorites_count || 0), 0) || 0;
    
    const { data: previousMonthFavData } = await supabase
      .from('beats')
      .select('favorites_count')
      .eq('producer_id', producerId)
      .gte('updated_at', previousMonthStart.toISOString())
      .lt('updated_at', currentMonthStart.toISOString());
    
    const previousMonthFavorites = previousMonthFavData?.reduce((sum, beat) => sum + (beat.favorites_count || 0), 0) || 0;
    
    // Calculate revenue for current month (from unique completed orders)
    let thisMonthRevenue = 0;
    const thisMonthOrderIds = new Set();
    
    thisMonthSales.forEach(sale => {
      if (sale.orders) {
        const orderData = sale.orders as any;
        
        if (orderData.id && !thisMonthOrderIds.has(orderData.id)) {
          thisMonthRevenue += (orderData.total_price || 0);
          thisMonthOrderIds.add(orderData.id);
        }
      }
    });
    
    // Calculate revenue for last month (from unique completed orders)
    let lastMonthRevenue = 0;
    const lastMonthOrderIds = new Set();
    
    lastMonthSales.forEach(sale => {
      if (sale.orders) {
        const orderData = sale.orders as any;
        
        if (orderData.id && !lastMonthOrderIds.has(orderData.id)) {
          lastMonthRevenue += (orderData.total_price || 0);
          lastMonthOrderIds.add(orderData.id);
        }
      }
    });
    
    // Calculate percentage changes
    const revenueChange = calculatePercentageChange(thisMonthRevenue, lastMonthRevenue);
    const salesChange = calculatePercentageChange(thisMonthSales.length, lastMonthSales.length);
    const playsChange = calculatePercentageChange(currentMonthPlays, previousMonthPlays);
    const favoritesChange = calculatePercentageChange(currentMonthFavorites, previousMonthFavorites);
    
    // Generate revenue by month data (only from completed orders)
    const revenueByMonth = await generateMonthlyRevenueData(completedSales, 6);
    
    // Generate plays by month data
    const playsByMonth = await generateMonthlyPlaysData(producerId, 6);
    
    // Generate genre distribution data (fixed to properly count genres)
    const genreDistribution = generateGenreDistribution(producerBeats);
    
    return {
      totalRevenue,
      monthlyRevenue: thisMonthRevenue,
      beatsSold,
      revenueChange,
      salesChange,
      primaryCurrency,
      totalPlays,
      playsChange,
      totalFavorites,
      favoritesChange,
      revenueByMonth,
      playsByMonth,
      genreDistribution
    };
  } catch (error) {
    console.error("Error getting producer stats:", error);
    return getDefaultStats();
  }
}

// Helper function to generate default stats
function getDefaultStats(): ProducerStats {
  return {
    totalRevenue: 0,
    monthlyRevenue: 0,
    beatsSold: 0,
    revenueChange: 0,
    salesChange: 0,
    primaryCurrency: 'NGN',
    totalPlays: 0,
    playsChange: 0,
    totalFavorites: 0,
    favoritesChange: 0,
    revenueByMonth: [],
    playsByMonth: [],
    genreDistribution: []
  };
}

// Helper function to generate monthly revenue data
async function generateMonthlyRevenueData(salesData: any[], monthsCount: number = 6): Promise<ChartDataPoint[]> {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const result: ChartDataPoint[] = [];
  
  const now = new Date();
  const currentMonth = now.getMonth();
  
  // Initialize the result array with empty values for each month
  for (let i = monthsCount - 1; i >= 0; i--) {
    const monthIndex = (currentMonth - i + 12) % 12;
    const monthName = months[monthIndex];
    result.push({ name: monthName, value: 0 });
  }
  
  // Track processed orders to avoid double counting
  const processedOrdersByMonth: Record<string, Set<string>> = {};
  
  // Calculate revenue for each month
  salesData.forEach(sale => {
    if (!sale.purchase_date || !sale.orders) return;
    
    // Use type assertion to handle the orders property correctly
    const orderData = sale.orders as any;
    
    // Skip if order is not completed or has no id or total_price
    if (orderData.status !== 'completed' || !orderData.id || orderData.total_price === undefined) return;
    
    const purchaseDate = new Date(sale.purchase_date);
    const purchaseMonth = purchaseDate.getMonth();
    const purchaseYear = purchaseDate.getFullYear();
    
    // Check if this month is within our range
    for (let i = monthsCount - 1; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      const monthYear = new Date(
        now.getFullYear(), 
        monthIndex < currentMonth ? now.getFullYear() : now.getFullYear() - 1
      ).getFullYear();
      
      if (purchaseMonth === monthIndex && purchaseYear === monthYear) {
        const monthKey = `${monthYear}-${monthIndex}`;
        
        // Initialize the set if it doesn't exist
        processedOrdersByMonth[monthKey] = processedOrdersByMonth[monthKey] || new Set();
        
        // Only count each order once per month
        if (!processedOrdersByMonth[monthKey].has(orderData.id)) {
          // Add to the correct month's value
          const monthPosition = monthsCount - 1 - i;
          result[monthPosition].value += (orderData.total_price || 0);
          
          // Mark this order as processed for this month
          processedOrdersByMonth[monthKey].add(orderData.id);
        }
      }
    }
  });
  
  return result;
}

// Helper function to generate monthly plays data
async function generateMonthlyPlaysData(producerId: string, monthsCount: number = 6): Promise<ChartDataPoint[]> {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date();
  const currentMonth = now.getMonth();
  
  // Initialize result array with months
  const result: ChartDataPoint[] = [];
  for (let i = monthsCount - 1; i >= 0; i--) {
    const monthIndex = (currentMonth - i + 12) % 12;
    result.push({ name: months[monthIndex], value: 0 });
  }

  try {
    // Fetch beats with play count data
    const { data: beats, error } = await supabase
      .from('beats')
      .select('plays, upload_date')
      .eq('producer_id', producerId);
      
    if (error) throw error;
    if (!beats || beats.length === 0) return result;
    
    // Process plays data by month
    beats.forEach(beat => {
      if (!beat.upload_date || beat.plays === undefined) return;
      
      const uploadDate = new Date(beat.upload_date);
      const uploadMonth = uploadDate.getMonth();
      const uploadYear = uploadDate.getFullYear();
      
      // Check if this month is within our range
      for (let i = monthsCount - 1; i >= 0; i--) {
        const monthIndex = (currentMonth - i + 12) % 12;
        const monthYear = new Date(
          now.getFullYear(), 
          monthIndex < currentMonth ? now.getFullYear() : now.getFullYear() - 1
        ).getFullYear();
        
        if (uploadMonth === monthIndex && uploadYear === monthYear) {
          // Add plays to the correct month
          const monthPosition = monthsCount - 1 - i;
          result[monthPosition].value += (beat.plays || 0);
          break;
        }
      }
    });
    
    return result;
  } catch (error) {
    console.error("Error generating monthly plays data:", error);
    return result;
  }
}

// Fixed helper function to generate genre distribution data
function generateGenreDistribution(beats: any[]): GenreDataPoint[] {
  if (!beats || beats.length === 0) {
    return [];
  }

  const genreCounts: Record<string, number> = {};
  
  beats.forEach(beat => {
    if (beat.genre && beat.genre.trim()) {
      const genre = beat.genre.trim();
      genreCounts[genre] = (genreCounts[genre] || 0) + 1;
    }
  });
  
  // Convert to array and sort by count
  return Object.entries(genreCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5); // Top 5 genres
}
