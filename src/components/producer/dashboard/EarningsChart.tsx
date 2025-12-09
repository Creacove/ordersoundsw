
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartDataPoint } from "@/lib/producerStats";
import { TrendingUp, DollarSign } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";

interface EarningsChartProps {
    data: ChartDataPoint[];
    loading?: boolean;
    currency: string;
}

export function EarningsChart({ data, loading, currency }: EarningsChartProps) {
    // Check if there is any actual data (non-zero values)
    const hasData = data && data.some(point => point.value > 0);

    if (loading) {
        return (
            <Card className="col-span-4">
                <CardHeader>
                    <div className="h-6 w-48 bg-muted animate-pulse rounded"></div>
                    <div className="h-4 w-72 bg-muted animate-pulse rounded mt-2"></div>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] w-full bg-muted/20 animate-pulse rounded-lg flex items-center justify-center">
                        <TrendingUp className="h-10 w-10 text-muted-foreground/20" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Calculate total for the period
    const totalForPeriod = data.reduce((sum, item) => sum + item.value, 0);

    return (
        <Card className="col-span-4">
            <CardHeader>
                <CardTitle>Earnings Overview</CardTitle>
                <CardDescription>
                    Your revenue performance over the last 6 months ({currency})
                </CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
                {!hasData ? (
                    <div className="h-[300px] w-full flex flex-col items-center justify-center border-2 border-dashed rounded-lg bg-muted/5">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                            <DollarSign className="h-6 w-6 text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground">No earnings yet</h3>
                        <p className="text-sm text-muted-foreground max-w-sm text-center mt-2 mb-6">
                            Start uploading beats and sharing your profile to generate revenue. Your earnings data will appear here once you make your first sale.
                        </p>
                    </div>
                ) : (
                    <div className="h-[300px] w-full">
                        <div className="mb-4 ml-4">
                            <span className="text-2xl font-bold">{formatCurrency(totalForPeriod, currency)}</span>
                            <span className="text-sm text-muted-foreground ml-2">total past 6 months</span>
                        </div>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                                data={data}
                                margin={{
                                    top: 5,
                                    right: 10,
                                    left: 0,
                                    bottom: 0,
                                }}
                            >
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                <XAxis
                                    dataKey="name"
                                    stroke="#888888"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="#888888"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => formatCurrency(value, currency)}
                                />
                                <Tooltip
                                    content={({ active, payload, label }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="rounded-lg border bg-background p-2 shadow-sm">
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div className="flex flex-col">
                                                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                                                                {label}
                                                            </span>
                                                            <span className="font-bold text-muted-foreground">
                                                                {formatCurrency(payload[0].value as number, currency)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke="hsl(var(--primary))"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorRevenue)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
