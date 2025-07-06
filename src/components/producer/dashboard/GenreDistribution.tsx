
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ProducerStats } from "@/lib/producerStats";
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip
} from "recharts";

const COLORS = ["#7C3AED", "#8B5CF6", "#A78BFA", "#C4B5FD", "#DDD6FE"];

interface GenreDistributionProps {
  stats: ProducerStats | null;
  isLoadingStats: boolean;
}

export function GenreDistribution({ stats, isLoadingStats }: GenreDistributionProps) {
  const hasGenreData = stats?.genreDistribution && stats.genreDistribution.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Genre Distribution</CardTitle>
        <CardDescription>Distribution of your beats by genre</CardDescription>
      </CardHeader>
      <CardContent className="h-[300px] flex items-center justify-center">
        {isLoadingStats ? (
          <div className="text-sm text-muted-foreground">Loading genre data...</div>
        ) : !hasGenreData ? (
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">No genre data available</p>
            <p className="text-xs text-muted-foreground">Add genres to your beats to see distribution</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart>
              <Pie
                data={stats.genreDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => 
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
              >
                {stats.genreDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value, name) => [value, `${name} beats`]}
                contentStyle={{ 
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px'
                }}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                wrapperStyle={{ fontSize: '12px' }}
              />
            </RechartsPieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
