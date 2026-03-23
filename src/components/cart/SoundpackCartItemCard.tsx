import React, { memo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, Trash2, Layers3 } from "lucide-react";
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
      cover_art_url?: string;
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

const SoundpackCartItemCard = memo(({ item, onRemove }: SoundpackCartItemCardProps) => {
  const { currency } = useAuth();

  const getCorrectPrice = () => {
    const licenseType = item.licenseType;
    const soundpack = item.soundpack;

    if (currency === "NGN") {
      if (licenseType === "basic") return soundpack.basic_license_price_local || 0;
      if (licenseType === "premium") return soundpack.premium_license_price_local || 0;
      if (licenseType === "exclusive") return soundpack.exclusive_license_price_local || 0;
    } else {
      if (licenseType === "basic") return soundpack.basic_license_price_diaspora || 0;
      if (licenseType === "premium") return soundpack.premium_license_price_diaspora || 0;
      if (licenseType === "exclusive") return soundpack.exclusive_license_price_diaspora || 0;
    }

    return 0;
  };

  const displayPrice = getCorrectPrice();

  return (
    <div className="panel overflow-hidden p-3 sm:p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative h-24 w-full overflow-hidden rounded-[1.2rem] border border-white/10 sm:h-24 sm:w-24">
          <img
            src={item.soundpack.cover_art_url || "/placeholder.svg"}
            alt={item.soundpack.title || "Soundpack"}
            className="h-full w-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "/placeholder.svg";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#090b16] via-transparent to-transparent" />
          {item.soundpack.file_count && (
            <Badge className="absolute bottom-2 left-2 bg-[#0a0d18]/85 text-white">
              <Package size={10} className="mr-1" />
              {item.soundpack.file_count}
            </Badge>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <h3 className="truncate text-lg font-semibold tracking-[-0.04em] text-white">
                {item.soundpack.title || "Unknown Soundpack"}
              </h3>
              <p className="text-sm text-muted-foreground">{item.soundpack.producer_name || "Unknown Producer"}</p>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="bg-white/[0.04] text-white">
                  <Layers3 size={10} className="mr-1" />
                  Soundpack
                </Badge>
                <Badge variant="secondary" className="capitalize">
                  {item.licenseType} license
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 lg:flex-col lg:items-end">
              <div className="text-right">
                <div className="text-[0.68rem] uppercase tracking-[0.18em] text-muted-foreground">Price</div>
                <div className="mt-1 text-lg font-semibold text-white">
                  {currency === "NGN" ? "₦" : "$"}
                  {Math.round(displayPrice).toLocaleString()}
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon-sm"
                rounded="full"
                className="text-muted-foreground hover:text-destructive"
                onClick={() => onRemove(item.itemId)}
              >
                <Trash2 size={16} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

SoundpackCartItemCard.displayName = "SoundpackCartItemCard";

export default SoundpackCartItemCard;
