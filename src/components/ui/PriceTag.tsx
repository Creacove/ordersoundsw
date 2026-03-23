
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

interface PriceTagProps {
  localPrice: number;
  diasporaPrice: number;
  size?: "sm" | "md" | "lg";
  className?: string;
  licenseType?: string;
  onClick?: (e: React.MouseEvent) => void;
}

export function PriceTag({ 
  localPrice, 
  diasporaPrice, 
  size = "md", 
  className,
  licenseType,
  onClick
}: PriceTagProps) {
  const { currency } = useAuth();
  
  const formatPrice = (price: number, currency: 'NGN' | 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: currency === 'USD' ? 2 : 0,
      maximumFractionDigits: currency === 'USD' ? 2 : 0,
    }).format(price);
  };

  const displayPrice = currency === 'NGN' 
    ? formatPrice(localPrice || 0, 'NGN')
    : formatPrice(diasporaPrice || 0, 'USD');

  const sizeClasses = {
    sm: "px-2.5 py-1 text-xs sm:text-sm font-semibold leading-normal",
    md: "px-3 py-1 text-sm sm:text-base font-semibold leading-normal",
    lg: "px-3.5 py-1.5 text-base sm:text-lg font-bold leading-normal"
  };

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <span 
      onClick={handleClick}
      className={cn(
        "inline-flex items-center justify-center rounded-full whitespace-nowrap border border-white/10 bg-white/[0.05] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]",
        sizeClasses[size],
        onClick && "cursor-pointer hover:bg-primary/20 transition-colors",
        className
      )}
    >
      {licenseType && <span className="mr-1 opacity-80 capitalize">{licenseType}:</span>}
      {displayPrice}
    </span>
  );
}
