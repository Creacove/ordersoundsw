
import React, { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Music, Play, Pause, Trash2 } from 'lucide-react';
import { usePlayer } from "@/context/PlayerContext";
import { useAuth } from "@/context/AuthContext";
import { Beat } from '@/types';

interface CartItemCardProps {
  item: {
    itemId: string;
    licenseType: string;
    addedAt: string;
    beat: {
      id: string;
      title: string;
      producer_name: string;
      cover_image_url: string;
      genre?: string;
      basic_license_price_local?: number;
      basic_license_price_diaspora?: number;
      premium_license_price_local?: number;
      premium_license_price_diaspora?: number;
      exclusive_license_price_local?: number;
      exclusive_license_price_diaspora?: number;
    };
  };
  price: number;
  onRemove: (itemId: string) => void;
}

const CartItemCard = memo(({ item, price, onRemove }: CartItemCardProps) => {
  const { isPlaying, currentBeat, playBeat } = usePlayer();
  const { currency } = useAuth();

  const handlePlayBeat = () => {
    // Create a complete Beat object for the player
    const completeBeat: Beat = {
      id: item.beat.id,
      title: item.beat.title || 'Unknown Beat',
      producer_id: '', // Not needed for playback
      producer_name: item.beat.producer_name || 'Unknown Producer',
      cover_image_url: item.beat.cover_image_url || '',
      preview_url: '', // Will be handled by the player
      full_track_url: '', // Will be handled by the player
      genre: item.beat.genre || '',
      track_type: 'Beat' as const,
      bpm: 0,
      tags: [],
      created_at: new Date().toISOString(),
      favorites_count: 0,
      purchase_count: 0,
      status: 'published' as const,
      basic_license_price_local: item.beat.basic_license_price_local || 0,
      basic_license_price_diaspora: item.beat.basic_license_price_diaspora || 0,
      premium_license_price_local: item.beat.premium_license_price_local || 0,
      premium_license_price_diaspora: item.beat.premium_license_price_diaspora || 0,
      exclusive_license_price_local: item.beat.exclusive_license_price_local || 0,
      exclusive_license_price_diaspora: item.beat.exclusive_license_price_diaspora || 0,
      selected_license: item.licenseType
    };

    if (currentBeat?.id === item.beat.id) {
      playBeat(isPlaying ? null : completeBeat);
    } else {
      playBeat(completeBeat);
    }
  };

  // Calculate the correct price based on currency and license type
  const getCorrectPrice = () => {
    const licenseType = item.licenseType;
    const beat = item.beat;
    
    if (currency === 'NGN') {
      // Use local prices for NGN
      if (licenseType === 'basic') return beat.basic_license_price_local || 0;
      if (licenseType === 'premium') return beat.premium_license_price_local || 0;
      if (licenseType === 'exclusive') return beat.exclusive_license_price_local || 0;
    } else {
      // Use diaspora prices for USD
      if (licenseType === 'basic') return beat.basic_license_price_diaspora || 0;
      if (licenseType === 'premium') return beat.premium_license_price_diaspora || 0;
      if (licenseType === 'exclusive') return beat.exclusive_license_price_diaspora || 0;
    }
    
    return 0;
  };

  const displayPrice = getCorrectPrice();

  return (
    <div className="border rounded-xl bg-card/50 backdrop-blur-sm shadow-sm p-3 flex gap-3">
      <div className="flex-shrink-0 w-16 h-16">
        <div
          className="relative w-16 h-16 rounded-md overflow-hidden cursor-pointer group"
          onClick={handlePlayBeat}
        >
          <img
            src={item.beat.cover_image_url || "/placeholder.svg"}
            alt={item.beat.title || "Beat"}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "/placeholder.svg";
            }}
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            {isPlaying && currentBeat?.id === item.beat.id ? (
              <Pause className="h-6 w-6 text-white" />
            ) : (
              <Play className="h-6 w-6 ml-1 text-white" />
            )}
          </div>
        </div>
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold truncate">{item.beat.title || 'Unknown Beat'}</h3>
            <p className="text-xs text-muted-foreground">{item.beat.producer_name || 'Unknown Producer'}</p>
            
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {item.beat.genre && (
                <Badge variant="outline" className="text-xs py-0 px-1.5">
                  <Music size={10} className="mr-1" />
                  {item.beat.genre}
                </Badge>
              )}
              
              <Badge variant="secondary" className="text-xs py-0 px-1.5 capitalize">
                {item.licenseType} License
              </Badge>
            </div>
          </div>
          
          <div className="flex flex-col items-end">
            <span className="font-semibold text-sm">
              {currency === 'NGN' ? '₦' : '$'}
              {Math.round(displayPrice).toLocaleString()}
            </span>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-muted-foreground hover:text-destructive mt-1"
              onClick={() => onRemove(item.itemId)}
            >
              <Trash2 size={16} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
});

CartItemCard.displayName = 'CartItemCard';

export default CartItemCard;
