import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Crown, ChevronRight, Music2 } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { useProducers } from "@/hooks/useProducers";

export const TopProducers = () => {
  const { producers } = useProducers();
  const topProducers = useMemo(() => {
    if (!producers) return [];
    return [...producers]
      .sort((a, b) => b.beatCount - a.beatCount)
      .slice(0, 4);
  }, [producers]);

  return (
    <section className="panel p-5 md:p-6">
      <div className="mb-6 flex items-center justify-between gap-3">
        <SectionTitle
          title="Producer spotlight"
          icon={<Crown className="h-5 w-5 text-amber-300" />}
          badge="Curated"
          className="mb-0"
        />
        <Link to="/producers" className="hidden items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:flex">
          View all
          <ChevronRight className="ml-1 h-4 w-4" />
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {topProducers.map((producer) => (
          <Link
            key={producer.id}
            to={`/producer/${producer.id}`}
            className="group rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-4 transition-all duration-300 hover:-translate-y-1 hover:border-white/18 hover:bg-white/[0.07]"
          >
            <div className="flex items-start gap-4">
              <Avatar className="h-14 w-14 border border-white/10">
                <AvatarImage src={producer.profile_picture || ""} alt={producer.stage_name || producer.full_name} />
                <AvatarFallback>{(producer.stage_name || producer.full_name)?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="truncate text-base font-semibold tracking-[-0.03em] text-white">
                    {producer.stage_name || producer.full_name}
                  </h3>
                  <Badge variant="outline" className="text-amber-300">
                    Active
                  </Badge>
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {producer.bio || "Building a focused catalog with premium-ready releases."}
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3">
              <div className="panel-muted px-3 py-3">
                <div className="flex items-center gap-2 text-[0.68rem] uppercase tracking-[0.18em] text-muted-foreground">
                  <Music2 className="h-3.5 w-3.5 text-accent" />
                  Catalog
                </div>
                <div className="mt-1 text-sm font-semibold text-white">{producer.beatCount} published beats</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};
