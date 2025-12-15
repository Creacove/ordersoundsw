import React, { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, Trash2 } from 'lucide-react';
import { useAuth } from "@/context/AuthContext";

interface SoundpackCartItemCardProps {
  item: {
    itemId: string;
    licenseType: string;
    addedAt: string;
    soundpack: {
      id: string;
      title: string;
      producer_name: string;
      cover_art_url: string;
      file_count?: number;
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

const SoundpackCartItemCard = memo(({ item, price, onRemove }: SoundpackCartItemCardProps) => {
  const { currency } = useAuth();

  const getCorrectPrice = () => {
    const licenseType = item.licenseType;
    const soundpack = item.soundpack;

    if (currency === 'NGN') {
      if (licenseType === 'basic') return soundpack.basic_license_price_local || 0;
      if (licenseType === 'premium') return soundpack.premium_license_price_local || 0;
      if (licenseType === 'exclusive') return soundpack.exclusive_license_price_local || 0;
    } else {
      if (licenseType === 'basic') return soundpack.basic_license_price_diaspora || 0;
      if (licenseType === 'premium') return soundpack.premium_license_price_diaspora || 0;
      if (licenseType === 'exclusive') return soundpack.exclusive_license_price_diaspora || 0;
    }

    return 0;
  };

  const displayPrice = getCorrectPrice();

  return (
    <div className="border rounded-xl bg-card/50 backdrop-blur-sm shadow-sm p-3 flex gap-3">
      <div className="flex-shrink-0 w-16 h-16">
        <div className="relative w-16 h-16 rounded-md overflow-hidden">
          <img
            src={item.soundpack.cover_art_url || "/placeholder.svg"}
            alt={item.soundpack.title || "Soundpack"}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "/placeholder.svg";
            }}
          />
          {item.soundpack.file_count && (
            <Badge className="absolute bottom-1 left-1 h-5 px-1.5 text-[10px] bg-primary/90">
              <Package size={10} className="mr-1" />
              {item.soundpack.file_count}
            </Badge>
          )}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-y-3 sm:gap-y-0">
          <div className="flex-1 min-w-0 sm:mr-3">
            <h3 className="font-semibold truncate">{item.soundpack.title || 'Unknown Soundpack'}</h3>
            <p className="text-xs text-muted-foreground">{item.soundpack.producer_name || 'Unknown Producer'}</p>

            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge variant="outline" className="text-xs py-0 px-1.5">
                <Package size={10} className="mr-1" />
                Soundpack
              </Badge>

              <Badge variant="secondary" className="text-xs py-0 px-1.5 capitalize">
                {item.licenseType} License
              </Badge>
            </div>
          </div>

          <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start w-full sm:w-auto flex-shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-border/50 sm:border-transparent mt-1 sm:mt-0">
            <span className="font-semibold text-sm order-1 sm:order-none">
              {currency === 'NGN' ? '₦' : '$'}
              {Math.round(displayPrice).toLocaleString()}
            </span>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive -ml-2 sm:ml-0 order-2 sm:order-none sm:mt-1"
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

SoundpackCartItemCard.displayName = 'SoundpackCartItemCard';

export default SoundpackCartItemCard;
