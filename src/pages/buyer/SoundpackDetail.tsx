import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ShoppingCart, Share2, ArrowLeft, Package, User, Music, Play, Pause, Upload } from 'lucide-react';
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
import { formatCurrency } from '@/lib/utils';
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
      
      console.log('Soundpack data:', soundpackData);
      
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

  if (soundpackLoading) {
    return (
      <MainLayoutWithPlayer>
        <div className="p-4 max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </MainLayoutWithPlayer>
    );
  }

  if (!soundpack) {
    return (
      <MainLayoutWithPlayer>
        <div className="p-4 max-w-7xl mx-auto">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Soundpack not found</h2>
            <Button onClick={() => navigate('/')}>Go Home</Button>
          </div>
        </div>
      </MainLayoutWithPlayer>
    );
  }

  return (
    <MainLayoutWithPlayer>
      <div className="w-full max-w-7xl mx-auto px-4 py-4 sm:px-6 space-y-6 overflow-x-hidden">
        {/* Back button and status */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          {/* Draft status badge */}
          {!soundpack.published && (
            <Badge variant="secondary" className="px-3 py-1 text-xs font-semibold">
              DRAFT
            </Badge>
          )}
          
          {user?.id === soundpack.producer_id && !soundpack.published && (
            <Button
              variant="default"
              onClick={handlePublish}
              disabled={isPublishing || (soundpackBeats?.length || 0) === 0}
              className="ml-auto"
            >
              <Upload className="w-4 h-4 mr-2" />
              {isPublishing ? 'Publishing...' : 'Publish Soundpack'}
            </Button>
          )}
        </div>

        {/* Hero section with gradient overlay */}
        <div className="relative rounded-xl overflow-hidden shadow-2xl">
          <div className="relative aspect-[21/9] sm:aspect-[21/9] md:aspect-[2/1]">
            <img
              src={soundpack.cover_art_url || "/placeholder.svg"}
              alt={soundpack.title}
              className="w-full h-full object-cover"
              loading="eager"
            />
            {/* Black gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            
            {/* Content overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 lg:p-10">
              <Badge 
                className="mb-4 bg-primary text-primary-foreground shadow-lg flex items-center gap-1.5 px-3 py-1.5 w-fit"
                variant="default"
              >
                <Package size={16} />
                <span className="font-semibold">{soundpack.file_count} Files</span>
              </Badge>
              
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-3 drop-shadow-lg">
                {soundpack.title}
              </h1>
              
              <Link
                to={`/producer/${soundpack.producer_id}`}
                className="inline-flex items-center gap-2 text-white/90 hover:text-white transition-colors group"
              >
                <User size={18} />
                <span className="text-base font-medium group-hover:underline">by {soundpack.producer_name}</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left column - Description */}
          <div className="lg:col-span-2 space-y-6">
            {soundpack.description && (
              <div>
                <h2 className="text-xl font-bold mb-3">About this Pack</h2>
                <p className="text-muted-foreground leading-relaxed text-base">{soundpack.description}</p>
              </div>
            )}
          </div>

          {/* Right column - Pricing & License (Sticky on desktop) */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-6 space-y-4">
              {/* License selection */}
              {availableLicenses.length > 1 && (
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-foreground">Select License</label>
                  <div className="grid grid-cols-2 gap-2">
                    {availableLicenses.map((license) => {
                      const isSelected = selectedLicense === license;
                      
                      return (
                        <Button
                          key={license}
                          variant={isSelected ? 'default' : 'outline'}
                          onClick={() => setSelectedLicense(license)}
                          className="capitalize h-10 text-sm font-medium transition-all"
                          size="sm"
                        >
                          {license}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {/* Price card */}
              <Card className="border-2 border-primary/30 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm shadow-xl">
                <CardContent className="p-6 space-y-5">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                      {availableLicenses.length === 1 ? `${availableLicenses[0]} License` : 'Price'}
                    </p>
                    <p className="text-4xl font-bold text-foreground tracking-tight">
                      {formatCurrency(price, currency)}
                    </p>
                  </div>

                  {soundpack.purchase_count > 0 && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="flex -space-x-1">
                        {[...Array(Math.min(3, soundpack.purchase_count))].map((_, i) => (
                          <div key={i} className="w-6 h-6 rounded-full bg-primary/20 border-2 border-card" />
                        ))}
                      </div>
                      <span className="font-medium">{soundpack.purchase_count} {soundpack.purchase_count === 1 ? 'purchase' : 'purchases'}</span>
                    </div>
                  )}

                  <Button 
                    onClick={handleAddToCart}
                    disabled={!canAddToCart || isInCart(soundpack.id, 'soundpack')}
                    className="w-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                    size="lg"
                  >
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    {!canAddToCart ? 'Not Available' : isInCart(soundpack.id, 'soundpack') ? 'In Cart' : 'Add to Cart'}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleShare}
                    className="w-full text-muted-foreground hover:text-foreground"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Included files */}
        <div className="mt-6 sm:mt-8">
          <h2 className="text-lg sm:text-xl font-bold mb-4 flex items-center gap-2">
            <Music size={20} className="flex-shrink-0" />
            <span>Included Files ({soundpackBeats?.length || 0})</span>
          </h2>
          
          {beatsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : soundpackBeats && soundpackBeats.length > 0 ? (
            <div className="space-y-2">
              {soundpackBeats.map((beat, index) => {
                const isCurrentBeat = currentBeat?.id === beat.id;
                const isCurrentPlaying = isCurrentBeat && isPlaying;
                
                return (
                  <Card 
                    key={beat.id}
                    className={`transition-all duration-200 hover:bg-muted/30 ${
                      isCurrentBeat ? 'border-primary bg-primary/5' : ''
                    }`}
                  >
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-center gap-2 sm:gap-3">
                        {/* Play button */}
                        <Button
                          size="icon"
                          variant={isCurrentBeat ? "default" : "outline"}
                          className="flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9"
                          onClick={() => {
                            if (isCurrentBeat) {
                              togglePlayPause();
                            } else {
                              const beatData: Beat = {
                                ...beat,
                                status: (beat.status || 'published') as 'draft' | 'published',
                                type: (beat.type || 'beat') as 'beat' | 'soundpack_item',
                                producer_name: soundpack.producer_name || 'Unknown Producer',
                                cover_image_url: beat.cover_image || soundpack.cover_art_url || '',
                                preview_url: beat.audio_preview || '',
                                full_track_url: beat.audio_file || '',
                                created_at: beat.upload_date || new Date().toISOString(),
                              };
                              playBeat(beatData);
                            }
                          }}
                        >
                          {isCurrentPlaying ? (
                            <Pause className="w-3.5 h-3.5" />
                          ) : (
                            <Play className="w-3.5 h-3.5" />
                          )}
                        </Button>
                        
                        {/* Track info */}
                        <div className="flex-1 min-w-0 flex items-center gap-2 sm:gap-3">
                          <span className="text-muted-foreground font-mono text-[11px] sm:text-xs flex-shrink-0">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className={`font-medium text-sm sm:text-base leading-tight truncate ${
                              isCurrentBeat ? 'text-primary' : 'text-foreground'
                            }`}>
                              {beat.title}
                            </p>
                            {beat.genre && (
                              <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">
                                {beat.genre}
                                {beat.bpm && ` • ${beat.bpm} BPM`}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        {/* Playing indicator */}
                        {isCurrentPlaying && (
                          <div className="flex gap-0.5 items-end h-3.5 flex-shrink-0 ml-1">
                            <div className="w-0.5 bg-primary animate-pulse h-2" style={{ animationDelay: '0ms' }} />
                            <div className="w-0.5 bg-primary animate-pulse h-2.5" style={{ animationDelay: '150ms' }} />
                            <div className="w-0.5 bg-primary animate-pulse h-3.5" style={{ animationDelay: '300ms' }} />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Music size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No files found in this soundpack.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </MainLayoutWithPlayer>
  );
};

export default SoundpackDetail;
