
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Music, TrendingUp, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { FollowButton } from "@/components/buttons/FollowButton";
import { FollowerCount } from "@/components/producer/profile/FollowerCount";
import { Producer } from "@/hooks/useProducers";
import { Skeleton } from "@/components/ui/skeleton";

interface ProducersListProps {
  producers: Producer[];
  isLoading: boolean;
  isMobile: boolean;
  searchQuery: string;
  showFollowedContent?: boolean;
  user: any;
}

export function ProducersList({
  producers,
  isLoading,
  isMobile,
  searchQuery,
  showFollowedContent,
  user
}: ProducersListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  const isEmptyState = showFollowedContent && producers.length === 0;
  const isEmptySearch = producers.length === 0 && searchQuery.trim() !== '';
  
  if (isEmptyState) {
    return (
      <div className="flex flex-col items-center justify-center py-16 bg-[#121212] rounded-xl">
        <div className="text-center max-w-md px-4">
          <h3 className="text-xl font-semibold mb-2">
            {user ? "You're not following any producers yet" : "Sign in to see producers you follow"}
          </h3>
          <p className="text-gray-400 mb-6">
            {user 
              ? "Discover producers and follow them to stay updated with new beats"
              : "Create an account or sign in to follow your favorite producers"
            }
          </p>
        </div>
      </div>
    );
  }
  
  if (isEmptySearch) {
    return (
      <div className="flex flex-col items-center justify-center py-16 bg-[#121212] rounded-xl">
        <div className="text-center max-w-md px-4">
          <h3 className="text-xl font-semibold mb-2">No producers found</h3>
          <p className="text-gray-400 mb-6">
            No producers match your search for "{searchQuery}"
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {producers.map((producer) => (
        <Link 
          to={`/producer/${producer.id}`}
          key={producer.id} 
          className="group relative flex items-center p-4 sm:p-6 bg-white/[0.02] border border-white/5 rounded-[2rem] hover:bg-white/[0.06] hover:border-white/10 transition-all duration-300 overflow-hidden"
        >
          {/* Subtle background glow on hover */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#9A3BDC]/5 blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity rounded-full pointer-events-none" />
          
          <div className="relative z-10 flex items-center w-full">
            <div className="relative shrink-0 mr-5">
              <div className="absolute inset-0 bg-[#9A3BDC]/10 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              <Avatar className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl border-2 border-white/5 group-hover:border-[#9A3BDC]/30 transition-colors">
                <AvatarImage 
                  src={producer.profile_picture || `https://api.dicebear.com/7.x/initials/svg?seed=${producer.full_name}`}
                  alt={producer.stage_name || producer.full_name} 
                  className="object-cover"
                />
                <AvatarFallback className="bg-[#1A1B1E] text-white font-black italic tracking-tighter text-xl">
                  {(producer.stage_name || producer.full_name || 'P').charAt(0)}
                </AvatarFallback>
              </Avatar>
              
              {/* Active Indicator Overlay */}
              {producer.beatCount > 10 && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-lg bg-[#9A3BDC] border-2 border-[#030407] flex items-center justify-center shadow-lg">
                  <Zap size={10} className="text-white fill-white" />
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0 pr-1">
              <div className="flex items-center flex-wrap gap-2 mb-1">
                <h3 className="font-extrabold text-[11px] sm:text-xl text-white italic uppercase tracking-tighter leading-none group-hover:text-[#9A3BDC] transition-colors truncate">
                  {producer.stage_name || producer.full_name}
                </h3>

                {producer.beatCount > 20 && (
                   <span className="text-[8px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 italic">Top Producer</span>
                )}
              </div>
              
              <div className="flex flex-wrap items-center gap-3 mt-2 mb-3">
                <div className="flex items-center gap-1.5 text-[10px] font-black text-white/40 uppercase italic tracking-widest">
                  <Music className="h-3 w-3 text-[#9A3BDC]" />
                  <span>{producer.beatCount} Beats</span>
                </div>
                <div className="w-1 h-1 rounded-full bg-white/10" />
                <FollowerCount 
                  count={producer.follower_count || 0} 
                  className="text-[10px] text-white/40 font-black uppercase italic tracking-widest"
                />
              </div>

              {producer.bio && (
                <p className="text-white/20 text-xs italic font-medium line-clamp-1 group-hover:text-white/40 transition-colors uppercase tracking-tight">
                  "{producer.bio}"
                </p>
              )}
            </div>
            
            <div onClick={(e) => e.stopPropagation()} className="shrink-0">
              <FollowButton 
                producerId={producer.id}
                size="sm"
                variant="outline"
                className="rounded-xl h-10 px-3 sm:px-5 bg-white/5 border-white/5 text-[10px] font-black uppercase italic tracking-widest hover:bg-white/10 hover:border-white/20 transition-all"
              />
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
