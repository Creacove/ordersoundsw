
import { Users } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useState, useEffect } from 'react';

interface FollowerCountProps {
  count: number;
  className?: string;
}

export function FollowerCount({ count, className = '' }: FollowerCountProps) {
  const [displayCount, setDisplayCount] = useState(count);
  
  // Format large numbers
  const formatCount = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };
  
  useEffect(() => {
    setDisplayCount(count);
  }, [count]);
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`flex items-center gap-2 text-white/40 text-[10px] font-black uppercase italic tracking-widest ${className}`}>
            <Users size={12} className="text-[#9A3BDC]" />
            <span className="text-white font-black">{formatCount(displayCount)}</span>
            <span>Follower{displayCount !== 1 ? 's' : ''}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent className="bg-[#0f111a] border-white/10 rounded-xl px-4 py-2">
          <p className="text-[10px] font-black uppercase italic tracking-widest text-white">
            {count.toLocaleString()} Total Follower{count !== 1 ? 's' : ''}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
