
import React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface SectionTitleProps {
  title: string;
  icon?: React.ReactNode;
  className?: string;
  badge?: string;
}

export const SectionTitle: React.FC<SectionTitleProps> = ({ 
  title, 
  icon,
  badge,
  className 
}) => {
  return (
    <div className={cn("mb-4 flex items-center justify-between gap-3", className)}>
      <div className="flex items-center gap-3">
        {icon && (
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-primary">
            {icon}
          </span>
        )}
        <h2 className="text-xl md:text-2xl font-black tracking-tighter uppercase italic text-white/90">
          {title}
        </h2>
      </div>
      {badge && (
        <Badge variant="secondary" className="border-white/10 bg-white/[0.06] px-3 text-amber-300 hover:bg-white/[0.08]">
          {badge}
        </Badge>
      )}
    </div>
  );
};
