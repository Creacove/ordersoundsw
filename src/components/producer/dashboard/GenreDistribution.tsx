
import { ProducerStats } from "@/lib/producerStats";
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Sector
} from "recharts";
import { useState } from "react";

const COLORS = ["#7C3AED", "#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

interface GenreDistributionProps {
  stats: ProducerStats | null;
  isLoadingStats: boolean;
}

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent } = props;

  return (
    <g>
      <text x={cx} y={cy - 10} dy={8} textAnchor="middle" fill="#ffffff" className="font-black text-2xl tracking-tighter uppercase italic">
        {payload.name}
      </text>
      <text x={cx} y={cy + 20} dy={8} textAnchor="middle" fill="#ffffff40" className="font-black text-[10px] uppercase tracking-widest italic">
        {`${(percent * 100).toFixed(0)}%`} OF CATALOG
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 14}
        outerRadius={outerRadius + 16}
        fill={fill}
      />
    </g>
  );
};

export function GenreDistribution({ stats, isLoadingStats }: GenreDistributionProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const hasGenreData = stats?.genreDistribution && stats.genreDistribution.length > 0;

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-black text-white italic tracking-tighter uppercase">Catalog Mix</h3>
          <p className="text-[10px] font-black uppercase tracking-widest text-white/20 italic">Genre distribution analysis</p>
        </div>
      </div>

      <div className="flex-1 min-h-[300px] flex items-center justify-center relative">
        {isLoadingStats ? (
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 animate-pulse text-center italic">
            Parsing Catalog Data...
          </div>
        ) : !hasGenreData ? (
          <div className="text-center space-y-4">
            <div className="h-16 w-16 rounded-[2rem] bg-white/5 border border-white/5 flex items-center justify-center mx-auto">
              <span className="text-white/20 text-2xl font-black italic">?</span>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 italic">Empty catalog records.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart>
              <Pie
                activeIndex={activeIndex}
                activeShape={renderActiveShape}
                data={stats.genreDistribution}
                cx="50%"
                cy="50%"
                innerRadius={75}
                outerRadius={100}
                paddingAngle={6}
                dataKey="value"
                onMouseEnter={onPieEnter}
                animationDuration={2000}
              >
                {stats.genreDistribution.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]} 
                    stroke="rgba(0,0,0,0.5)"
                    strokeWidth={4}
                  />
                ))}
              </Pie>
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-[#0f111a]/90 border border-white/10 p-4 rounded-2xl shadow-2xl backdrop-blur-xl">
                        <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1 italic">{payload[0].name}</p>
                        <p className="text-lg font-black text-white tracking-tighter italic">
                          {payload[0].value} PROJECTS
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </RechartsPieChart>
          </ResponsiveContainer>
        )}
      </div>
      
      {hasGenreData && (
        <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-3">
          {stats.genreDistribution.map((entry, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full shadow-[0_0_8px] shadow-current" style={{ backgroundColor: COLORS[index % COLORS.length], color: COLORS[index % COLORS.length] }} />
              <span className="text-[9px] font-black uppercase tracking-widest text-white/60 italic">{entry.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
