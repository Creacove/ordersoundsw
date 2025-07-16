
import { useProducers } from "@/hooks/useProducers";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { Crown, ChevronRight } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Link } from "react-router-dom";
import { useMemo } from "react";

export const TopProducers = () => {
  const { producers, isLoading } = useProducers();
  const topProducers = useMemo(() => {
    if (!producers) return [];
    return [...producers]
      .sort((a, b) => b.beatCount - a.beatCount)
      .slice(0, 10);
  }, [producers]);

  return (
    <section className="w-full">
      <div className="flex items-center justify-between mb-6">
        <SectionTitle 
          title="Top Producers" 
          icon={<Crown className="w-5 h-5 text-amber-500" />}
          badge="Trending"
        />
        <Link to="/producers" className="flex items-center text-sm text-muted-foreground hover:text-primary">
          View all <ChevronRight className="w-4 h-4 ml-1" />
        </Link>
      </div>

      <div className="flex space-x-4 overflow-x-auto pb-4">
        {topProducers.map((producer) => (
          <Link
            key={producer.id}
            to={`/producer/${producer.id}`}
            className="flex flex-col items-center min-w-[100px] text-center group"
          >
            <Avatar className="w-16 h-16 border-2 border-primary/10 group-hover:border-primary/50 transition-colors">
              <AvatarImage src={producer.profile_picture || ''} alt={producer.stage_name || producer.full_name} />
              <AvatarFallback>{(producer.stage_name || producer.full_name)?.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="mt-2 text-sm font-medium truncate w-full">
              {producer.stage_name || producer.full_name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
};
