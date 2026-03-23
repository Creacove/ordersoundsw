import { Link } from "react-router-dom";
import { TrendingUp, ChevronRight } from "lucide-react";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { BeatCardCompact } from "./BeatCardCompact";
import { fetchTrendingBeats } from "@/services/beats";
import { useMemo } from "react";
import { Beat } from "@/types";

export const TrendingBeats = () => {
  const { data: allTrendingBeats = [], isLoading } = useQuery({
    queryKey: ["curated-trending-beats"],
    queryFn: () => fetchTrendingBeats(20),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    placeholderData: keepPreviousData,
  }) as { data: Beat[]; isLoading: boolean };

  const trendingBeats = useMemo(() => allTrendingBeats.slice(0, 5), [allTrendingBeats]);

  return (
    <section className="panel p-5 md:p-6">
      <div className="mb-6 flex items-center justify-between gap-3">
        <SectionTitle
          title="Trending beats"
          icon={<TrendingUp className="h-5 w-5 text-accent" />}
          badge="Hot"
          className="mb-0"
        />
        <Link to="/trending" className="hidden items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:flex">
          View all
          <ChevronRight className="ml-1 h-4 w-4" />
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {Array(5)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="h-[320px] rounded-[1.5rem] border border-white/10 bg-white/[0.05] animate-pulse" />
            ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {trendingBeats.map((beat) => (
            <BeatCardCompact key={beat.id} beat={beat} />
          ))}
        </div>
      )}
    </section>
  );
};
