
import { useState } from "react";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, X, TrendingUp, Zap } from "lucide-react";
import { toast } from "sonner";
import { FollowButton } from "@/components/buttons/FollowButton";
import { FollowerCount } from "@/components/producer/profile/FollowerCount";
import { Producer } from "@/hooks/useProducers";

interface SuggestedProducersProps {
  producers: Producer[];
  onDismiss: (id: string) => void;
  onShuffle: () => void;
}

export function SuggestedProducers({ producers, onDismiss, onShuffle }: SuggestedProducersProps) {
  if (producers.length === 0) {
    return null;
  }
  
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end px-2">
        <div className="space-y-1">
          <h2 className="text-xl font-black text-white italic tracking-tighter uppercase">Suggested for you</h2>
          <p className="text-white/20 text-[10px] font-black uppercase tracking-widest italic">Curated based on platform activity</p>
        </div>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={onShuffle}
          className="text-white/40 hover:text-[#9A3BDC] hover:bg-[#9A3BDC]/5 font-black uppercase italic tracking-widest text-[9px] gap-2 transition-all"
        >
          <RefreshCw className="h-3 w-3" />
          Shuffle
        </Button>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4 px-1">
        {producers.map((producer) => (
          <div 
            key={producer.id} 
            className="group relative flex flex-col items-center"
          >
            {/* Action Buttons */}
            <div className="absolute top-0 right-0 z-20 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300">
               <button 
                className="bg-black/80 p-1.5 rounded-lg border border-white/10 text-white/40 hover:text-white transition-colors backdrop-blur-md" 
                aria-label="Dismiss"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDismiss(producer.id);
                }}
              >
                <X size={12} />
              </button>
            </div>

            <Link to={`/producer/${producer.id}`} className="w-full flex flex-col items-center gap-4 transition-all duration-500 hover:-translate-y-2">
              <div className="relative">
                {/* Glow behind avatar */}
                <div className="absolute inset-0 bg-[#9A3BDC]/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="relative p-1 rounded-3xl bg-gradient-to-br from-white/20 to-transparent group-hover:from-[#9A3BDC]/40 transition-colors shadow-2xl">
                  <Avatar className="h-20 w-20 md:h-24 md:w-24 rounded-2xl border-2 border-[#030407]">
                    <AvatarImage 
                      src={producer.profile_picture || `https://api.dicebear.com/7.x/initials/svg?seed=${producer.full_name}`}
                      alt={producer.stage_name || producer.full_name} 
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-[#1A1B1E] text-white font-black italic tracking-tighter text-xl">
                      {(producer.stage_name || producer.full_name || 'P').charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  
                  {/* Active Indicator */}
                  {producer.beatCount > 10 && (
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-[#9A3BDC] border-2 border-[#030407] flex items-center justify-center shadow-lg">
                      <Zap size={10} className="text-white fill-white" />
                    </div>
                  )}
                </div>
              </div>
              
              <div className="text-center space-y-1 w-full px-2">
                <h3 className="text-[10px] sm:text-sm font-extrabold text-white italic uppercase tracking-tighter uppercase truncate leading-none">
                  {producer.stage_name || producer.full_name}
                </h3>
                
                <div className="flex flex-col items-center gap-1.5">
                   <div className="text-[8px] font-black uppercase tracking-widest text-white/30 italic flex items-center gap-2">
                     <span className="text-[#9A3BDC]">{producer.beatCount}</span> BEATS
                   </div>
                   
                   <FollowerCount
                    count={producer.follower_count || 0}
                    className="text-[8px] text-white/20 font-black uppercase tracking-widest italic"
                  />
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
