import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { usePlayer } from "@/context/PlayerContext";
import { cn } from "@/lib/utils";
import { Play, Pause, SkipBack, SkipForward, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { QueuePopover } from "./QueuePopover";
import { TimeProgressBar } from "./TimeProgressBar";
import { VolumeControl } from "./VolumeControl";

interface PersistentPlayerProps {
  isCollapsed?: boolean;
  hideSidebar?: boolean;
}

export function PersistentPlayer({ isCollapsed = false, hideSidebar = false }: PersistentPlayerProps) {
  const {
    currentBeat,
    isPlaying,
    togglePlayPause,
    currentTime,
    duration,
    seek,
    volume,
    setVolume,
    queue = [],
    removeFromQueue,
    clearQueue,
    nextTrack,
    previousTrack,
    error = false,
    loading = false,
    reload,
  } = usePlayer();

  const isMobile = useIsMobile();
  const progressRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const progressPercentage = useMemo(() => {
    if (duration > 0 && !isDragging) {
      const progress = (currentTime / duration) * 100;
      return Math.min(progress, 100);
    }
    return 0;
  }, [currentTime, duration, isDragging]);

  const handleProgressInteraction = useCallback(
    (clientX: number) => {
      if (error || duration <= 0 || loading || !progressRef.current) return;

      const container = progressRef.current;
      const rect = container.getBoundingClientRect();
      const clickPosition = clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, clickPosition / rect.width));
      seek(percentage * duration);
    },
    [error, duration, loading, seek]
  );

  const handleProgressBarClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      handleProgressInteraction(e.clientX);
    },
    [handleProgressInteraction]
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      setIsDragging(true);
      handleProgressInteraction(e.touches[0].clientX);
    },
    [handleProgressInteraction]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (isDragging) {
        e.preventDefault();
        handleProgressInteraction(e.touches[0].clientX);
      }
    },
    [isDragging, handleProgressInteraction]
  );

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!currentBeat) return;

      switch (e.key) {
        case " ":
          e.preventDefault();
          togglePlayPause();
          break;
        case "ArrowLeft":
          e.preventDefault();
          seek(Math.max(0, currentTime - 10));
          break;
        case "ArrowRight":
          e.preventDefault();
          seek(Math.min(duration, currentTime + 10));
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [currentBeat, togglePlayPause, seek, currentTime, duration]);

  if (!currentBeat) {
    return <div className="fixed bottom-0 left-0 right-0 h-0 z-40" />;
  }

  const coverImageSrc = currentBeat.cover_image_url || "/placeholder.svg";

  return (
    <div 
      className={cn(
        "fixed right-0 z-40 transition-all duration-300", 
        isMobile 
          ? "left-0 bottom-[104px] px-3" 
          : cn(
              "bottom-4 px-4 lg:px-6",
              hideSidebar ? "left-0" : isCollapsed ? "left-0 lg:left-[96px]" : "left-0 lg:left-[272px]"
            )
      )}
    >
      <div className="page-shell px-0">
        <div className="mx-auto overflow-hidden rounded-[1.9rem] border border-white/12 bg-[#0a0d18]/88 shadow-[0_24px_90px_rgba(4,6,20,0.55)] backdrop-blur-2xl">
          <div
            ref={progressRef}
            className="relative h-1.5 w-full cursor-pointer bg-white/[0.06] touch-none"
            onClick={handleProgressBarClick}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div
              className={cn(
                "h-full bg-[#9A3BDC] transition-all",
                loading && "animate-pulse bg-amber-500"
              )}
              style={{ width: `${progressPercentage}%` }}
            />
            <div className="absolute inset-0 py-2" style={{ touchAction: "none" }} />
          </div>

          <div className={cn("flex items-center gap-3 px-3 py-3 md:px-4", isMobile ? "pr-4" : "gap-4")}>
            <div className="flex min-w-0 flex-1 items-center gap-3 md:w-1/3 md:flex-none">
              <div className="h-12 w-12 overflow-hidden rounded-[1rem] border border-white/10 bg-white/[0.06] md:h-14 md:w-14">
                <img
                  src={coverImageSrc}
                  alt={currentBeat.title}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "/placeholder.svg";
                  }}
                />
              </div>
              <div className="min-w-0 overflow-hidden">
                <p className="truncate text-sm font-semibold md:text-base">{currentBeat.title}</p>
                <p className="truncate text-xs text-muted-foreground md:text-sm">{currentBeat.producer_name}</p>
              </div>
            </div>

            <div className={cn("flex items-center gap-1 md:gap-2", isMobile ? "ml-auto" : "justify-center flex-1")}>
              {!isMobile && (
                <Button variant="ghost" size="icon-sm" rounded="full" onClick={previousTrack} disabled={loading}>
                  <SkipBack className="h-4 w-4" />
                </Button>
              )}

              <Button
                variant={error ? "destructive" : "default"}
                size="icon"
                rounded="full"
                className="h-11 w-11 md:h-12 md:w-12"
                onClick={error && reload ? reload : togglePlayPause}
                disabled={loading && !error}
              >
                {loading ? (
                  <Loader size={16} className="animate-spin" />
                ) : isPlaying ? (
                  <Pause size={17} />
                ) : (
                  <Play size={17} className="ml-0.5" />
                )}
              </Button>

              {!isMobile && (
                <Button variant="ghost" size="icon-sm" rounded="full" onClick={nextTrack} disabled={loading}>
                  <SkipForward className="h-4 w-4" />
                </Button>
              )}
            </div>

            {!isMobile && (
              <div className="hidden w-1/3 items-center justify-end gap-3 md:flex">
                <TimeProgressBar
                  currentTime={currentTime}
                  duration={duration}
                  seek={seek}
                  isMobile={isMobile}
                  error={error}
                  loading={loading}
                  onRetry={reload}
                />
                <VolumeControl volume={volume} setVolume={setVolume} />
                <QueuePopover queue={queue} clearQueue={clearQueue} removeFromQueue={removeFromQueue} />
              </div>
            )}

            {isMobile && (
              <div className="ml-1 text-[11px] font-medium text-muted-foreground">
                {Math.floor(currentTime / 60)}:{String(Math.floor(currentTime % 60)).padStart(2, "0")}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
