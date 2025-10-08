import { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Package } from "lucide-react";
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
    <Card className={`group overflow-hidden h-full ${featured ? 'border-primary bg-primary/5' : ''}`}>
      <CardContent className="p-0 flex flex-col h-full">
        <div className="relative">
          <Link to={`/soundpack/${soundpack.id}`}>
            <img
              src={soundpack.cover_art_url || "/placeholder.svg"}
              alt={soundpack.title}
              className="aspect-square w-full object-cover rounded-none group-hover:scale-105 transition-transform duration-200"
            />
          </Link>
          
          {/* Soundpack Badge */}
          <Badge 
            className="absolute top-2 left-2 bg-primary/90 text-white flex items-center gap-1"
          >
            <Package size={12} />
            {soundpack.file_count} files
          </Badge>
          
          {featured && (
            <div className="absolute top-2 right-2 bg-primary text-white text-xs px-2 py-1 rounded-full">
              Featured
            </div>
          )}
          
          <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/70 to-transparent p-4 text-white">
            <div>
              <h3 className="font-semibold">{soundpack.title}</h3>
              <p className="text-sm opacity-70">by {soundpack.producer_name || 'Unknown Producer'}</p>
            </div>
          </div>
        </div>
        
        <div className="p-4 flex flex-col justify-between flex-1">
          {showLicenseSelector && (
            <LicenseSelector onChange={setSelectedLicense} />
          )}
          
          <CardFooter className="flex items-center justify-between p-0 mt-4">
            <div>
              <Label className="text-sm opacity-70">Price</Label>
              <p className="font-semibold text-lg">
                {formatCurrency(price || 0, currency)}
              </p>
            </div>
            <Button 
              onClick={handleAddToCart}
              disabled={false}
            >
              {itemInCart ? (
                <>
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  <span>In Cart</span>
                </>
              ) : (
                <>
                  Add to Cart
                </>
              )}
            </Button>
          </CardFooter>
        </div>
      </CardContent>
    </Card>
  );
}
