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

  const handlePlayAll = () => {
    if (!soundpackBeats || soundpackBeats.length === 0) return;
    
    const firstBeat = soundpackBeats[0];
    const beatData: Beat = {
      ...firstBeat,
      status: (firstBeat.status || 'published') as 'draft' | 'published',
      type: (firstBeat.type || 'beat') as 'beat' | 'soundpack_item',
      producer_name: soundpack?.producer_name || 'Unknown Producer',
      cover_image_url: firstBeat.cover_image || soundpack?.cover_art_url || '',
      preview_url: firstBeat.audio_preview || '',
      full_track_url: firstBeat.audio_file || '',
      created_at: firstBeat.upload_date || new Date().toISOString(),
    };
    playBeat(beatData);
  };

  return (
    <MainLayoutWithPlayer>
      <div className="w-full max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="gap-2 text-lg"
          >
            <ArrowLeft className="w-5 h-5" />
            Soundpacks
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={handleShare}
          >
            <Share2 className="w-5 h-5" />
          </Button>
        </div>

        {/* Draft status and publish button for producers */}
        {user?.id === soundpack.producer_id && !soundpack.published && (
          <div className="mb-6 flex items-center gap-3">
            <Badge variant="secondary" className="px-3 py-1 text-xs font-semibold">
              DRAFT
            </Badge>
            <Button
              variant="default"
              onClick={handlePublish}
              disabled={isPublishing || (soundpackBeats?.length || 0) === 0}
              size="sm"
            >
              <Upload className="w-4 h-4 mr-2" />
              {isPublishing ? 'Publishing...' : 'Publish Soundpack'}
            </Button>
          </div>
        )}

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-8 lg:gap-12">
          {/* Left: Cover Art */}
          <div>
            <div className="aspect-square rounded-2xl overflow-hidden shadow-2xl">
              <img
                src={soundpack.cover_art_url || "/placeholder.svg"}
                alt={soundpack.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Right: Content */}
          <div className="space-y-6">
            {/* Title section */}
            <div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-2 tracking-tight">
                {soundpack.title}
              </h1>
              <Link
                to={`/producer/${soundpack.producer_id}`}
                className="text-lg text-muted-foreground hover:text-foreground transition-colors inline-block mb-4"
              >
                by {soundpack.producer_name}
              </Link>
              <Badge variant="secondary" className="text-sm px-3 py-1">
                Sound Pack
              </Badge>
            </div>

            {/* License selection and Add to Cart */}
            <div className="bg-card/50 rounded-xl p-6 border border-border/50">
              <div className="flex flex-wrap gap-3 items-center mb-4">
                {availableLicenses.map((license) => {
                  const isSelected = selectedLicense === license;
                  const licensePrice = getLicensePrice(license);
                  
                  return (
                    <button
                      key={license}
                      onClick={() => setSelectedLicense(license)}
                      className={`flex flex-col items-center justify-center px-6 py-4 rounded-lg border-2 transition-all min-w-[110px] ${
                        isSelected 
                          ? 'bg-primary border-primary text-primary-foreground' 
                          : 'bg-card/30 border-border hover:border-primary/50'
                      }`}
                    >
                      <span className="text-base font-semibold capitalize mb-1">
                        {license}
                      </span>
                      <span className="text-xl font-bold">
                        {formatCurrency(licensePrice, currency)}
                      </span>
                    </button>
                  );
                })}
                
                <Button 
                  onClick={handleAddToCart}
                  disabled={!canAddToCart || isInCart(soundpack.id, 'soundpack')}
                  className="ml-auto h-auto px-8 py-4 text-lg font-semibold"
                  size="lg"
                >
                  Add to Cart
                </Button>
              </div>
              
              <p className="text-sm text-muted-foreground">
                Selected: <span className="font-semibold capitalize text-foreground">{selectedLicense}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Bottom section: About and Included Files */}
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-8 lg:gap-12 mt-12">
          {/* Left: About */}
          <div>
            <h2 className="text-2xl font-bold mb-4">About this Pack</h2>
            {soundpack.description ? (
              <p className="text-muted-foreground leading-relaxed">
                {soundpack.description}
              </p>
            ) : (
              <p className="text-muted-foreground italic">No description available.</p>
            )}
          </div>

          {/* Right: Included Files */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">
                Included Files ({soundpackBeats?.length || 0})
              </h2>
              {soundpackBeats && soundpackBeats.length > 0 && (
                <Button
                  variant="ghost"
                  onClick={handlePlayAll}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Play All
                </Button>
              )}
            </div>
            
            {beatsLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : soundpackBeats && soundpackBeats.length > 0 ? (
              <div className="space-y-1">
                {soundpackBeats.map((beat, index) => {
                  const isCurrentBeat = currentBeat?.id === beat.id;
                  const isCurrentPlaying = isCurrentBeat && isPlaying;
                  
                  return (
                    <div 
                      key={beat.id}
                      className={`flex items-center gap-4 px-2 py-3 rounded-lg transition-colors ${
                        isCurrentBeat ? 'bg-primary/10' : 'hover:bg-muted/30'
                      }`}
                    >
                      {/* Play button */}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="flex-shrink-0 w-8 h-8"
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
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </Button>
                      
                      {/* Filename */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${
                          isCurrentBeat ? 'text-primary' : 'text-foreground'
                        }`}>
                          {beat.title}
                        </p>
                      </div>
                      
                      {/* Duration */}
                      <span className="text-sm text-muted-foreground flex-shrink-0 w-16 text-right">
                        0:00
                      </span>
                      
                      {/* File type */}
                      <span className="text-sm text-muted-foreground flex-shrink-0 w-16">
                        .wav
                      </span>
                      
                      {/* File type (right aligned) - duplicate for layout */}
                      <span className="text-sm text-muted-foreground flex-shrink-0 w-16 text-right hidden sm:block">
                        .wav
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Music size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No files found in this soundpack.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayoutWithPlayer>
  );
};

export default SoundpackDetail;
