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
  
  const itemInCart = isInCart || checkIsInCart(soundpack.id, 'soundpack');
  
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (onAddToCart) {
      onAddToCart();
    } else if (itemInCart) {
      removeFromCart(soundpack.id, 'soundpack');
    } else {
      addToCart(soundpack.id, selectedLicense, 'soundpack');
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
        {/* Cover Image - Stacked Design */}
        <div className="relative overflow-visible bg-transparent pt-3 px-3">
          {/* Stacked layers effect - 3 layers behind main image */}
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            {/* Layer 3 - Bottom */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg transform -rotate-3 translate-y-2 translate-x-1 shadow-sm" />
            
            {/* Layer 2 - Middle */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-primary/15 rounded-lg transform -rotate-1.5 translate-y-1 translate-x-0.5 shadow-md" />
            
            {/* Layer 1 - Top visible layer behind main */}
            <div className="absolute inset-0 bg-muted/50 rounded-lg transform rotate-0.5 shadow-lg" />
            
            {/* Main Image - Front */}
            <div className="absolute inset-0 rounded-lg overflow-hidden shadow-xl border-2 border-background transform transition-transform duration-300 group-hover:scale-[1.02] group-hover:-translate-y-1">
              <img
                src={soundpack.cover_art_url || "/placeholder.svg"}
                alt={soundpack.title}
                className="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
              />
              
              {/* Overlay gradient for better badge visibility */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent" />
              
              {/* Top Badges - Minimal */}
              <div className="absolute top-2 left-2 right-2 flex items-start justify-between gap-2 z-10">
                <Badge className="bg-primary text-primary-foreground shadow-lg flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold backdrop-blur-sm border border-primary-foreground/20">
                  <Package size={10} />
                  SOUNDPACK
                </Badge>
                
                {soundpack.published === false && (
                  <Badge variant="outline" className="bg-background/90 backdrop-blur-sm px-2 py-0.5 text-[10px] shadow-lg">
                    DRAFT
                  </Badge>
                )}
              </div>
              
              {/* File count indicator at bottom of image */}
              <div className="absolute bottom-2 right-2 z-10">
                <div className="bg-background/80 backdrop-blur-md rounded-full px-2 py-1 shadow-lg border border-border/50 flex items-center gap-1">
                  <Package size={10} className="text-primary" />
                  <span className="text-[10px] font-semibold">{soundpack.file_count || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Content - Ultra Compact */}
        <CardContent className="flex-1 flex flex-col p-3 pt-2 gap-2">
          {/* Title & Producer */}
          <div>
            <h3 className="font-semibold text-sm line-clamp-1 mb-0.5 group-hover:text-primary transition-colors">
              {soundpack.title}
            </h3>
            <p className="text-xs text-muted-foreground line-clamp-1">
              by {soundpack.producer_name || 'Unknown Producer'}
            </p>
          </div>
          
          {/* License Selector - Compact */}
          {showLicenseSelector && (
            <div>
              <LicenseSelector onChange={setSelectedLicense} />
            </div>
          )}
          
          {/* Price & Action - Clean layout */}
          <div className="flex items-center justify-between gap-2 mt-auto">
            <p className="font-bold text-lg truncate">
              {formatCurrency(price || 0, currency)}
            </p>
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
