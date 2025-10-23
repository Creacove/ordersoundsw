import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "mobile" | "desktop";
  showText?: boolean;
}

export function Logo({ className, size = "mobile", showText = false }: LogoProps) {
  const logoSizes = {
    mobile: "h-8 w-auto",
    desktop: "h-36 w-auto"
  };

  return (
    <Link
      to="/"
      className={cn(
        "flex items-center gap-2 relative transition-all hover:opacity-80",
        className
      )}
    >
      <img
        src="/lovable-uploads/86ceb56c-c6e8-400c-8c94-ec40647db5bc.png"
        alt="OrderSOUNDS"
        className={logoSizes[size]}
      />
      {showText && (
        <span className="text-xl font-bold tracking-tight text-white">
          OrderSounds
        </span>
      )}
    </Link>
  );
}
