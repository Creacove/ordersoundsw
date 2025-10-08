import { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Package, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { formatCurrency, cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useCartLightweight } from "@/hooks/useCartLightweight";
import { LicenseSelector } from "@/components/marketplace/LicenseSelector";
import { Badge } from "@/components/ui/badge";

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
}

export function SoundpackCard({ 
  soundpack, 
  isInCart, 
  onAddToCart, 
  showLicenseSelector = true,
  featured = false
}: SoundpackCardProps) {
  const { currency } = useAuth();
  const { addToCart, removeFromCart, isInCart: checkIsInCart } = useCartLightweight();
  const [selectedLicense, setSelectedLicense] = useState<'basic' | 'premium' | 'exclusive' | 'custom'>('basic');
  
  const itemInCart = isInCart || checkIsInCart(soundpack.id);
  
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (onAddToCart) {
      onAddToCart();
    } else if (itemInCart) {
      removeFromCart(soundpack.id);
    } else {
      addToCart(soundpack.id, selectedLicense);
    }
  };

  const getPriceForLicense = () => {
    if (currency === 'NGN') {
      switch (selectedLicense) {
        case 'basic':
          return soundpack.basic_license_price_local;
        case 'premium':
          return soundpack.premium_license_price_local;
        case 'exclusive':
          return soundpack.exclusive_license_price_local;
        case 'custom':
          return soundpack.custom_license_price_local;
        default:
          return soundpack.basic_license_price_local;
      }
    } else {
      switch (selectedLicense) {
        case 'basic':
          return soundpack.basic_license_price_diaspora;
        case 'premium':
          return soundpack.premium_license_price_diaspora;
        case 'exclusive':
          return soundpack.exclusive_license_price_diaspora;
        case 'custom':
          return soundpack.custom_license_price_diaspora;
        default:
          return soundpack.basic_license_price_diaspora;
      }
    }
  };
  
  const price = getPriceForLicense();

  return (
    <Link to={`/soundpack/${soundpack.id}`} className="block h-full">
      <Card className={cn(
        "group overflow-hidden h-full flex flex-col",
        "transition-all duration-200",
        "hover:shadow-lg hover:border-primary/50",
        featured && "border-primary/50 bg-primary/5"
      )}>
        {/* Cover Image - Compact aspect ratio */}
        <div className="relative overflow-hidden bg-muted">
          <div className="aspect-video relative">
            <img
              src={soundpack.cover_art_url || "/placeholder.svg"}
              alt={soundpack.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
            
            {/* Top Badges - Minimal */}
            <div className="absolute top-2 left-2 right-2 flex items-start justify-between gap-2">
              <Badge className="bg-primary text-primary-foreground shadow-md flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold">
                <Package size={10} />
                SOUNDPACK
              </Badge>
              
              {soundpack.published === false && (
                <Badge variant="outline" className="bg-muted/90 backdrop-blur-sm px-2 py-0.5 text-[10px]">
                  DRAFT
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        {/* Content - Compact spacing */}
        <CardContent className="flex-1 flex flex-col p-3 gap-2.5">
          {/* Title & Producer */}
          <div>
            <h3 className="font-semibold text-sm line-clamp-1 mb-0.5 group-hover:text-primary transition-colors">
              {soundpack.title}
            </h3>
            <p className="text-xs text-muted-foreground line-clamp-1">
              by {soundpack.producer_name || 'Unknown Producer'}
            </p>
          </div>
          
          {/* Stats - Inline */}
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-1">
              <Package size={11} />
              <span>{soundpack.file_count || 0} files</span>
            </div>
            {soundpack.purchase_count && soundpack.purchase_count > 0 && (
              <div className="flex items-center gap-1">
                <ShoppingBag size={11} />
                <span>{soundpack.purchase_count}</span>
              </div>
            )}
          </div>
          
          {/* License Selector - Compact */}
          {showLicenseSelector && (
            <div className="space-y-1.5">
              <LicenseSelector onChange={setSelectedLicense} />
            </div>
          )}
          
          {/* Price & Action - Compact footer */}
          <div className="flex items-center justify-between gap-2 mt-auto pt-1">
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Price</p>
              <p className="font-bold text-base truncate">
                {formatCurrency(price || 0, currency)}
              </p>
            </div>
            <Button 
              onClick={handleAddToCart}
              size="sm"
              variant={itemInCart ? "secondary" : "default"}
              className="flex-shrink-0 h-8 px-3 text-xs"
            >
              <ShoppingCart className="w-3 h-3 mr-1" />
              {itemInCart ? "In Cart" : "Add"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
