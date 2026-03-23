
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase, mapSupabaseBeats } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { Music, Share2, Users, Calendar, Package, MapPin, Terminal, Activity, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BeatCardCompact } from '@/components/marketplace/BeatCardCompact';
import { SoundpackCard } from '@/components/marketplace/SoundpackCard';
import { FollowButton } from '@/components/buttons/FollowButton';
import { FollowerCount } from '@/components/producer/profile/FollowerCount';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { getInitials } from '@/utils/formatters';
import { Separator } from '@/components/ui/separator';
import { EmptyState } from '@/components/library/EmptyState';
import { Badge } from '@/components/ui/badge';

const TruncatedBio = ({ bio, className, expandedSize = "lg" }: { bio: string; className?: string, expandedSize?: "lg" | "2xl" }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const maxLength = 150;
  
  if (!bio) return null;
  
  const isLong = bio.length > maxLength;
  const displayBio = isExpanded || !isLong ? bio : `${bio.slice(0, maxLength)}...`;
  
  return (
    <div className="space-y-3">
      <p className={cn(className, isExpanded && expandedSize === "2xl" ? "text-2xl" : "")}>
        {displayBio}
      </p>
      {isLong && (
        <button 
          onClick={(e) => {
            e.preventDefault();
            setIsExpanded(!isExpanded);
          }}
          className="text-[#9A3BDC] text-[10px] font-black uppercase italic tracking-widest hover:text-white transition-colors flex items-center gap-2"
        >
          <div className="w-4 h-[1px] bg-[#9A3BDC]" />
          {isExpanded ? "COLLAPSE INTEL" : "READ FULL BIO"}
        </button>
      )}
    </div>
  );
};

