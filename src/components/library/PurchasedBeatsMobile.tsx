
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DownloadIcon, Play, Pause, ChevronDown, FileMusic, Archive } from 'lucide-react';
import { Beat } from '@/types';
import { usePlayer } from '@/context/PlayerContext';
import { Badge } from '@/components/ui/badge';

interface PurchasedBeatsMobileProps {
  beats: Beat[];
  purchaseDetails: Record<string, { licenseType: string, purchaseDate: string }>;
  onDownload: (beat: Beat, downloadType?: 'track' | 'stems') => void;
}

export function PurchasedBeatsMobile({ beats, purchaseDetails, onDownload }: PurchasedBeatsMobileProps) {
  const { isPlaying, currentBeat, playBeat } = usePlayer();
  const [downloadingItems, setDownloadingItems] = useState<Set<string>>(new Set());

  const handlePlayBeat = (beat: Beat) => {
    if (currentBeat?.id === beat.id) {
      if (isPlaying) {
        playBeat(null);
      } else {
        playBeat(beat);
      }
    } else {
      playBeat(beat);
    }
  };

  const handleDownloadWithFeedback = async (beat: Beat, downloadType?: 'track' | 'stems') => {
    const itemKey = `${beat.id}-${downloadType}`;
    setDownloadingItems(prev => new Set(prev).add(itemKey));
    
    try {
      await onDownload(beat, downloadType);
    } finally {
      setDownloadingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemKey);
        return newSet;
      });
    }
  };

  return (
    <div className="space-y-3">
      {beats.map((beat) => (
        <div key={beat.id} className="relative border rounded-lg overflow-hidden">
          <div className="flex items-center space-x-3 p-3">
            <div 
              className="relative h-14 w-14 flex-shrink-0 rounded-md overflow-hidden cursor-pointer group"
              onClick={() => handlePlayBeat(beat)}
            >
              <img
                src={beat.cover_image_url}
                alt={beat.title}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                {isPlaying && currentBeat?.id === beat.id ? (
                  <Pause className="h-5 w-5 text-white" />
                ) : (
                  <Play className="h-5 w-5 ml-0.5 text-white" />
                )}
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-medium text-sm truncate">{beat.title}</h3>
              <p className="text-xs text-muted-foreground">{beat.producer_name}</p>
              <div className="flex items-center gap-2 mt-1">
                {beat.bpm && (
                  <span className="text-xs text-muted-foreground">{beat.bpm} BPM</span>
                )}
                {beat.key && (
                  <span className="text-xs text-muted-foreground">{beat.key}</span>
                )}
                {beat.stems_url && (
                  <Badge variant="secondary" className="text-xs">
                    <Archive className="h-3 w-3 mr-1" />
                    Stems
                  </Badge>
                )}
              </div>
            </div>
            {beat.stems_url ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" size="sm" className="flex items-center gap-1">
                    <DownloadIcon className="h-4 w-4" />
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      onClick={() => handleDownloadWithFeedback(beat, 'track')}
                      disabled={downloadingItems.has(`${beat.id}-track`)}
                    >
                      <FileMusic className="h-4 w-4 mr-2" />
                      Track ({beat.full_track_url?.toLowerCase().includes('.mp3') ? '.mp3' : '.wav'})
                    </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleDownloadWithFeedback(beat, 'stems')}
                    disabled={downloadingItems.has(`${beat.id}-stems`)}
                  >
                    <Archive className="h-4 w-4 mr-2" />
                    Stems (.zip)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleDownloadWithFeedback(beat, 'track')}
                disabled={downloadingItems.has(`${beat.id}-track`)}
                className="flex items-center gap-1"
              >
                {downloadingItems.has(`${beat.id}-track`) ? (
                  <div className="animate-pulse">⏳</div>
                ) : (
                  <FileMusic className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
          <div className="mt-1 px-3 pb-2 text-xs text-muted-foreground flex justify-between">
            <span className="capitalize">{purchaseDetails[beat.id]?.licenseType || 'Basic'} License</span>
            {beat.stems_url ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 text-xs text-primary">
                    <DownloadIcon className="h-3 w-3 mr-1" />
                    Download
                    <ChevronDown className="h-3 w-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      onClick={() => handleDownloadWithFeedback(beat, 'track')}
                      disabled={downloadingItems.has(`${beat.id}-track`)}
                    >
                      <FileMusic className="h-3 w-3 mr-1" />
                      Track ({beat.full_track_url?.toLowerCase().includes('.mp3') ? '.mp3' : '.wav'})
                    </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleDownloadWithFeedback(beat, 'stems')}
                    disabled={downloadingItems.has(`${beat.id}-stems`)}
                  >
                    <Archive className="h-3 w-3 mr-1" />
                    Stems
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDownloadWithFeedback(beat, 'track')}
                disabled={downloadingItems.has(`${beat.id}-track`)}
                className="h-6 text-xs text-primary"
              >
                <FileMusic className="h-3 w-3 mr-1" />
                {downloadingItems.has(`${beat.id}-track`) ? 'Downloading...' : `Download (${beat.full_track_url?.toLowerCase().includes('.mp3') ? '.mp3' : '.wav'})`}
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
