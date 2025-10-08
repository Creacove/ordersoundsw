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
        "transition-all duration-300 ease-out",
        "hover:shadow-2xl hover:-translate-y-1",
        "border-border/50 hover:border-primary/50",
        featured && "border-primary/70 bg-gradient-to-br from-primary/5 to-transparent"
      )}>
        {/* Cover Image Section */}
        <div className="relative overflow-hidden bg-muted">
          <div className="aspect-square relative">
            <img
              src={soundpack.cover_art_url || "/placeholder.svg"}
              alt={soundpack.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />
            
            {/* Top Badges */}
            <div className="absolute top-2 left-2 right-2 flex items-start justify-between gap-2">
              {/* Soundpack Badge */}
              <Badge className="bg-gradient-to-r from-purple-600 via-purple-500 to-purple-600 text-white border-none shadow-lg backdrop-blur-sm flex items-center gap-1 px-2 py-1 text-[10px] sm:text-xs font-bold">
                <Package size={12} className="flex-shrink-0" />
                <span>{soundpack.file_count} files</span>
              </Badge>
              
              {/* Status Badge */}
              {soundpack.published === false ? (
                <Badge className="bg-orange-500/90 text-white border-none shadow-lg backdrop-blur-sm px-2 py-1 text-[10px] sm:text-xs font-bold animate-pulse">
                  DRAFT
                </Badge>
              ) : featured && (
                <Badge className="bg-primary/90 text-white border-none shadow-lg backdrop-blur-sm px-2 py-1 text-[10px] sm:text-xs font-bold">
                  FEATURED
                </Badge>
              )}
            </div>
            
            {/* Purchase Count Badge - Bottom Left */}
            {soundpack.published !== false && soundpack.purchase_count && soundpack.purchase_count > 0 && (
              <div className="absolute bottom-2 left-2">
                <Badge className="bg-black/70 text-white border-none backdrop-blur-md flex items-center gap-1 px-2 py-1 text-[10px] shadow-lg">
                  <ShoppingBag size={10} />
                  <span className="font-medium">{soundpack.purchase_count}</span>
                </Badge>
              </div>
            )}
          </div>
        </div>
        
        {/* Content Section */}
        <CardContent className="flex-1 flex flex-col p-3 sm:p-4 gap-3">
          {/* Title & Producer */}
          <div className="flex-1 min-h-0">
            <h3 className="font-bold text-sm sm:text-base line-clamp-2 mb-1 group-hover:text-primary transition-colors">
              {soundpack.title}
            </h3>
            <p className="text-xs text-muted-foreground line-clamp-1">
              {soundpack.producer_name || 'Unknown Producer'}
            </p>
          </div>
          
          {/* License Selector */}
          {showLicenseSelector && (
            <div className="space-y-1.5">
              <Label className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide">License</Label>
              <LicenseSelector onChange={setSelectedLicense} />
            </div>
          )}
          
          {/* Price & Action */}
          <div className="flex items-end justify-between gap-3 pt-1">
            <div>
              <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">Price</Label>
              <p className="font-bold text-lg sm:text-xl tracking-tight">
                {formatCurrency(price || 0, currency)}
              </p>
            </div>
            <Button 
              onClick={handleAddToCart}
              size="sm"
              variant={itemInCart ? "secondary" : "default"}
              className={cn(
                "flex-shrink-0 transition-all duration-200",
                itemInCart && "bg-primary/10 text-primary hover:bg-primary/20"
              )}
            >
              <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1.5" />
              <span className="hidden sm:inline text-xs">
                {itemInCart ? "In Cart" : "Add"}
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
