
import { TrendingBeats } from "@/components/marketplace/TrendingBeats";
import { WeeklyPicks } from "@/components/marketplace/WeeklyPicks";
import { ProducerOfWeek } from "@/components/marketplace/ProducerOfWeek";
import { RecommendedBeats } from "@/components/marketplace/RecommendedBeats";
import { TopProducers } from "@/components/marketplace/TopProducers";
import { FeaturedPlaylists } from "@/components/marketplace/FeaturedPlaylists";
import { PremiumSection } from "@/components/marketplace/PremiumSection";
import { MainLayoutWithPlayer } from "@/components/layout/MainLayoutWithPlayer";
import { NewBeats } from "@/components/marketplace/NewBeats";
import { FeaturedBeat } from "@/components/marketplace/FeaturedBeat";
import { GenreQuickLinks } from "@/components/marketplace/GenreQuickLinks";
import { GamingBeats } from "@/components/marketplace/GamingBeats";

const Home = () => {
  return (
    <MainLayoutWithPlayer activeTab="home">
      <div className="w-full max-w-7xl mx-auto px-2 xs:px-4 sm:px-6 py-6 space-y-12">
        <FeaturedBeat />
        <GenreQuickLinks />
        <TrendingBeats />
        <TopProducers />
        <WeeklyPicks />
        <NewBeats />
        <FeaturedPlaylists />
        <RecommendedBeats />
        <GamingBeats />
        <ProducerOfWeek />
        <PremiumSection />
      </div>
    </MainLayoutWithPlayer>
  );
};

export default Home;
