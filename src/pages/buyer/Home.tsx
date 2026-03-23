
import { FeaturedBeat } from "@/components/marketplace/FeaturedBeat";
import { TrendingBeats } from "@/components/marketplace/TrendingBeats";
import { TopProducers } from "@/components/marketplace/TopProducers";
import { WeeklyPicks } from "@/components/marketplace/WeeklyPicks";
import { NewBeats } from "@/components/marketplace/NewBeats";
import { RecommendedBeats } from "@/components/marketplace/RecommendedBeats";
import { GamingBeats } from "@/components/marketplace/GamingBeats";
import { ProducerOfWeek } from "@/components/marketplace/ProducerOfWeek";

const Home = () => {
  return (
    <div className="container py-8 md:py-12 px-4 md:px-6">
      <div className="flex flex-col gap-8 md:gap-12 pb-12">
        <FeaturedBeat />
        <TrendingBeats />
        <TopProducers />
        <WeeklyPicks />
        <NewBeats />
        <RecommendedBeats />
        <GamingBeats />
        <ProducerOfWeek />
      </div>
    </div>
  );
};

export default Home;
