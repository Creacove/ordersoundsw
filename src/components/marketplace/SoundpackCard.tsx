import { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Package, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { formatCurrency } from "@/lib/utils";
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
  
  const handleAddToCart = () => {
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
    <Card className={`group overflow-hidden h-full transition-all duration-300 hover:shadow-xl hover:scale-[1.02] ${
      featured ? 'border-primary bg-primary/5' : ''
    }`}>
      <Link to={`/soundpack/${soundpack.id}`} className="block">
        <CardContent className="p-0 flex flex-col h-full">
          <div className="relative">
            <img
              src={soundpack.cover_art_url || "/placeholder.svg"}
              alt={soundpack.title}
              className="aspect-square w-full object-cover rounded-t-lg transition-transform duration-300 group-hover:scale-105"
            />
            
            {/* Soundpack Badge */}
            <Badge 
              className="absolute top-3 left-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white flex items-center gap-1.5 font-bold px-3 py-1.5 text-xs sm:text-sm shadow-lg"
            >
              <Package size={16} className="flex-shrink-0" />
              <span className="hidden sm:inline">SOUNDPACK</span>
              <span className="sm:hidden">PACK</span>
              <span className="opacity-75">•</span>
              <span>{soundpack.file_count}</span>
            </Badge>
            
            {/* Draft/Published Status Badge */}
            {soundpack.published === false && (
              <Badge className="absolute top-3 right-3 bg-orange-500 text-white font-bold animate-pulse shadow-lg">
                DRAFT
              </Badge>
            )}
            
            {featured && soundpack.published !== false && (
              <Badge className="absolute top-3 right-3 bg-primary text-white font-bold shadow-lg">
                Featured
              </Badge>
            )}
            
            {/* Stats Row - Only show if published */}
            {soundpack.published !== false && soundpack.purchase_count > 0 && (
              <div className="absolute bottom-3 left-3 flex items-center gap-2">
                <Badge 
                  variant="secondary" 
                  className="bg-black/60 backdrop-blur-sm text-white border-none flex items-center gap-1.5 px-2 py-1"
                >
                  <ShoppingBag size={12} />
                  <span className="text-xs font-medium">{soundpack.purchase_count}</span>
                </Badge>
              </div>
            )}
            
            <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 via-black/50 to-transparent p-3 sm:p-4 text-white">
              <h3 className="font-bold text-base sm:text-lg line-clamp-1">{soundpack.title}</h3>
              <p className="text-xs sm:text-sm opacity-90 line-clamp-1">
                by {soundpack.producer_name || 'Unknown Producer'}
              </p>
            </div>
          </div>
        </CardContent>
      </Link>
      
      <div className="p-3 sm:p-4 flex flex-col gap-3 sm:gap-4 bg-card">
        {showLicenseSelector && (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Select License</Label>
            <LicenseSelector onChange={setSelectedLicense} />
          </div>
        )}
        
        <CardFooter className="flex items-center justify-between p-0">
          <div>
            <Label className="text-xs text-muted-foreground">Price</Label>
            <p className="font-bold text-xl sm:text-2xl">
              {formatCurrency(price || 0, currency)}
            </p>
          </div>
          <Button 
            onClick={(e) => {
              e.preventDefault();
              handleAddToCart();
            }}
            size={itemInCart ? "default" : "lg"}
            className="transition-all duration-200"
          >
            {itemInCart ? (
              <>
                <ShoppingCart className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">In Cart</span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4 mr-2" />
                Add to Cart
              </>
            )}
          </Button>
        </CardFooter>
      </div>
    </Card>
  );
}
