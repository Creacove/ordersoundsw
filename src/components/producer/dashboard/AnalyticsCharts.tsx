
import { formatCurrency } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, LineChart } from "lucide-react";
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
  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle>Analytics</CardTitle>
        <CardDescription>Track your beat performance metrics</CardDescription>
        <Tabs defaultValue="revenue">
          <TabsList>
            <TabsTrigger value="revenue" className="gap-1">
              <LineChart size={14} />
              <span>Revenue</span>
            </TabsTrigger>
            <TabsTrigger value="plays" className="gap-1">
              <BarChart size={14} />
              <span>Plays</span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="revenue" className="h-80">
            {isLoadingStats ? (
              <div className="h-full flex items-center justify-center">Loading...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats?.revenueByMonth || []}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <CartesianGrid strokeDasharray="3 3" />
                  <Tooltip formatter={(value) => [formatCurrency(Number(value), currency), "Revenue"]} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#7C3AED"
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </TabsContent>
          <TabsContent value="plays" className="h-80">
            {isLoadingStats ? (
              <div className="h-full flex items-center justify-center">Loading...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={stats?.playsByMonth || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [value, "Plays"]} />
                  <Bar dataKey="value" fill="#7C3AED" />
                </RechartsBarChart>
              </ResponsiveContainer>
            )}
          </TabsContent>
        </Tabs>
      </CardHeader>
    </Card>
  );
}
