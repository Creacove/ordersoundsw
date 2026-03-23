import { useNavigate } from "react-router-dom";
import { Beat } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, TrendingUp, Play, DollarSign, Crown, ArrowRight } from "lucide-react";

interface TopSellingBeatsProps {
  beats: Beat[];
}

export function TopSellingBeats({ beats }: TopSellingBeatsProps) {
  const navigate = useNavigate();
  const { currency } = useAuth();
  const [salesData, setSalesData] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);

  // Fetch actual completed sales data
  useEffect(() => {
    const fetchSalesData = async () => {
      if (beats.length === 0) {
        setLoading(false);
        return;
      }

      try {
        const beatIds = beats.map(beat => beat.id);
        
        const { data: completedSales, error } = await supabase
          .from('user_purchased_beats')
          .select(`
            beat_id,
            orders!inner(status)
          `)
          .in('beat_id', beatIds)
          .eq('orders.status', 'completed');

        if (error) {
          console.error('Error fetching sales data:', error);
          setLoading(false);
          return;
        }

        // Count completed sales per beat
        const salesCount = new Map<string, number>();
        completedSales?.forEach(sale => {
          const count = salesCount.get(sale.beat_id) || 0;
          salesCount.set(sale.beat_id, count + 1);
        });

        setSalesData(salesCount);
      } catch (error) {
        console.error('Error fetching sales data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSalesData();
  }, [beats]);

  const handleBeatClick = (beatId: string) => {
    navigate(`/beat/${beatId}`);
  };

  // Sort beats by actual completed sales count
  const sortedBeats = [...beats]
    .map(beat => ({
      ...beat,
      actualSales: salesData.get(beat.id) || 0
    }))
    .sort((a, b) => b.actualSales - a.actualSales)
    .slice(0, 5);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-black text-white italic tracking-tighter uppercase flex items-center gap-3">
            <Trophy className="h-5 w-5 text-amber-500" />
            Top Performing Projects
          </h3>
          <p className="text-[10px] font-black uppercase tracking-widest text-white/20 italic">Your catalog's highest engagement assets</p>
        </div>
      </div>

      <div className="flex-1 space-y-4">
        {loading ? (
          <div className="h-48 flex items-center justify-center">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 animate-pulse italic">Accessing Performance Records...</div>
          </div>
        ) : sortedBeats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 opacity-20 text-center space-y-3">
            <Crown size={32} />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] italic">No project data recorded.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {sortedBeats.map((beat, index) => (
              <div 
                key={beat.id} 
                className="group flex items-center gap-6 p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.05] transition-all duration-500 cursor-pointer overflow-hidden relative"
                onClick={() => handleBeatClick(beat.id)}
              >
                {/* Ranking indicator */}
                <div className="absolute top-0 right-0 p-4">
                  <span className="text-[40px] font-black text-white/[0.02] tracking-tighter transition-all duration-700 group-hover:text-white/[0.08] italic group-hover:scale-110">
                    0{index + 1}
                  </span>
                </div>

                <div className="relative shrink-0">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden border border-white/10 shadow-2xl transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
                    <img
                      src={beat.cover_image_url || '/placeholder.svg'}
                      alt={beat.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {index === 0 && (
                    <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-amber-500 border-2 border-[#030407] flex items-center justify-center shadow-lg shadow-amber-500/20">
                      <Crown className="h-3 w-3 text-white" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 relative z-10">
                  <p className="font-black text-lg text-white truncate tracking-tight group-hover:text-primary transition-colors mb-1 italic uppercase">
                    {beat.title}
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="h-3 w-3 text-emerald-500" />
                      <span className="text-[9px] font-black text-white/60 uppercase tracking-widest italic">{beat.actualSales} Sales</span>
                    </div>
                    <div className="h-1 w-1 rounded-full bg-white/10" />
                    <div className="flex items-center gap-1.5">
                      <Play className="h-3 w-3 text-blue-500" />
                      <span className="text-[9px] font-black text-white/30 uppercase tracking-widest italic">{beat.plays} Plays</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0 relative z-10 pr-2">
                  <p className="text-base font-black text-white tracking-tighter italic">
                    {currency === 'NGN' ? '₦' : '$'}
                    {(currency === 'NGN' ? 
                      beat.basic_license_price_local : 
                      beat.basic_license_price_diaspora || 0).toLocaleString()}
                  </p>
                  <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em] mt-0.5 italic">Floor Price</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {sortedBeats.length > 0 && (
        <button 
          onClick={() => navigate('/producer/beats')}
          className="mt-6 w-full py-4 rounded-2xl bg-white text-black text-[10px] font-black uppercase tracking-[0.2em] hover:bg-neutral-200 transition-all flex items-center justify-center gap-2 group shadow-xl shadow-white/5 active:scale-[0.98] italic"
        >
          Manage Full Catalog
          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
        </button>
      )}
    </div>
  );
}
