
import { useEffect } from "react";
import { useBeats } from "@/hooks/useBeats";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Music, Heart, ShoppingCart, Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";
import { usePlayer } from "@/context/PlayerContext";
import { BeatListItem } from "@/components/ui/BeatListItem";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { getLicensePrice } from '@/utils/licenseUtils';

export default function Charts() {
  const { beats, isLoading, toggleFavorite, isFavorite, isPurchased } = useBeats();
  const { addToCart, isInCart } = useCart();
  const { playBeat, isPlaying, currentBeat } = usePlayer();
  const { currency } = useAuth();
  
  useEffect(() => {
    document.title = "Charts | OrderSOUNDS";
  }, []);

  // Sort beats by popularity (favorites + purchases)
  const chartBeats = [...beats]
    .sort((a, b) => 
      (b.favorites_count + b.purchase_count) - (a.favorites_count + a.purchase_count)
    )
    .slice(0, 20); // Top 20

  const handleAddToCart = (beat) => {
    if (!isInCart(beat.id)) {
      addToCart(beat);
      toast.success(`Added "${beat.title}" to cart`);
    } else {
      toast.info("This beat is already in your cart");
    }
  };

  const handlePlayBeat = (beat) => {
    playBeat(beat);
  };
  
  return (
    <div className="container py-8 md:py-12 px-4 md:px-6">
      <h1 className="text-2xl md:text-5xl font-black text-white tracking-tighter uppercase italic mb-8">Top Charts</h1>
      
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(10)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block rounded-2xl border border-white/5 bg-white/[0.01] overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-white/5">
                  <TableHead className="w-16 text-center">#</TableHead>
                  <TableHead>Track</TableHead>
                  <TableHead>Producer</TableHead>
                  <TableHead>Genre</TableHead>
                  <TableHead className="text-center">Popularity</TableHead>
                  <TableHead className="text-right pr-8">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {chartBeats.map((beat, index) => {
                  const isCurrentlyPlaying = isPlaying && currentBeat?.id === beat.id;
                  return (
                    <TableRow key={beat.id} className="hover:bg-white/[0.02] border-white/5 transition-colors group">
                      <TableCell className="text-center font-mono text-muted-foreground group-hover:text-white transition-colors">
                        {index + 1}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-4">
                          <div 
                            className="relative w-12 h-12 rounded-lg overflow-hidden cursor-pointer shadow-lg border border-white/5 group-hover:scale-105 transition-transform" 
                            onClick={() => handlePlayBeat(beat)}
                          >
                            <img 
                              src={beat.cover_image_url || "/placeholder.svg"} 
                              alt={beat.title}
                              className="w-full h-full object-cover"
                            />
                            <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${isCurrentlyPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                              {isCurrentlyPlaying ? <Pause size={20} className="text-white fill-white" /> : <Play size={20} className="text-white fill-white" />}
                            </div>
                          </div>
                          <div>
                            <span className={`font-bold block truncate max-w-[200px] ${isCurrentlyPlaying ? 'text-[#9A3BDC]' : 'text-white'}`}>{beat.title}</span>
                            <span className="text-xs text-muted-foreground uppercase tracking-widest font-medium">{beat.track_type || 'Beat'}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-white/70">{beat.producer_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="rounded-full border-white/10 bg-white/[0.03] text-white/50">{beat.genre}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center">
                          <span className="text-sm font-bold text-white">{(beat.favorites_count || 0) + (beat.purchase_count || 0)}</span>
                          <span className="text-[10px] uppercase text-muted-foreground tracking-tighter">Points</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <div className="flex justify-end gap-3 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all">
                          <button 
                            onClick={() => toggleFavorite(beat.id)}
                            className={cn(
                              "p-2.5 rounded-full border border-white/5 transition-all",
                              isFavorite(beat.id)
                                ? "bg-[#9A3BDC]/10 text-[#9A3BDC] border-[#9A3BDC]/20" 
                                : "bg-white/[0.03] text-white/40 hover:text-white hover:bg-white/10"
                            )}
                          >
                            <Heart size={18} fill={isFavorite(beat.id) ? "currentColor" : "none"} />
                          </button>
                          <button 
                            className={cn(
                              "p-2.5 rounded-full border border-white/5 transition-all",
                              isInCart(beat.id)
                                ? "bg-white text-black border-white"
                                : "bg-white/[0.03] text-white/40 hover:text-white hover:bg-white/10"
                            )}
                            onClick={() => handleAddToCart(beat)}
                          >
                            <ShoppingCart size={18} />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile List View */}
          <div className="md:hidden space-y-4">
            {chartBeats.map((beat, index) => (
              <div key={beat.id} className="relative bg-white/[0.01] border border-white/5 rounded-2xl p-4 overflow-hidden">
                <div className="absolute top-0 right-0 p-3">
                  <span className="font-black text-4xl text-white/5 italic">#{index + 1}</span>
                </div>
                <div className="flex items-center gap-4 relative z-10">
                  <div 
                    className="relative w-16 h-16 rounded-xl overflow-hidden shadow-xl border border-white/5"
                    onClick={() => handlePlayBeat(beat)}
                  >
                    <img src={beat.cover_image_url || "/placeholder.svg"} className="w-full h-full object-cover" alt={beat.title} />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                      {isPlaying && currentBeat?.id === beat.id ? <Pause size={20} fill="white" /> : <Play size={20} fill="white" />}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white truncate pr-10">{beat.title}</h3>
                    <p className="text-sm text-muted-foreground">{beat.producer_name}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-[10px] h-5 rounded-full border-white/10">{beat.genre}</Badge>
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest italic">{(beat.favorites_count || 0) + (beat.purchase_count || 0)} Points</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
                   <div className="flex items-center gap-3">
                     <button 
                        onClick={() => toggleFavorite(beat.id)}
                        className={cn(
                          "p-2 rounded-full border border-white/5",
                          isFavorite(beat.id) ? "text-[#9A3BDC] bg-[#9A3BDC]/10" : "text-white/40"
                        )}
                      >
                        <Heart size={18} fill={isFavorite(beat.id) ? "currentColor" : "none"} />
                      </button>
                      <button 
                        onClick={() => handleAddToCart(beat)}
                        className={cn(
                          "p-2 rounded-full border border-white/5",
                          isInCart(beat.id) ? "bg-white text-black" : "text-white/40"
                        )}
                      >
                        <ShoppingCart size={18} />
                      </button>
                   </div>
                   <Button size="sm" variant="ghost" className="text-xs text-white/40 h-8" onClick={() => handlePlayBeat(beat)}>
                     Preview
                   </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
