import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Package, Trash2, ArrowUpRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useCartLightweight } from "@/hooks/useCartLightweight";
import { Badge } from "@/components/ui/badge";
import { PriceTag } from "@/components/ui/PriceTag";
import { toast } from "sonner";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface Soundpack {
  id: string;
  title: string;
  description?: string;
  producer_id: string;
  producer_name?: string;
  cover_art_url?: string;
  file_count: number;
  published?: boolean;
  purchase_count?: number;
  basic_license_price_local: number;
  basic_license_price_diaspora: number;
  premium_license_price_local: number;
  premium_license_price_diaspora: number;
  exclusive_license_price_local: number;
  exclusive_license_price_diaspora: number;
  custom_license_price_local?: number;
  custom_license_price_diaspora?: number;
}

interface SoundpackCardProps {
  soundpack: Soundpack;
  isInCart?: boolean;
  onAddToCart?: () => void;
  showLicenseSelector?: boolean;
  featured?: boolean;
  isProducerOwned?: boolean;
  onDelete?: () => void;
}

export function SoundpackCard({ 
  soundpack, 
  isInCart: initialIsInCart, 
  onAddToCart, 
  showLicenseSelector = true,
  featured = false,
  isProducerOwned = false,
  onDelete
}: SoundpackCardProps) {
  const { currency } = useAuth();
  const { addToCart, removeFromCart, isInCart: checkIsInCart } = useCartLightweight();
  const navigate = useNavigate();
  const [addToCartNotified, setAddToCartNotified] = useState(false);
  
  const itemInCart = initialIsInCart || checkIsInCart(soundpack.id, 'soundpack');
  
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (onAddToCart) {
      onAddToCart();
    } else if (itemInCart) {
      removeFromCart(soundpack.id, 'soundpack');
      toast.info(`Removed ${soundpack.title} from cart`);
    } else if (!addToCartNotified) {
      addToCart(soundpack.id, 'basic', 'soundpack');
      toast.success(`Added ${soundpack.title} to cart`);
      setAddToCartNotified(true);
      setTimeout(() => setAddToCartNotified(false), 2000);
    }
  };

  const prices = {
    local: soundpack.basic_license_price_local,
    diaspora: soundpack.basic_license_price_diaspora
  };

  return (
    <Link 
      to={`/soundpack/${soundpack.id}`} 
      className={cn(
        "group relative block h-full overflow-hidden rounded-[1.6rem] border bg-[#0d101b]/76 p-2 transition-all duration-300 hover:-translate-y-1 hover:bg-[#111425]",
        featured
          ? "border-[#9A3BDC] shadow-[0_0_25px_rgba(154,59,220,0.25)] ring-1 ring-[#9A3BDC]/50"
          : "border-white/10 hover:border-white/18 shadow-[0_24px_70px_rgba(4,6,20,0.22)]"
      )}
    >
      <div className="relative overflow-hidden rounded-[1.25rem]">
        <AspectRatio ratio={1}>
          <div className="relative w-full h-full p-2">
            {/* Stacked layers effect - Signifies a collection */}
            <div className="absolute inset-x-4 top-0 h-[92%] bg-white/5 rounded-[1.25rem] border border-white/5 transform -translate-y-1 scale-[0.96] origin-bottom transition-transform duration-500 group-hover:-translate-y-2" />
            <div className="absolute inset-x-3 top-1 h-[94%] bg-white/10 rounded-[1.25rem] border border-white/10 transform -translate-y-0.5 scale-[0.98] origin-bottom transition-transform duration-500 group-hover:-translate-y-1" />
            
            <div className="relative h-full w-full overflow-hidden rounded-[1.1rem] border border-white/10 shadow-2xl">
              <img
                src={soundpack.cover_art_url || "/placeholder.svg"}
                alt={soundpack.title}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
          </div>
        </AspectRatio>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#090b16]/90 via-[#090b16]/20 to-transparent" />

        {/* Top badges - Refined */}
        <div className="absolute left-3 top-3 flex items-center gap-2 z-10">
          <Badge variant="outline" className="bg-black/30 text-white backdrop-blur-sm border-white/20 text-[10px] font-bold tracking-wider uppercase">
            <Package size={10} className="mr-1 mt-[-1px]" />
            SOUNDPACK
          </Badge>
          {soundpack.published === false && (
            <Badge variant="outline" className="bg-amber-500/20 text-amber-500 border-amber-500/20 text-[10px] font-bold">
              DRAFT
            </Badge>
          )}
        </div>

        {/* Delete button for producers */}
        {isProducerOwned && onDelete && (
          <div className="absolute right-3 top-3 z-20">
            <Button
              size="icon"
              variant="destructive"
              className="h-8 w-8 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash2 size={14} />
            </Button>
          </div>
        )}

        {/* File count indicator */}
        <div className="absolute bottom-3 left-3 z-10 px-2 py-1 rounded-lg bg-black/40 backdrop-blur-md border border-white/10 flex items-center gap-1.5">
          <Package size={10} className="text-[#9A3BDC]" />
          <span className="text-[10px] font-black text-white/90">{soundpack.file_count || 0} Assets</span>
        </div>

        {/* Bottom action area */}
        <div
          className="absolute inset-x-0 bottom-0 p-3 flex items-end justify-end gap-3 transition-all duration-300 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0"
        >
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="secondary"
              rounded="full"
              className="h-11 w-11 border-white/10 bg-white/10 text-white hover:bg-white/16"
              onClick={handleAddToCart}
            >
              <ShoppingCart className={cn("h-4 w-4", itemInCart && "text-[#9A3BDC] fill-[#9A3BDC]")} />
            </Button>
          </div>
        </div>
      </div>

      <div className="px-1 pb-1 pt-3 sm:pt-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1.5 sm:gap-3">
          <div className="min-w-0 w-full text-left">
            <h3 className="truncate text-sm sm:text-base font-semibold tracking-[-0.03em] text-white">
              {soundpack.title}
            </h3>
            <p className="truncate text-xs sm:text-sm text-muted-foreground italic">
              by {soundpack.producer_name || 'Unknown Producer'}
            </p>
          </div>
          <PriceTag
            localPrice={prices.local}
            diasporaPrice={prices.diaspora || prices.local}
            size="sm"
            className="shrink-0 self-start sm:self-auto bg-white/[0.08] text-white"
          />
        </div>
      </div>
    </Link>
  );
}
