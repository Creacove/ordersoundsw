import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ShoppingCart, Share2, ArrowLeft, Package, User, Music, Play, Pause, Upload, ShieldCheck } from 'lucide-react';
import { usePlayer } from '@/context/PlayerContext';
import { MainLayoutWithPlayer } from '@/components/layout/MainLayoutWithPlayer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { useCartLightweight } from '@/hooks/useCartLightweight';
import { Beat } from '@/types';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsMobile } from '@/hooks/use-mobile';
import { getLicensePrice, getAvailableLicenseTypes } from '@/utils/licenseUtils';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

const SoundpackDetail = () => {
  const { soundpackId } = useParams<{ soundpackId: string }>();
  const { addToCart, isInCart } = useCartLightweight();
  const { user, currency } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedLicense, setSelectedLicense] = useState<string>('basic');
  const [isPublishing, setIsPublishing] = useState(false);
  const isMobile = useIsMobile();
  const { playBeat, currentBeat, isPlaying, togglePlayPause } = usePlayer();

  const { data: soundpack, isLoading: soundpackLoading, error: soundpackError } = useQuery({
    queryKey: ['soundpack', soundpackId],
    queryFn: async () => {
      if (!soundpackId) throw new Error('Soundpack ID is required');
      
      console.log('Fetching soundpack with ID:', soundpackId);
      
      // Fetch soundpack
      const { data: soundpackData, error: soundpackError } = await supabase
        .from('soundpacks')
        .select('*')
        .eq('id', soundpackId)
        .maybeSingle();
      
      if (soundpackError) {
        console.error('Soundpack query error:', soundpackError);
        throw soundpackError;
      }
      
      if (!soundpackData) {
        console.error('No soundpack found with ID:', soundpackId);
        throw new Error('Soundpack not found');
      }
      
      // Fetch producer data separately
      const { data: producerData, error: producerError } = await supabase
        .from('users')
        .select('full_name, stage_name, profile_picture')
        .eq('id', soundpackData.producer_id)
        .maybeSingle();
      
      if (producerError) {
        console.error('Producer query error:', producerError);
      }
      
      return {
        ...soundpackData,
        producer_name: producerData?.stage_name || producerData?.full_name || 'Unknown Producer',
        producer_profile_picture: producerData?.profile_picture
      };
    },
    enabled: !!soundpackId,
    retry: false
  });

  const { data: soundpackBeats, isLoading: beatsLoading } = useQuery({
    queryKey: ['soundpack-beats', soundpackId],
    queryFn: async () => {
      if (!soundpackId) return [];
      
      // Explicitly filter by soundpack_id and only return beats that belong to this soundpack
      const { data, error } = await supabase
        .from('beats')
        .select('*')
        .eq('soundpack_id', soundpackId)
        .not('soundpack_id', 'is', null)
        .order('title');
      
      if (error) throw error;
      
      // Additional safety check: only return beats that actually belong to this soundpack
      const filteredData = (data || []).filter(beat => beat.soundpack_id === soundpackId);
      return filteredData;
    },
    enabled: !!soundpackId,
  });

  const handleAddToCart = () => {
    if (!soundpack || !canAddToCart) return;
    
    if (isInCart(soundpack.id, 'soundpack')) {
      toast.info('Already in cart');
    } else {
      addToCart(soundpack.id, selectedLicense, 'soundpack');
      toast.success('Added to cart');
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard');
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  const handlePublish = async () => {
    if (!soundpack || !user || user.id !== soundpack.producer_id) return;
    
    setIsPublishing(true);
    try {
      const { error } = await supabase
        .from('soundpacks')
        .update({ published: true })
        .eq('id', soundpack.id);
      
      if (error) throw error;
      
      toast.success('Soundpack published successfully!');
      queryClient.invalidateQueries({ queryKey: ['soundpack', soundpackId] });
    } catch (error) {
      console.error('Error publishing soundpack:', error);
      toast.error('Failed to publish soundpack');
    } finally {
      setIsPublishing(false);
    }
  };

  const getLicensePrice = (license: string) => {
    if (!soundpack) return 0;
    
    if (currency === 'NGN') {
      switch (license) {
        case 'basic': return soundpack.basic_license_price_local;
        case 'premium': return soundpack.premium_license_price_local;
        case 'exclusive': return soundpack.exclusive_license_price_local;
        case 'custom': return soundpack.custom_license_price_local;
        default: return 0;
      }
    } else {
      switch (license) {
        case 'basic': return soundpack.basic_license_price_diaspora;
        case 'premium': return soundpack.premium_license_price_diaspora;
        case 'exclusive': return soundpack.exclusive_license_price_diaspora;
        case 'custom': return soundpack.custom_license_price_diaspora;
        default: return 0;
      }
    }
  };

  const isLicenseAvailable = (license: string) => {
    const price = getLicensePrice(license);
    return price > 0;
  };

  const availableLicenses = ['basic', 'premium', 'exclusive', 'custom'].filter(isLicenseAvailable);

  // Auto-select first available license
  React.useEffect(() => {
    if (soundpack && availableLicenses.length > 0 && !isLicenseAvailable(selectedLicense)) {
      setSelectedLicense(availableLicenses[0]);
    }
  }, [soundpack, availableLicenses, selectedLicense]);

  const price = getLicensePrice(selectedLicense);
  const canAddToCart = isLicenseAvailable(selectedLicense);

  // State to store audio durations
  const [audioDurations, setAudioDurations] = useState<Record<string, string>>({});
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});

  // Load audio durations when beats are available
  useEffect(() => {
    if (!soundpackBeats || soundpackBeats.length === 0) return;

    soundpackBeats.forEach((beat) => {
      if (!beat.audio_preview && !beat.audio_file) return;
      if (audioDurations[beat.id]) return; // Already loaded

      const audio = new Audio(beat.audio_preview || beat.audio_file || '');
      audioRefs.current[beat.id] = audio;

      audio.addEventListener('loadedmetadata', () => {
        const duration = audio.duration;
        const minutes = Math.floor(duration / 60);
        const seconds = Math.floor(duration % 60);
        const formattedDuration = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        setAudioDurations(prev => ({
          ...prev,
          [beat.id]: formattedDuration
        }));
      });

      audio.load();
    });

    return () => {
      // Cleanup audio elements
      Object.values(audioRefs.current).forEach(audio => {
        audio.pause();
        audio.src = '';
      });
    };
  }, [soundpackBeats]);

  // Helper function to sanitize filename and remove duplicate extensions
  const sanitizeFileName = (title: string): string => {
    if (!title) return 'Untitled';
    
    // Remove duplicate extensions like .wav.wav or .mp3.mp3
    const extensionPattern = /\.(wav|mp3|flac|aac|m4a)(\.\1)+$/i;
    let cleaned = title.replace(extensionPattern, '.$1');
    
    // If no extension, assume it's just the name
    if (!/\.(wav|mp3|flac|aac|m4a)$/i.test(cleaned)) {
      return cleaned;
    }
    
    // Remove extension for display
    return cleaned.replace(/\.(wav|mp3|flac|aac|m4a)$/i, '');
  };

  // Helper function to get file extension
  const getFileExtension = (title: string): string => {
    const match = title.match(/\.(wav|mp3|flac|aac|m4a)$/i);
    return match ? match[1].toLowerCase() : 'wav';
  };

  if (soundpackLoading) {
    return (
      <div className="relative w-full">
        <div className="page-shell relative z-10 py-6 md:py-12">
          {/* Breadcrumbs Skeleton */}
          <div className="flex items-center gap-3 mb-10">
            <Skeleton className="h-10 w-10 rounded-full bg-white/5" />
            <Skeleton className="h-4 w-48 rounded-full bg-white/5" />
          </div>

          <div className="grid gap-12 lg:grid-cols-[1fr_400px]">
            <div className="space-y-12">
              <div className="flex flex-col md:flex-row gap-10 items-center md:items-start">
                <Skeleton className="aspect-square w-[280px] lg:w-[340px] rounded-[2.5rem] bg-white/5" />
                <div className="flex-1 space-y-6 pt-4">
                  <div className="space-y-4">
                    <Skeleton className="h-6 w-24 rounded-full bg-white/5" />
                    <Skeleton className="h-12 w-full max-w-md rounded-xl bg-white/5" />
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-10 w-10 rounded-full bg-white/5" />
                      <Skeleton className="h-5 w-32 rounded-full bg-white/5" />
                    </div>
                  </div>
                  <div className="flex gap-4 pt-2">
                    <Skeleton className="h-14 w-40 rounded-full bg-white/5" />
                    <div className="space-y-2">
                      <Skeleton className="h-3 w-16 rounded-full bg-white/5" />
                      <Skeleton className="h-5 w-24 rounded-full bg-white/5" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <Skeleton className="h-40 w-full rounded-[2.5rem] bg-white/5" />
                <Skeleton className="h-40 w-full rounded-[2.5rem] bg-white/5" />
              </div>

              <div className="space-y-6">
                <Skeleton className="h-10 w-48 rounded-full bg-white/5" />
                <div className="space-y-4">
                  {[1, 2, 3, 4].map(i => (
                    <Skeleton key={i} className="h-20 w-full rounded-[1.8rem] bg-white/5" />
                  ))}
                </div>
              </div>
            </div>

            <aside className="space-y-6">
              <Skeleton className="h-[450px] w-full rounded-[2.5rem] bg-white/5" />
              <Skeleton className="h-24 w-full rounded-[2rem] bg-white/5" />
            </aside>
          </div>
        </div>
      </div>
    );
  }

  if (soundpackError || (soundpackError === null && !soundpackLoading && !soundpack)) {
    return (
      <div className="page-shell py-8">
        <div className="panel mx-auto max-w-3xl p-8 text-center bg-white/[0.02] border border-white/5 rounded-[2.5rem] backdrop-blur-xl">
          <Badge variant="outline" className="border-red-500/40 text-red-500 font-black uppercase tracking-widest text-[9px] mb-3 px-3 italic">Fatal Error</Badge>
          <h1 className="text-2xl font-black text-white italic tracking-tighter uppercase mb-2">Soundpack Missing</h1>
          <p className="text-white/40 text-sm italic font-medium mb-8">
            The collection you are attempting to access is either unavailable or has been decommissioned.
          </p>
          <Button rounded="full" onClick={() => navigate('/')} className="bg-white text-black font-black uppercase italic tracking-tighter px-8 h-12">
            Return to Nexus
          </Button>
        </div>
      </div>
    );
  }

  const handlePlayAll = () => {
    if (!soundpackBeats || soundpackBeats.length === 0) return;
    
    const firstBeat = soundpackBeats[0];
    const beatData: Beat = {
      ...firstBeat,
      status: (firstBeat.status || 'published') as 'draft' | 'published',
      track_type: (firstBeat.track_type || 'beat') as 'beat' | 'loop' | 'sample',
      producer_name: soundpack?.producer_name || 'Unknown Producer',
      cover_image_url: firstBeat.cover_image || soundpack?.cover_art_url || '',
      preview_url: firstBeat.audio_preview || firstBeat.audio_file || '',
      full_track_url: firstBeat.audio_file || '',
      created_at: firstBeat.upload_date || new Date().toISOString(),
      type: 'soundpack_item',
    };
    playBeat(beatData);
  };

  return (
    <div className="relative w-full min-h-screen">
      {/* Immersive Background Decor */}
      <div className="absolute inset-0 h-[60vh] w-full overflow-hidden pointer-events-none">
        <img 
          src={soundpack.cover_art_url || "/placeholder.svg"} 
          alt="" 
          className="w-full h-full object-cover opacity-20 blur-[100px] scale-125"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#030407]/80 to-[#030407]" />
      </div>

      <div className="page-shell relative z-10 py-6 md:py-12">
        {/* Header Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-10">
          <div className="flex items-center gap-3 text-sm font-medium">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-10 w-10 rounded-full bg-white/5 border border-white/10 hover:bg-white/10" 
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-4 w-4 text-white" />
            </Button>
            <div className="flex items-center gap-2 text-white/40 font-black uppercase italic tracking-widest text-[10px]">
              <Link to="/playlists" className="hover:text-white transition-colors">Catalog</Link>
              <span className="h-1 w-1 rounded-full bg-white/20" />
              <span className="text-white/80 line-clamp-1 max-w-[150px]">{soundpack.title}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full h-10 w-10 border-white/10 bg-white/5 hover:bg-white/10 backdrop-blur-xl"
              onClick={handleShare}
            >
              <Share2 className="w-4 h-4 text-white/60" />
            </Button>
          </div>
        </div>

        {/* Draft status and publish button for producers */}
        {user?.id === soundpack.producer_id && !soundpack.published && (
          <div className="mb-8 p-4 bg-accent/10 border border-accent/20 rounded-2xl flex items-center justify-between backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
              <span className="text-xs font-black uppercase tracking-widest text-accent italic">Draft Mode — Content Hidden From Public</span>
            </div>
            <Button
              variant="default"
              onClick={handlePublish}
              disabled={isPublishing || (soundpackBeats?.length || 0) === 0}
              className="bg-accent text-white font-black h-9 rounded-xl px-6 italic uppercase text-[10px] tracking-widest"
            >
              <Upload className="w-4 h-4 mr-2" />
              {isPublishing ? 'Synchronizing...' : 'Go Live'}
            </Button>
          </div>
        )}

        <div className="grid gap-12 lg:grid-cols-[1fr_400px]">
          {/* Main Content Area */}
          <div className="space-y-12">
            {/* Identity & Hero info */}
            <div className="flex flex-col md:flex-row gap-10 items-center md:items-start text-center md:text-left">
              <div className="relative group shrink-0">
                <div className="aspect-square w-[280px] lg:w-[340px] relative overflow-hidden rounded-[2.5rem] border border-white/10 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)]">
                  <img
                    src={soundpack.cover_art_url || "/placeholder.svg"}
                    alt={soundpack.title}
                    className="w-full h-full object-cover transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500" />
                </div>
                
                {/* Category Badge */}
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-[#030407] border border-white/10 px-5 py-2.5 rounded-2xl shadow-xl backdrop-blur-xl">
                    <Package className="h-4 w-4 mr-2 text-accent" />
                    <span className="text-white/90 text-[10px] font-black uppercase tracking-[0.2em] italic">Curated Bundle</span>
                  </Badge>
                </div>
              </div>

              <div className="flex-1 space-y-6 flex flex-col justify-center">
                <div className="space-y-4">
                  <Badge variant="outline" className="bg-white/5 border-white/10 text-white/40 font-black uppercase tracking-[0.2em] text-[10px] px-4 py-1 italic">
                    Collection Profile
                  </Badge>
                  <h1 className="text-2xl md:text-3xl font-black text-white italic tracking-tighter uppercase leading-tight">
                    {soundpack.title}
                  </h1>
                  <div className="flex items-center justify-center md:justify-start gap-4">
                    <div className="h-10 w-10 rounded-full bg-white/10 border border-white/10 flex items-center justify-center overflow-hidden shrink-0 shadow-lg">
                      {soundpack.producer_profile_picture ? (
                        <img src={soundpack.producer_profile_picture} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <User className="h-5 w-5 text-white/30" />
                      )}
                    </div>
                    <div className="flex flex-col items-start leading-tight">
                    </div>
                    <div className="flex flex-col items-start leading-tight">
                      <Link to={`/producer/${soundpack.producer_id}`} className="text-lg font-bold text-white hover:text-accent transition-colors">
                        {soundpack.producer_name}
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2">
                  <Button 
                    size="lg" 
                    onClick={handlePlayAll}
                    className="bg-white text-black hover:bg-[#f0f0f0] rounded-full h-14 px-10 font-black uppercase tracking-widest text-sm shadow-xl"
                  >
                    <Play className="h-5 w-5 mr-3 fill-current" />
                    Play Preview
                  </Button>
                  <div className="h-14 w-[1px] bg-white/10 mx-2 hidden sm:block" />
                  <div className="flex flex-col items-start">
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Total Files</span>
                    <span className="text-xl font-bold text-white tracking-tight">{soundpackBeats?.length || 0} Assets</span>
                  </div>
                </div>
              </div>
            </div>

            {/* About & Features */}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="bg-[#030407]/40 border border-white/5 backdrop-blur-3xl rounded-[2.5rem] p-8 space-y-4">
                <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-3">
                  <div className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_10px_#9A3BDC]" />
                  About this Soundpack
                </h3>
                <p className="text-white/60 text-base leading-relaxed font-medium">
                  {soundpack.description || "A masterfully curated collection of audio assets designed for immediate integration. Every file is optimized for quality and professional workflow compatibility."}
                </p>
              </div>

              <div className="bg-[#030407]/40 border border-white/5 backdrop-blur-3xl rounded-[2.5rem] p-8 space-y-4">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/20 block mb-2">Asset Type</span>
                    <span className="text-lg font-bold text-white">WAV + MP3</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/20 block mb-2">Ownership</span>
                    <span className="text-lg font-bold text-white">Full Rights</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/20 block mb-2">Delivery</span>
                    <span className="text-lg font-bold text-white">Immediate</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/20 block mb-2">Compatibility</span>
                    <span className="text-lg font-bold text-white">Universal</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Technical Tracklist */}
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-white/5 pb-6">
                <h2 className="text-xl font-bold text-white tracking-tight">Included Tracks</h2>
                <Badge variant="outline" className="border-white/10 text-white/40 font-bold px-3 py-1">
                  {soundpackBeats?.length || 0} FILES
                </Badge>
              </div>

              {beatsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-20 w-full rounded-3xl bg-white/5" />
                  ))}
                </div>
              ) : soundpackBeats && soundpackBeats.length > 0 ? (
                <div className="space-y-2">
                  {soundpackBeats.map((beat, index) => {
                    const isCurrentBeat = currentBeat?.id === beat.id;
                    const isCurrentPlaying = isCurrentBeat && isPlaying;
                    const sanitizedName = sanitizeFileName(beat.title);
                    const fileExtension = getFileExtension(beat.title);
                    const duration = audioDurations[beat.id] || '--:--';
                    
                    return (
                      <div 
                        key={beat.id}
                        className={cn(
                          "group relative flex items-center gap-4 px-6 py-4 rounded-[1.8rem] transition-all duration-300",
                          isCurrentBeat 
                            ? "bg-accent/10 border border-accent/20 shadow-[0_0_20px_rgba(154,59,220,0.05)]" 
                            : "hover:bg-white/[0.04] border border-transparent hover:border-white/5"
                        )}
                      >
                        <span className="w-6 text-[10px] font-black text-white/20 group-hover:text-white/40 transition-colors">
                          {(index + 1).toString().padStart(2, '0')}
                        </span>
                        
                        <Button
                          size="icon"
                          variant="ghost"
                          className={cn(
                            "flex-shrink-0 w-10 h-10 rounded-2xl transition-all",
                            isCurrentBeat ? "bg-accent text-white" : "bg-white/5 text-white/40 group-hover:bg-white/10 group-hover:text-white"
                          )}
                          onClick={() => {
                            if (isCurrentBeat) {
                              togglePlayPause();
                            } else {
                              const beatData: Beat = {
                                ...beat,
                                status: (beat.status || 'published') as 'draft' | 'published',
                                track_type: (beat.track_type || 'beat') as any,
                                producer_name: soundpack.producer_name || 'Unknown Producer',
                                cover_image_url: beat.cover_image || soundpack.cover_art_url || '',
                                preview_url: beat.audio_preview || beat.audio_file || '',
                                full_track_url: beat.audio_file || '',
                                created_at: beat.upload_date || new Date().toISOString(),
                                type: 'soundpack_item',
                              };
                              playBeat(beatData);
                            }
                          }}
                        >
                          {isCurrentPlaying ? (
                            <Pause className="w-5 h-5 fill-current" />
                          ) : (
                            <Play className="w-5 h-5 fill-current ml-0.5" />
                          )}
                        </Button>
                        
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "text-base font-bold truncate tracking-tight transition-colors",
                            isCurrentBeat ? "text-white" : "text-white/80 group-hover:text-white"
                          )}>
                            {sanitizedName}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant="outline" className="p-0 border-none text-[9px] font-black uppercase text-accent tracking-[0.2em]">High Fidelity</Badge>
                            <span className="h-0.5 w-0.5 rounded-full bg-white/10" />
                            <span className="text-[9px] font-bold uppercase text-white/20">{fileExtension}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-8">
                          <span className="text-xs font-black tabular-nums text-white/20 group-hover:text-white/40 transition-colors">
                            {duration}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white/5 border border-dashed border-white/10 rounded-[2.5rem] py-20 text-center">
                  <Music size={40} className="mx-auto mb-4 text-white/10" />
                  <p className="text-white/40 font-bold uppercase tracking-widest text-xs">No assets detected in bundle.</p>
                </div>
              )}
            </div>
          </div>

          {/* Side Sidebar: Purchase Section */}
          <aside className="space-y-6 self-start lg:sticky lg:top-28">
            <div className="bg-[#030407]/60 border border-white/10 backdrop-blur-3xl rounded-[2.5rem] p-8 shadow-2xl space-y-8 overflow-hidden relative">
              {/* Visual Accent */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-accent/20 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2" />
              
              <div className="relative z-10 space-y-8">
                <div className="space-y-2">
                  <Badge className="bg-white/5 text-white/40 border border-white/10 font-bold text-[9px] uppercase tracking-[0.2em] px-3 py-1">Licensing</Badge>
                  <h2 className="text-2xl font-extrabold text-white tracking-tight">Purchase License</h2>
                  <p className="text-sm text-white/40 font-medium leading-relaxed">Choose a license for your project.</p>
                </div>

                <div className="space-y-4">
                  {availableLicenses.map((license) => {
                    const isSelected = selectedLicense === license;
                    const licensePrice = getLicensePrice(license);
                    
                    return (
                      <button
                        key={license}
                        onClick={() => setSelectedLicense(license)}
                        className={cn(
                          "w-full rounded-2xl border p-5 text-left transition-all duration-300 relative group",
                          isSelected 
                            ? "bg-accent/10 border-accent shadow-[0_0_30px_rgba(154,59,220,0.1)]" 
                            : "bg-white/[0.02] border-white/5 hover:bg-white/5 hover:border-white/10"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <span className={cn(
                              "text-sm font-black uppercase tracking-widest transition-colors",
                              isSelected ? "text-accent" : "text-white/40"
                            )}>
                              {license}
                            </span>
                            <div className="text-xl font-black text-white tracking-tighter">
                              {formatCurrency(licensePrice, currency)}
                            </div>
                          </div>
                          {isSelected && (
                            <div className="h-6 w-6 rounded-full bg-accent flex items-center justify-center">
                              <ShieldCheck className="h-3.5 w-3.5 text-white" />
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="pt-2">
                  <Button 
                    onClick={handleAddToCart}
                    disabled={!canAddToCart || isInCart(soundpack.id, 'soundpack')}
                    className="w-full h-16 rounded-[1.8rem] font-black uppercase tracking-widest text-sm shadow-2xl bg-white text-black hover:bg-[#f0f0f0] transition-all active:scale-95"
                  >
                    {isInCart(soundpack.id, 'soundpack') ? (
                      <span className="flex items-center gap-2 italic"><ShoppingCart className="w-5 h-5" /> View Cart</span>
                    ) : (
                      <span className="flex items-center gap-2 italic"><ShoppingCart className="w-5 h-5 font-black" /> Add to Cart</span>
                    )}
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4 pb-2">
                  <div className="flex flex-col items-center p-3 bg-white/5 rounded-2xl border border-white/5">
                    <Music className="h-4 w-4 text-accent mb-2" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-white/30 text-center">Lossless Audio</span>
                  </div>
                  <div className="flex flex-col items-center p-3 bg-white/5 rounded-2xl border border-white/5">
                    <Package className="h-4 w-4 text-accent mb-2" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-white/30 text-center">Instant Delivery</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Secure Checkout Trust */}
            <div className="p-6 bg-[#030407]/40 border border-white/5 rounded-[2rem] flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <ShieldCheck className="h-5 w-5 text-emerald-500" />
              </div>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest leading-relaxed">
                Verified assets. Your rights remain attached to your persistent user studio.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default SoundpackDetail;
