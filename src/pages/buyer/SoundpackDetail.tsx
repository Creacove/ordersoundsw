import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  ShoppingCart, Download, Share2, ArrowLeft, Package, User, Music, Play, Pause
} from 'lucide-react';
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
  const [selectedLicense, setSelectedLicense] = useState<string>('basic');
  const isMobile = useIsMobile();
  const { playBeat, currentBeat, isPlaying, togglePlayPause } = usePlayer();

  const { data: soundpack, isLoading: soundpackLoading } = useQuery({
    queryKey: ['soundpack', soundpackId],
    queryFn: async () => {
      if (!soundpackId) throw new Error('Soundpack ID is required');
      
      const { data, error } = await supabase
        .from('soundpacks')
        .select(`
          *,
          users!soundpacks_producer_id_fkey (
            full_name,
            stage_name,
            profile_picture
          )
        `)
        .eq('id', soundpackId)
        .single();
      
      if (error) throw error;
      if (!data) throw new Error('Soundpack not found');
      
      const userData = Array.isArray(data.users) ? data.users[0] : data.users;
      
      return {
        ...data,
        producer_name: userData?.stage_name || userData?.full_name || 'Unknown Producer',
        producer_profile_picture: userData?.profile_picture
      };
    },
    enabled: !!soundpackId,
  });

  const { data: soundpackBeats, isLoading: beatsLoading } = useQuery({
    queryKey: ['soundpack-beats', soundpackId],
    queryFn: async () => {
      if (!soundpackId) return [];
      
      const { data, error } = await supabase
        .from('beats')
        .select('*')
        .eq('soundpack_id', soundpackId)
        .order('title');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!soundpackId,
  });

  const handleAddToCart = () => {
    if (!soundpack) return;
    
    if (isInCart(soundpack.id)) {
      toast.info('Already in cart');
    } else {
      addToCart(soundpack.id, selectedLicense);
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

  const getPriceForLicense = () => {
    if (!soundpack) return 0;
    
    if (currency === 'NGN') {
      switch (selectedLicense) {
        case 'basic': return soundpack.basic_license_price_local;
        case 'premium': return soundpack.premium_license_price_local;
        case 'exclusive': return soundpack.exclusive_license_price_local;
        case 'custom': return soundpack.custom_license_price_local;
        default: return soundpack.basic_license_price_local;
      }
    } else {
      switch (selectedLicense) {
        case 'basic': return soundpack.basic_license_price_diaspora;
        case 'premium': return soundpack.premium_license_price_diaspora;
        case 'exclusive': return soundpack.exclusive_license_price_diaspora;
        case 'custom': return soundpack.custom_license_price_diaspora;
        default: return soundpack.basic_license_price_diaspora;
      }
    }
  };

  const price = getPriceForLicense();

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
      <div className="p-4 max-w-7xl mx-auto space-y-6">
        {/* Back button */}
        <div className="flex gap-2">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          {user?.id === soundpack.producer_id && (
            <Button
              variant="outline"
              onClick={() => navigate('/producer/beats')}
            >
              <Music className="w-4 h-4 mr-2" />
              My Beats
            </Button>
          )}
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Cover image */}
          <div className="relative">
            <img
              src={soundpack.cover_art_url || "/placeholder.svg"}
              alt={soundpack.title}
              className="w-full aspect-square object-cover rounded-lg shadow-lg"
            />
            <Badge 
              className="absolute top-4 left-4 bg-primary/90 text-white flex items-center gap-1"
              variant="default"
            >
              <Package size={14} />
              Soundpack - {soundpack.file_count} files
            </Badge>
          </div>

          {/* Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-bold mb-2">{soundpack.title}</h1>
              <Link
                to={`/producer/${soundpack.producer_id}`}
                className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
              >
                <User size={16} />
                by {soundpack.producer_name}
              </Link>
            </div>

            {soundpack.description && (
              <p className="text-muted-foreground">{soundpack.description}</p>
            )}

            {/* License selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Select License</label>
              <div className="grid grid-cols-2 gap-2">
                {['basic', 'premium', 'exclusive', 'custom'].map((license) => (
                  <Button
                    key={license}
                    variant={selectedLicense === license ? 'default' : 'outline'}
                    onClick={() => setSelectedLicense(license)}
                    className="capitalize"
                  >
                    {license}
                  </Button>
                ))}
              </div>
            </div>

            {/* Price and actions */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Price</p>
                    <p className="text-3xl font-bold">{formatCurrency(price, currency)}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={handleAddToCart}
                    className="flex-1"
                    size="lg"
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    {isInCart(soundpack.id) ? 'In Cart' : 'Add to Cart'}
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleShare}
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Included files */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Music size={24} />
            Included Files ({soundpack.file_count})
          </h2>
          
          {beatsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : soundpackBeats && soundpackBeats.length > 0 ? (
            <div className="grid gap-3">
              {soundpackBeats.map((beat, index) => {
                const isCurrentBeat = currentBeat?.id === beat.id;
                const isCurrentPlaying = isCurrentBeat && isPlaying;
                
                return (
                  <Card 
                    key={beat.id}
                    className={`transition-all duration-200 hover:shadow-md ${
                      isCurrentBeat ? 'border-primary bg-primary/5' : ''
                    }`}
                  >
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex items-center gap-3 sm:gap-4">
                        {/* Play button */}
                        <Button
                          size="icon"
                          variant={isCurrentBeat ? "default" : "outline"}
                          className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12"
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
                            <Pause className="w-4 h-4 sm:w-5 sm:h-5" />
                          ) : (
                            <Play className="w-4 h-4 sm:w-5 sm:h-5" />
                          )}
                        </Button>
                        
                        {/* Track info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <span className="text-muted-foreground font-mono text-sm sm:text-base flex-shrink-0">
                              {String(index + 1).padStart(2, '0')}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className={`font-semibold truncate text-sm sm:text-base ${
                                isCurrentBeat ? 'text-primary' : ''
                              }`}>
                                {beat.title}
                              </p>
                              {beat.genre && (
                                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                                  {beat.genre}
                                  {beat.bpm && ` • ${beat.bpm} BPM`}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Playing indicator */}
                        {isCurrentPlaying && (
                          <div className="flex gap-0.5 items-end h-4 flex-shrink-0">
                            <div className="w-0.5 bg-primary animate-pulse h-2" style={{ animationDelay: '0ms' }} />
                            <div className="w-0.5 bg-primary animate-pulse h-3" style={{ animationDelay: '150ms' }} />
                            <div className="w-0.5 bg-primary animate-pulse h-4" style={{ animationDelay: '300ms' }} />
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
