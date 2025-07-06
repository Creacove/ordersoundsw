
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ProducerStats } from "@/lib/producerStats";
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend,
  ResponsiveContainer
} from "recharts";

const COLORS = ["#7C3AED", "#8B5CF6", "#A78BFA", "#C4B5FD", "#DDD6FE"];

interface GenreDistributionProps {
  stats: ProducerStats | null;
  isLoadingStats: boolean;
}

export function GenreDistribution({ stats, isLoadingStats }: GenreDistributionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Genre Distribution</CardTitle>
        <CardDescription>Sales by genre</CardDescription>
      </CardHeader>
      <CardContent className="h-[300px] flex items-center justify-center">
        {isLoadingStats ? (
          <div>Loading...</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart>
              <Pie
                data={stats?.genreDistribution || []}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {stats?.genreDistribution?.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Legend />
            </RechartsPieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
