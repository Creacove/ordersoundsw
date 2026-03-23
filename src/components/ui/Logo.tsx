import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface LogoProps {
  className?: string;
  size?: "mobile" | "desktop";
  showText?: boolean;
}

export function Logo({ className, size, showText }: LogoProps) {
  const isMobileHook = useIsMobile();
  // Prefer explicit size prop, fallback to hook
  const isMobile = size === "mobile" || (size === undefined && isMobileHook);
  
  return (
    <Link
      to="/"
      className={cn(
        "flex items-center relative transition-all hover:opacity-80 outline-none",
        className
      )}
    >
      {isMobile ? (
        <img
          src="/lovable-uploads/86ceb56c-c6e8-400c-8c94-ec40647db5bc.png"
          alt="OrderSOUNDS Icon"
          className="h-6 w-auto object-contain"
        />
      ) : (
        <img
          src="/lovable-uploads/eb4345ae-2714-491f-822d-46a5ea0844af.png"
          alt="OrderSOUNDS Wordmark"
          className="h-5 w-auto object-contain mt-1"
        />
      )}
    </Link>
  );
}
