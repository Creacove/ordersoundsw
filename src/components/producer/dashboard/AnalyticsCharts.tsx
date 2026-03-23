
import { formatCurrency } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, BarChart as BarChartIcon } from "lucide-react";
import { ProducerStats } from "@/lib/producerStats";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar
} from "recharts";

interface AnalyticsChartsProps {
  stats: ProducerStats | null;
  isLoadingStats: boolean;
  currency: string;
}

export function AnalyticsCharts({ stats, isLoadingStats, currency }: AnalyticsChartsProps) {
  const currencySymbol = currency === 'NGN' ? '₦' : '$';

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h3 className="text-xl font-black text-white italic tracking-tighter uppercase">Studio Performance</h3>
          <p className="text-[10px] font-black uppercase tracking-widest text-white/20 italic">Monthly revenue and engagement trends</p>
        </div>
        
        <Tabs defaultValue="revenue" className="w-auto">
          <TabsList className="bg-white/5 border border-white/5 p-1 rounded-2xl h-10 w-auto">
            <TabsTrigger value="revenue" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white text-[10px] font-black uppercase tracking-widest h-8 px-4 transition-all italic">
              <LineChart size={12} className="mr-2" />
              Revenue
            </TabsTrigger>
            <TabsTrigger value="plays" className="rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white text-[10px] font-black uppercase tracking-widest h-8 px-4 transition-all italic">
              <BarChartIcon size={12} className="mr-2" />
              Plays
            </TabsTrigger>
          </TabsList>
          
          <div className="mt-8 flex-1 min-h-[300px]">
            <TabsContent value="revenue" className="h-[300px] mt-0 outline-none">
              {isLoadingStats ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 animate-pulse">Loading Revenue Data...</div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats?.revenueByMonth || []}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      fontSize={10}
                      fontWeight={900}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#ffffff20' }}
                      dy={10}
                      tickFormatter={(val) => val.toUpperCase()}
                    />
                    <YAxis 
                      fontSize={10}
                      fontWeight={900}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#ffffff20' }}
                      tickFormatter={(value) => `${currencySymbol}${Number(value).toLocaleString()}`}
                    />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-[#0f111a]/90 border border-white/10 p-4 rounded-2xl shadow-2xl backdrop-blur-xl">
                              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 italic">{payload[0].payload.name}</p>
                              <p className="text-xl font-black text-primary tracking-tighter italic">
                                {currencySymbol}{Number(payload[0].value).toLocaleString()}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#7C3AED"
                      strokeWidth={4}
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                      animationDuration={2000}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </TabsContent>
            
            <TabsContent value="plays" className="h-[300px] mt-0 outline-none">
              {isLoadingStats ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 animate-pulse">Loading Engagement Data...</div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={stats?.playsByMonth || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      fontSize={10}
                      fontWeight={900}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#ffffff20' }}
                      dy={10}
                      tickFormatter={(val) => val.toUpperCase()}
                    />
                    <YAxis 
                      fontSize={10}
                      fontWeight={900}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#ffffff20' }}
                    />
                    <Tooltip 
                      cursor={{ fill: '#ffffff05' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-[#0f111a]/90 border border-white/10 p-4 rounded-2xl shadow-2xl backdrop-blur-xl">
                              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 italic">{payload[0].payload.name}</p>
                              <p className="text-xl font-black text-blue-500 tracking-tighter italic">
                                {Number(payload[0].value).toLocaleString()} PLAYS
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar 
                      dataKey="value" 
                      fill="#3b82f6" 
                      radius={[8, 8, 0, 0]}
                      barSize={40}
                      animationDuration={2000}
                    />
                  </RechartsBarChart>
                </ResponsiveContainer>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
