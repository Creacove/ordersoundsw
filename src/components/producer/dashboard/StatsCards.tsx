
import { formatCurrency, cn } from "@/lib/utils";
import { ProducerStats } from "@/lib/producerStats";
import { TrendingUp, TrendingDown, DollarSign, PlayCircle, ShoppingBag, Heart } from "lucide-react";

interface StatsCardsProps {
  stats: ProducerStats | null;
  isLoadingStats: boolean;
  currency: string;
}

export function StatsCards({ stats, isLoadingStats, currency }: StatsCardsProps) {
  const items = [
    {
      label: "Gross Revenue",
      value: isLoadingStats ? "..." : formatCurrency(stats?.totalRevenue || 0, currency),
      change: stats?.revenueChange || 0,
      icon: DollarSign,
      color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    },
    {
      label: "Studio Plays",
      value: isLoadingStats ? "..." : (stats?.totalPlays || 0).toLocaleString(),
      change: stats?.playsChange || 0,
      icon: PlayCircle,
      color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    },
    {
      label: "Projects Sold",
      value: isLoadingStats ? "..." : (stats?.beatsSold || 0).toLocaleString(),
      change: stats?.salesChange || 0,
      icon: ShoppingBag,
      color: "bg-primary/10 text-primary border-primary/20",
    },
    {
      label: "Studio Fans",
      value: isLoadingStats ? "..." : (stats?.totalFavorites || 0).toLocaleString(),
      change: stats?.favoritesChange || 0,
      icon: Heart,
      color: "bg-pink-500/10 text-pink-500 border-pink-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {items.map((item, i) => (
        <div key={i} className="bg-white/[0.03] border border-white/5 backdrop-blur-2xl rounded-[2.5rem] p-8 relative overflow-hidden group hover:border-white/10 transition-all duration-500">
          {/* Subtle hover glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[50px] rounded-full -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          
          <div className="flex flex-col gap-6 relative z-10">
            <div className="flex items-center justify-between">
              <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center border transition-transform duration-500 group-hover:scale-110", item.color)}>
                <item.icon className="h-6 w-6" />
              </div>
              {!isLoadingStats && stats && (
                <div className={cn(
                  "flex items-center gap-1 text-[10px] font-black px-3 py-1 rounded-full border italic tracking-widest",
                  item.change >= 0 
                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                    : "bg-red-500/10 text-red-500 border-red-500/20"
                )}>
                  {item.change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {Math.abs(item.change)}%
                </div>
              )}
            </div>
            
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 block italic">{item.label}</span>
              <div className="text-3xl font-black text-white tracking-tighter tabular-nums italic">
                {item.value}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
