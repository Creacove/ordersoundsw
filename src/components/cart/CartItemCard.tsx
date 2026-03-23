import React, { memo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Music, Play, Pause, Trash2, AudioWaveform } from "lucide-react";
import { usePlayer } from "@/context/PlayerContext";
import { useAuth } from "@/context/AuthContext";
import { Beat } from "@/types";

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

const CartItemCard = memo(({ item, onRemove }: CartItemCardProps) => {
  const { isPlaying, currentBeat, playBeat } = usePlayer();
  const { currency } = useAuth();

  const handlePlayBeat = () => {
    const completeBeat: Beat = {
      id: item.beat.id,
      title: item.beat.title || "Unknown Beat",
      producer_id: "",
      producer_name: item.beat.producer_name || "Unknown Producer",
      cover_image_url: item.beat.cover_image_url || "",
      preview_url: "",
      full_track_url: "",
      genre: item.beat.genre || "",
      track_type: "Beat" as const,
      bpm: 0,
      tags: [],
      created_at: new Date().toISOString(),
      favorites_count: 0,
      purchase_count: 0,
      status: "published" as const,
      basic_license_price_local: item.beat.basic_license_price_local || 0,
      basic_license_price_diaspora: item.beat.basic_license_price_diaspora || 0,
      premium_license_price_local: item.beat.premium_license_price_local || 0,
      premium_license_price_diaspora: item.beat.premium_license_price_diaspora || 0,
      exclusive_license_price_local: item.beat.exclusive_license_price_local || 0,
      exclusive_license_price_diaspora: item.beat.exclusive_license_price_diaspora || 0,
      selected_license: item.licenseType,
    };

    if (currentBeat?.id === item.beat.id) {
      playBeat(isPlaying ? null : completeBeat);
    } else {
      playBeat(completeBeat);
    }
  };

  const getCorrectPrice = () => {
    const licenseType = item.licenseType;
    const beat = item.beat;

    if (currency === "NGN") {
      if (licenseType === "basic") return beat.basic_license_price_local || 0;
      if (licenseType === "premium") return beat.premium_license_price_local || 0;
      if (licenseType === "exclusive") return beat.exclusive_license_price_local || 0;
    } else {
      if (licenseType === "basic") return beat.basic_license_price_diaspora || 0;
      if (licenseType === "premium") return beat.premium_license_price_diaspora || 0;
      if (licenseType === "exclusive") return beat.exclusive_license_price_diaspora || 0;
    }

    return 0;
  };

  const displayPrice = getCorrectPrice();

  return (
    <div className="panel overflow-hidden p-3 sm:p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative h-24 w-full overflow-hidden rounded-[1.2rem] border border-white/10 sm:h-24 sm:w-24">
          <img
            src={item.beat.cover_image_url || "/placeholder.svg"}
            alt={item.beat.title || "Beat"}
            className="h-full w-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "/placeholder.svg";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#090b16] via-transparent to-transparent" />
          <Button
            variant="secondary"
            size="icon-sm"
            rounded="full"
            className="absolute bottom-2 left-2 h-9 w-9 bg-[#0a0d18]/85 text-white hover:bg-[#0a0d18]"
            onClick={handlePlayBeat}
          >
            {isPlaying && currentBeat?.id === item.beat.id ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="ml-0.5 h-4 w-4" />
            )}
          </Button>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <h3 className="truncate text-lg font-semibold tracking-[-0.04em] text-white">
                {item.beat.title || "Unknown Beat"}
              </h3>
              <p className="text-sm text-muted-foreground">{item.beat.producer_name || "Unknown Producer"}</p>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {item.beat.genre && (
                  <Badge variant="outline" className="bg-white/[0.04] text-white">
                    <Music size={10} className="mr-1" />
                    {item.beat.genre}
                  </Badge>
                )}

                <Badge variant="secondary" className="capitalize">
                  <AudioWaveform className="mr-1 h-3 w-3" />
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

CartItemCard.displayName = "CartItemCard";

export default CartItemCard;
