import { Link } from "react-router-dom";
import { Sparkles, ChevronRight } from "lucide-react";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { BeatCardCompact } from "./BeatCardCompact";
import { fetchNewBeats } from "@/services/beats/queryService";
import { useMemo } from "react";
import { Beat } from "@/types";

export const NewBeats = () => {
  const { data: allNewBeats = [], isLoading } = useQuery({
    queryKey: ["new-beats-homepage"],
    queryFn: () => fetchNewBeats(15),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    placeholderData: keepPreviousData,
  }) as { data: Beat[]; isLoading: boolean };

  const newBeats = useMemo(() => allNewBeats.slice(0, 8), [allNewBeats]);

  return (
    <section className="panel p-5 md:p-6">
      <div className="mb-6 flex items-center justify-between gap-3">
        <SectionTitle
          title="Fresh drops"
          icon={<Sparkles className="h-5 w-5 text-accent" />}
          badge="Fresh"
          className="mb-0"
        />
        <Link to="/new" className="hidden items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:flex">
          View all
          <ChevronRight className="ml-1 h-4 w-4" />
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
          {Array(8)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="h-[280px] sm:h-[320px] rounded-[1.5rem] border border-white/10 bg-white/[0.05] animate-pulse" />
            ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
          {newBeats.map((beat) => (
            <BeatCardCompact key={beat.id} beat={beat} />
          ))}
        </div>
      )}
    </section>
  );
};
