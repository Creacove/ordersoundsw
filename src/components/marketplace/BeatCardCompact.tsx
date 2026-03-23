import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Play, ShoppingCart, ArrowUpRight } from "lucide-react";
import { Beat } from "@/types";
import { usePlayer } from "@/context/PlayerContext";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button } from "@/components/ui/button";
import { PriceTag } from "@/components/ui/PriceTag";
import { toast } from "sonner";
import { useCartLightweight } from "@/hooks/useCartLightweight";
import { supabase } from "@/integrations/supabase/client";
import { ToggleFavoriteButton } from "@/components/buttons/ToggleFavoriteButton";
import { getFirstAvailableLicense } from "@/utils/licenseUtils";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";

interface BeatCardCompactProps {
  beat: Beat;
}

/** Animated equalizer bars – shown when a track is actively playing */
function EqBars() {
  return (
    <span className="flex items-end gap-[3px] h-5">
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          className="w-[3px] rounded-sm bg-white"
          style={{
            animation: `eq-bar ${0.6 + i * 0.15}s ease-in-out infinite alternate`,
            animationDelay: `${i * 0.12}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes eq-bar {
          from { height: 4px; }
          to   { height: 18px; }
        }
      `}</style>
    </span>
  );
}

export function BeatCardCompact({ beat }: BeatCardCompactProps) {
  const { currentBeat, isPlaying, togglePlayPause, playBeat } = usePlayer();
  const { addToCart } = useCartLightweight();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [isPlayButtonClicked, setIsPlayButtonClicked] = useState(false);
  const [addToCartNotified, setAddToCartNotified] = useState(false);

  const firstLicense = getFirstAvailableLicense(beat);
  const isCurrentBeat = currentBeat?.id === beat.id;
  const isCurrentlyPlaying = isCurrentBeat && isPlaying;

  const incrementPlayCount = async (beatId: string) => {
    try {
      await supabase.rpc("increment_counter" as never, {
        p_table_name: "beats",
        p_column_name: "plays",
        p_id: beatId,
      } as never);
    } catch (error) {
      console.error("Error incrementing play count:", error);
    }
  };

  const handlePlay = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (isPlayButtonClicked) return;
    setIsPlayButtonClicked(true);
    try {
      if (isCurrentBeat) {
        togglePlayPause();
      } else {
        if (!beat.preview_url) return;
        playBeat(beat);
        incrementPlayCount(beat.id);
      }
    } catch (error) {
      console.error("Error handling play:", error);
    } finally {
      setTimeout(() => setIsPlayButtonClicked(false), 1000);
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!addToCartNotified) {
      addToCart(beat.id, firstLicense.type);
      toast.success(`Added ${beat.title} to cart`);
      setAddToCartNotified(true);
      setTimeout(() => setAddToCartNotified(false), 2000);
    }
  };

  // On mobile: the whole card plays the track. On desktop: it navigates.
  const handleCardClick = (e: React.MouseEvent) => {
    if (isMobile) {
      e.preventDefault();
      handlePlay();
    }
    // On desktop, the Link component handles navigation naturally
  };

  const cardClasses = cn(
    "group relative block h-full overflow-hidden rounded-[1.6rem] border bg-[#0d101b]/76 p-2 transition-all duration-300 hover:-translate-y-1 hover:bg-[#111425]",
    isCurrentlyPlaying
      ? "border-[#9A3BDC] shadow-[0_0_25px_rgba(154,59,220,0.25)] ring-1 ring-[#9A3BDC]/50"
      : "border-white/10 hover:border-white/18 shadow-[0_24px_70px_rgba(4,6,20,0.22)]"
  );

  const cardContent = (
    <>
      {/* Ambient glow overlay when playing */}
      {isCurrentlyPlaying && (
        <div className="absolute inset-0 z-0 pointer-events-none animate-pulse bg-gradient-to-b from-[#9A3BDC]/5 to-transparent" />
      )}

      <div className="relative overflow-hidden rounded-[1.25rem]">
        <AspectRatio ratio={1}>
          <img
            src={beat.cover_image_url || "/placeholder.svg"}
            alt={beat.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "/placeholder.svg";
            }}
          />
        </AspectRatio>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#090b16]/90 via-[#090b16]/20 to-transparent" />

        {/* Top badges */}
        <div className="absolute left-3 top-3 flex items-center gap-2">
          <Badge variant="outline" className="bg-black/30 text-white backdrop-blur-sm border-white/20 text-[10px]">
            {beat.genre || "Beat"}
          </Badge>
          {beat.bpm > 0 && (
            <Badge variant="secondary" className="bg-black/30 text-white backdrop-blur-sm border-white/20 text-[10px]">
              {beat.bpm} BPM
            </Badge>
          )}
        </div>

        <ToggleFavoriteButton beatId={beat.id} />

        {/* Bottom action area */}
        <div
          className={cn(
            "absolute inset-x-0 bottom-0 p-3 flex items-end justify-between gap-3 transition-all duration-300",
            isCurrentlyPlaying
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0"
          )}
        >
          {/* On mobile: play/pause button (since tap on card = play) */}
          {/* On desktop: play button shown on hover */}
          {!isMobile && (
            <Button
              size="icon"
              rounded="full"
              className="h-11 w-11 shrink-0"
              onClick={handlePlay}
              disabled={isPlayButtonClicked}
            >
              {isCurrentlyPlaying ? <EqBars /> : <Play className="ml-0.5 h-4 w-4" />}
            </Button>
          )}

          {isMobile && isCurrentlyPlaying && (
            <Button
              size="icon"
              rounded="full"
              className="h-11 w-11 shrink-0"
              onClick={handlePlay}
              disabled={isPlayButtonClicked}
            >
              <EqBars />
            </Button>
          )}

          <div className={cn("flex items-center gap-2", !isMobile || !isCurrentlyPlaying ? "ml-auto" : "")}>
            {/* Navigate to beat page on mobile */}
            {isMobile && (
              <Button
                size="icon"
                variant="secondary"
                rounded="full"
                className="h-9 w-9 border-white/10 bg-white/10 text-white hover:bg-white/16"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/beat/${beat.id}`); }}
              >
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button
              size="icon"
              variant="secondary"
              rounded="full"
              className="h-11 w-11 border-white/10 bg-white/10 text-white hover:bg-white/16"
              onClick={handleAddToCart}
            >
              <ShoppingCart className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="px-1 pb-1 pt-3 sm:pt-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1.5 sm:gap-3">
          <div className="min-w-0 w-full">
            <h3 className="truncate text-sm sm:text-base font-semibold tracking-[-0.03em] text-white">
              {beat.title}
            </h3>
            <p className="truncate text-xs sm:text-sm text-muted-foreground">
              {beat.producer_name}
            </p>
          </div>
          <PriceTag
            localPrice={firstLicense.localPrice}
            diasporaPrice={firstLicense.diasporaPrice || firstLicense.localPrice}
            size="sm"
            className="shrink-0 self-start sm:self-auto bg-white/[0.08] text-white"
          />
        </div>
      </div>
    </>
  );

  // Mobile: card is a div that plays on tap, with a secondary navigate button inside
  // Desktop: card is a Link that navigates, with hover-revealed play button
  if (isMobile) {
    return (
      <div className={cardClasses} onClick={handleCardClick} role="button" aria-label={`Play ${beat.title}`}>
        {cardContent}
      </div>
    );
  }

  return (
    <Link to={`/beat/${beat.id}`} className={cardClasses}>
      {cardContent}
    </Link>
  );
}
