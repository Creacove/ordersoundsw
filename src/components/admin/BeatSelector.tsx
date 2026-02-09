import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Music, Check, X, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { useDebounce } from '@/hooks/useDebounce';
import { format } from 'date-fns';

interface Beat {
  id: string;
  title: string;
  cover_image: string | null;
  genre: string | null;
  upload_date: string | null;
  is_trending: boolean | null;
  is_featured: boolean | null;
  is_weekly_pick: boolean | null;
  producer: {
    id: string;
    stage_name: string | null;
    full_name: string;
  } | null;
}

interface BeatSelectorProps {
  mode: 'single' | 'multi';
  maxSelections?: number;
  onConfirm: (beatIds: string[]) => void;
  isLoading?: boolean;
  triggerLabel: string;
  dialogTitle: string;
  currentBeatIds?: string[];
}

export function BeatSelector({ 
  mode, 
  maxSelections = 5, 
  onConfirm, 
  isLoading,
  triggerLabel,
  dialogTitle,
  currentBeatIds = []
}: BeatSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [beats, setBeats] = useState<Beat[]>([]);
  const [beatsLoading, setBeatsLoading] = useState(false);
  const [selectedBeatIds, setSelectedBeatIds] = useState<string[]>([]);
  
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Fetch beats when dialog opens or search changes
  useEffect(() => {
    if (isOpen) {
      fetchBeats();
    }
  }, [isOpen, debouncedSearch]);

  // Reset selection when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSelectedBeatIds([]);
    }
  }, [isOpen]);

  const fetchBeats = async () => {
    setBeatsLoading(true);
    try {
      let query = supabase
        .from('beats')
        .select(`
          id,
          title,
          cover_image,
          genre,
          upload_date,
          is_trending,
          is_featured,
          is_weekly_pick,
          producer_id
        `)
        .eq('status', 'published')
        .order('upload_date', { ascending: false })
        .limit(50);

      if (debouncedSearch.trim()) {
        query = query.or(`title.ilike.%${debouncedSearch}%,genre.ilike.%${debouncedSearch}%`);
      }

      const { data: beatsData, error } = await query;

      if (error) throw error;

      // Fetch producer info for each beat
      if (beatsData && beatsData.length > 0) {
        const producerIds = [...new Set(beatsData.map(b => b.producer_id))];
        const { data: producersData } = await supabase
          .from('users')
          .select('id, stage_name, full_name')
          .in('id', producerIds);

        const producerMap = new Map(producersData?.map(p => [p.id, p]) || []);

        const beatsWithProducers: Beat[] = beatsData.map(beat => ({
          ...beat,
          producer: producerMap.get(beat.producer_id) || null
        }));

        setBeats(beatsWithProducers);
      } else {
        setBeats([]);
      }
    } catch (error) {
      console.error('Error fetching beats:', error);
      setBeats([]);
    } finally {
      setBeatsLoading(false);
    }
  };

  const handleBeatToggle = (beatId: string) => {
    if (mode === 'single') {
      setSelectedBeatIds([beatId]);
    } else {
      setSelectedBeatIds(prev => {
        if (prev.includes(beatId)) {
          return prev.filter(id => id !== beatId);
        }
        if (prev.length >= maxSelections) {
          return prev; // Don't add more than max
        }
        return [...prev, beatId];
      });
    }
  };

  const handleConfirm = () => {
    onConfirm(selectedBeatIds);
    setIsOpen(false);
    setSearchQuery('');
    setSelectedBeatIds([]);
  };

  const getStatusBadges = (beat: Beat) => {
    const badges = [];
    if (beat.is_trending) badges.push({ label: 'Trending', color: 'bg-orange-100 text-orange-800' });
    if (beat.is_featured) badges.push({ label: 'Featured', color: 'bg-yellow-100 text-yellow-800' });
    if (beat.is_weekly_pick) badges.push({ label: 'Weekly', color: 'bg-blue-100 text-blue-800' });
    if (currentBeatIds.includes(beat.id)) badges.push({ label: 'Current', color: 'bg-green-100 text-green-800' });
    return badges;
  };

  const formatUploadDate = (dateString: string | null) => {
    if (!dateString) return 'Unknown';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 30) return `${diffDays} days ago`;
      return format(date, 'MMM d, yyyy');
    } catch {
      return 'Unknown';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <Music className="h-4 w-4" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Music className="h-5 w-5" />
            {dialogTitle}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Search Section */}
          <div className="mb-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by title or genre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Selection Info */}
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {mode === 'single' 
                ? 'Select one beat' 
                : `Selected: ${selectedBeatIds.length}/${maxSelections}`
              }
            </p>
            {selectedBeatIds.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedBeatIds([])}
                className="text-muted-foreground"
              >
                <X className="h-3 w-3 mr-1" />
                Clear
              </Button>
            )}
          </div>
          
          {/* Beats List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-2">
            {beatsLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-lg" />
                ))}
              </div>
            ) : beats.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Search className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  No beats found
                </h3>
                <p className="text-muted-foreground">
                  {searchQuery.trim() 
                    ? `No beats match "${searchQuery}"`
                    : "No published beats available"
                  }
                </p>
              </div>
            ) : (
              beats.map((beat) => {
                const isSelected = selectedBeatIds.includes(beat.id);
                const statusBadges = getStatusBadges(beat);
                
                return (
                  <div
                    key={beat.id}
                    onClick={() => handleBeatToggle(beat.id)}
                    className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                      isSelected 
                        ? 'bg-primary/10 border-primary' 
                        : 'bg-card hover:bg-muted/50 hover:border-muted-foreground/30'
                    }`}
                  >
                    {/* Checkbox/Radio */}
                    <div className="mr-3">
                      {mode === 'multi' ? (
                        <Checkbox checked={isSelected} />
                      ) : (
                        <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                          isSelected ? 'border-primary bg-primary' : 'border-muted-foreground'
                        }`}>
                          {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                        </div>
                      )}
                    </div>
                    
                    {/* Cover Image */}
                    <div className="h-14 w-14 rounded-md overflow-hidden bg-muted mr-3 flex-shrink-0">
                      {beat.cover_image ? (
                        <img 
                          src={beat.cover_image} 
                          alt={beat.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <Music className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    
                    {/* Beat Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium truncate">
                          {beat.title}
                        </h3>
                        {statusBadges.map((badge, i) => (
                          <Badge key={i} variant="secondary" className={`text-xs ${badge.color}`}>
                            {badge.label}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                        <span>
                          {beat.producer?.stage_name || beat.producer?.full_name || 'Unknown Producer'}
                        </span>
                        {beat.genre && (
                          <>
                            <span>•</span>
                            <span>{beat.genre}</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatUploadDate(beat.upload_date)}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={selectedBeatIds.length === 0}
          >
            {mode === 'single' 
              ? 'Set as Featured' 
              : `Confirm Selection (${selectedBeatIds.length})`
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