export default function ProducerProfile() {
  const { producerId } = useParams<{ producerId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('beats');
  
  const { data: producer, isLoading: isLoadingProducer } = useQuery({
    queryKey: ['producer', producerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, stage_name, bio, profile_picture, country, created_date, follower_count')
        .eq('id', producerId)
        .eq('role', 'producer')
        .single();

      if (error) {
        console.error('Error fetching producer profile:', error);
        throw error;
      }
      
      return {
        id: data.id,
        full_name: data.full_name,
        stage_name: data.stage_name,
        bio: data.bio,
        avatar_url: data.profile_picture,
        country: data.country,
        follower_count: data.follower_count || 0,
        created_at: data.created_date
      };
    },
    enabled: !!producerId,
  });

  const { data: beats = [], isLoading: isLoadingBeats } = useQuery({
    queryKey: ['producerBeats', producerId, activeTab],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('beats')
        .select(`
          *,
          users (
            full_name,
            stage_name
          )
        `)
        .eq('producer_id', producerId)
        .eq('status', 'published')
        .is('soundpack_id', null)
        .order('upload_date', { ascending: false });

      if (error) {
        console.error('Error fetching producer beats:', error);
        throw error;
      }

      return mapSupabaseBeats(data);
    },
    enabled: !!producerId && activeTab === 'beats',
  });

  const { data: soundpacks = [], isLoading: isLoadingSoundpacks } = useQuery({
    queryKey: ['producerSoundpacks', producerId, activeTab],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('soundpacks')
        .select('*')
        .eq('producer_id', producerId)
        .eq('published', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching producer soundpacks:', error);
        throw error;
      }

      return (data || []).map(sp => ({
        ...sp,
        producer_name: producer?.stage_name || producer?.full_name || 'Unknown Producer'
      }));
    },
    enabled: !!producerId && !!producer && activeTab === 'soundpacks',
  });
  
  const isOwnProfile = user?.id === producerId;
  
  const handleShareClick = () => {
    const shareUrl = window.location.href;
    navigator.clipboard.writeText(shareUrl).then(() => {
      toast.success("Profile link copied to clipboard");
    }).catch(err => {
      console.error("Could not copy URL: ", err);
      toast.error("Failed to copy link");
    });
  };
  
  useEffect(() => {
    if (producer) {
      document.title = `${producer.stage_name || producer.full_name} | OrderSOUNDS`;
    }
  }, [producer]);

  if (isLoadingProducer) {
    return (
      <div className="container py-20 px-4 md:px-6">
        <div className="animate-pulse space-y-8">
           <div className="h-64 rounded-[3rem] bg-white/[0.02] border border-white/5" />
           <div className="flex gap-4">
             <div className="h-12 w-32 bg-white/[0.02] rounded-xl" />
             <div className="h-12 w-32 bg-white/[0.02] rounded-xl" />
           </div>
           <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
             {[1, 2, 3, 4].map(i => <div key={i} className="aspect-square bg-white/[0.02] rounded-[2rem]" />)}
           </div>
        </div>
      </div>
    );
  }

  if (!producer) {
    return (
      <div className="container py-20 px-4 md:px-6">
        <div className="text-center max-w-md mx-auto p-12 rounded-[3rem] bg-white/[0.01] border border-dashed border-white/10">
          <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center mx-auto mb-6">
            <Activity className="h-8 w-8 text-white/10" />
          </div>
          <h1 className="text-2xl font-black text-white italic tracking-tighter uppercase mb-2">Profile Not Found</h1>
          <p className="text-white/30 italic mb-8 px-4">The producer profile you are looking for does not exist or has been removed.</p>
          <Button onClick={() => navigate('/producers')} className="h-14 w-full rounded-2xl bg-white text-black font-black uppercase italic tracking-tighter hover:bg-white/90">View All Producers</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 md:py-12 px-4 md:px-6 max-w-7xl pb-32">
      {/* Profile Header Card */}
      <div className="relative group mb-16">
        <div className="absolute -inset-1 bg-gradient-to-r from-[#9A3BDC] to-purple-600 rounded-[3.1rem] blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
        <div className="relative p-[1px] rounded-[3rem] bg-gradient-to-br from-white/10 to-transparent">
          <div className="bg-[#030407] rounded-[2.9rem] p-8 md:p-14 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#9A3BDC]/10 blur-[120px] -mr-48 -mt-48 rounded-full pointer-events-none" />
            
            <div className="flex flex-col md:flex-row gap-10 md:items-center relative z-10">
              <div className="shrink-0">
                <div className="p-1 rounded-[2.5rem] bg-gradient-to-br from-white/20 to-transparent shadow-2xl relative">
                  <Avatar className="w-32 h-32 md:w-52 md:h-52 rounded-[2.3rem] border-4 border-[#030407]">
                    <AvatarImage src={producer.avatar_url || undefined} alt={producer.stage_name || producer.full_name} className="object-cover" />
                    <AvatarFallback className="text-5xl font-black bg-[#1A1B1E] text-white italic tracking-tighter">
                      {getInitials(producer.stage_name || producer.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-4 -right-4 w-12 h-12 rounded-2xl bg-[#9A3BDC] border-4 border-[#030407] flex items-center justify-center shadow-lg">
                    <Zap size={20} className="text-white fill-white" />
                  </div>
                </div>
              </div>
              
              <div className="flex-1 space-y-6">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-4">
                    <h1 className="text-2xl sm:text-4xl md:text-6xl font-black text-white italic tracking-tighter uppercase leading-none">
                      {producer.stage_name || producer.full_name}
                    </h1>
                    {producer.country && (
                      <Badge className="rounded-full border-none bg-white/5 text-white/40 h-8 px-4 font-black uppercase italic tracking-widest text-[9px] gap-2">
                        <MapPin size={10} className="text-[#9A3BDC]" /> {producer.country}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-6">
                    <FollowerCount count={producer.follower_count} />
                    <div className="h-1 w-1 rounded-full bg-white/20" />
                    <div className="flex items-center gap-2 text-white/30 text-[10px] font-black uppercase italic tracking-widest">
                       <Calendar size={12} /> Member Since: {producer.created_at ? new Date(producer.created_at).getFullYear() : '2024'}
                    </div>
                  </div>
                </div>
                
                {producer.bio && (
                  <TruncatedBio 
                    bio={producer.bio} 
                    className="text-white/60 text-lg leading-relaxed max-w-2xl italic font-medium" 
                  />
                )}
                
                <div className="flex flex-wrap gap-4 pt-4">
                  {!isOwnProfile && (
                    <FollowButton 
                      producerId={producer.id} 
                      variant="default"
                    />
                  )}

                  <Button 
                    variant="ghost" 
                    className="rounded-2xl h-14 px-8 bg-white/5 border border-white/5 text-white font-black uppercase italic tracking-tighter hover:bg-white/10 gap-3"
                    onClick={handleShareClick}
                  >
                    <Share2 size={18} />
                    Share Profile
                  </Button>
                  
                  {isOwnProfile && (
                    <Button 
                      variant="ghost"
                      className="rounded-2xl h-14 px-8 bg-[#9A3BDC]/10 border border-[#9A3BDC]/20 text-[#9A3BDC] font-black uppercase italic tracking-tighter hover:bg-[#9A3BDC]/20"
                      onClick={() => navigate('/producer/settings')}
                    >
                      Edit Profile
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="beats" value={activeTab} onValueChange={setActiveTab} className="space-y-16">
        <div className="border-b border-white/5 pb-6">
            <TabsList className="bg-transparent border-none p-0 flex gap-10">
              <TabsTrigger value="beats" className="bg-transparent border-none p-0 font-black uppercase italic tracking-widest text-sm data-[state=active]:text-[#9A3BDC] text-white/20 transition-all gap-2 relative h-full">
                Beats
                {activeTab === 'beats' && <div className="absolute -bottom-[25px] left-0 right-0 h-1 bg-[#9A3BDC] rounded-full shadow-[0_4px_10px_rgba(154,59,220,0.5)]" />}
              </TabsTrigger>
              <TabsTrigger value="soundpacks" className="bg-transparent border-none p-0 font-black uppercase italic tracking-widest text-sm data-[state=active]:text-[#9A3BDC] text-white/20 transition-all gap-2 relative h-full">
                Soundpacks
                {activeTab === 'soundpacks' && <div className="absolute -bottom-[25px] left-0 right-0 h-1 bg-[#9A3BDC] rounded-full shadow-[0_4px_10px_rgba(154,59,220,0.5)]" />}
              </TabsTrigger>
              <TabsTrigger value="about" className="bg-transparent border-none p-0 font-black uppercase italic tracking-widest text-sm data-[state=active]:text-[#9A3BDC] text-white/20 transition-all gap-2 relative h-full">
                About
                {activeTab === 'about' && <div className="absolute -bottom-[25px] left-0 right-0 h-1 bg-[#9A3BDC] rounded-full shadow-[0_4px_10px_rgba(154,59,220,0.5)]" />}
              </TabsTrigger>
            </TabsList>
        </div>
        
        <TabsContent value="beats" className="outline-none space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-500">
          <SectionTitle 
            title="Music Catalog" 
            icon={<Music className="h-6 w-6" />}
          />
          
          {isLoadingBeats ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                <div key={i} className="space-y-4 animate-pulse">
                  <div className="aspect-square bg-white/[0.03] rounded-[2rem]" />
                  <div className="h-4 w-2/3 bg-white/[0.03] rounded-lg" />
                </div>
              ))}
            </div>
          ) : beats.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
              {beats.map((beat) => (
                <BeatCardCompact key={beat.id} beat={beat} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Music}
              title="Catalog Empty"
              description={isOwnProfile 
                ? "You haven't uploaded any beats yet. Start sharing your music with the world."
                : "This producer hasn't uploaded any beats yet."
              }
              actionLabel={isOwnProfile ? "Upload First Beat" : undefined}
              actionHref={isOwnProfile ? "/producer/upload" : undefined}
            />
          )}
        </TabsContent>

        <TabsContent value="soundpacks" className="outline-none space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-500">
          <SectionTitle
            title="Soundpacks"
            icon={<Package className="h-6 w-6" />}
          />

          {isLoadingSoundpacks ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="space-y-4 animate-pulse">
                  <div className="aspect-square bg-white/[0.03] rounded-[2rem]" />
                  <div className="h-4 w-2/3 bg-white/[0.03] rounded-lg" />
                </div>
              ))}
            </div>
          ) : soundpacks.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
              {soundpacks.map((soundpack) => (
                <SoundpackCard
                  key={soundpack.id}
                  soundpack={soundpack}
                  showLicenseSelector={true}
                  isProducerOwned={isOwnProfile}
                  className="rounded-[2rem] bg-white/[0.02] border-none"
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Package}
              title="No Soundpacks"
              description={isOwnProfile
                ? "Create and upload soundpacks to sell your samples and loops."
                : "This producer hasn't published any soundpacks yet."
              }
              actionLabel={isOwnProfile ? "Upload Soundpack" : undefined}
              actionHref={isOwnProfile ? "/producer/upload" : undefined}
            />
          )}
        </TabsContent>

        <TabsContent value="about" className="outline-none space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-500">
          <SectionTitle title="Producer Bio" icon={<Terminal className="h-6 w-6" />} />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 relative p-[1px] rounded-[2.5rem] bg-white/5">
              <div className="bg-[#030407] rounded-[2.4rem] p-10 space-y-10 h-full">
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-[#9A3BDC] mb-6 flex items-center gap-3 italic">
                    <Activity size={14} />
                    BIOGRAPHY
                  </h3>
                  <TruncatedBio 
                    bio={producer.bio || "THIS PRODUCER HASN'T ADDED A BIO YET."} 
                    className="text-white/70 text-2xl leading-relaxed italic font-black tracking-tight uppercase"
                    expandedSize="2xl"
                  />
                </div>
                
                <div className="h-px w-full bg-white/5" />
                
                <div className="flex flex-wrap gap-10">
                   <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/20 italic block">Location</span>
                      <span className="text-white font-bold italic uppercase tracking-tighter text-lg">{producer.country || "GLOBAL"}</span>
                   </div>
                   <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/20 italic block">Member Since</span>
                      <span className="text-white font-bold italic uppercase tracking-tighter text-lg">
                        {producer.created_at ? new Date(producer.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }) : "2024"}
                      </span>
                   </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-8 h-full flex flex-col">
              <div className="flex-1 relative group p-[px] rounded-[2.5rem] bg-gradient-to-br from-[#9A3BDC]/20 to-transparent">
                <div className="bg-[#030407] rounded-[2.4rem] p-10 flex flex-col justify-center items-center text-center h-full border border-white/5">
                  <div className="w-16 h-16 rounded-3xl bg-[#9A3BDC]/10 flex items-center justify-center mb-6">
                     <Zap className="text-[#9A3BDC]" fill="#9A3BDC" />
                  </div>
                  <h4 className="text-white/40 font-black uppercase tracking-widest italic text-[10px] mb-2">Total Tracks</h4>
                  <span className="text-4xl sm:text-5xl md:text-6xl font-black text-white italic tracking-tighter">{(beats?.length || 0) + (soundpacks?.length || 0)}</span>
                  <p className="text-white/20 font-bold italic text-xs mt-2 uppercase tracking-widest">Beats and Soundpacks</p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
