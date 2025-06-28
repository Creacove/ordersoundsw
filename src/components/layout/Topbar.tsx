
import { useState, useEffect } from "react"; 
import { Link, useNavigate, useLocation } from "react-router-dom";
import { 
  Search, 
  Bell, 
  User,
  Menu,
  X,
  LogOut,
  Settings,
  Heart,
  Music2,
  MessageSquare,
  ChevronDown,
  Flame,
  Headphones,
  BookOpen,
  ShoppingCart,
  DollarSign,
  RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { useCartLightweight } from "@/hooks/useCartLightweight";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";

export function Topbar({ sidebarVisible = false }) {
  const { user, logout, currency, setCurrency } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { itemCount } = useCartLightweight();
  const isMobile = useIsMobile();
  
  const [isScrolled, setIsScrolled] = useState(false);
  
  const isAuthPage = location.pathname === "/login" || location.pathname === "/signup";
  
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  
  const handleSignOut = async () => {
    await logout();
    navigate("/login");
  };
  
  const getInitials = (name: string) => {
    if (!name) return "U";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase();
  };
  
  const toggleCurrency = (newCurrency: 'USD' | 'NGN') => {
    if (newCurrency === currency) return;
    
    setCurrency(newCurrency);
    localStorage.setItem('preferred_currency', newCurrency);
    toast.success(`Currency changed to ${newCurrency === 'USD' ? 'US Dollar' : 'Nigerian Naira'}`);
  };

  const showLogo = true;

  const getSettingsPath = () => {
    if (user?.role === "producer") {
      return "/producer/settings";
    }
    return "/settings";
  };

  const getProfilePath = () => {
    if (user?.role === "producer") {
      return `/producer/${user.id}`;
    }
    return `/buyer/${user.id}`;
  };

  // Get display name based on user role
  const getDisplayName = (user: any) => {
    if (user.role === 'producer') {
      return user.producer_name || user.stage_name || user.name;
    }
    return user.name;
  };

  return (
    <header 
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-200",
        isScrolled ? "bg-background/90 backdrop-blur-md border-b shadow-sm" : "bg-transparent"
      )}
    >
      <div className={cn(
        "flex items-center justify-between h-16 py-2",
        isMobile ? "container mx-auto px-2 xs:px-4 sm:px-6" : "pr-6 pl-2"
      )}>
        <div className="flex items-center gap-2">          
          <Link to="/" className="flex items-center gap-2 relative">
            {isMobile ? (
              <img 
                src="/lovable-uploads/86ceb56c-c6e8-400c-8c94-ec40647db5bc.png" 
                alt="OrderSOUNDS"
                className="h-8 w-auto"
              />
            ) : (
              <img 
                src="/lovable-uploads/a5b2cdfb-b365-4bf2-a812-07636101b39f.png" 
                alt="OrderSOUNDS"
                className="h-36 w-auto"
              />
            )}
            <div className="flex flex-col items-start">
              <Badge variant="outline" className="text-purple-600 border-purple-600 text-[10px] xs:text-xs font-medium">BETA</Badge>
            </div>
          </Link>
        </div>
        
        <div className="flex items-center gap-3">
          {(!isAuthPage || user) && (
            <>
            <div className="flex bg-muted/80 p-0.5 rounded-full shadow-sm">
            
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleCurrency("USD")}
                className={cn(
                  "h-7 md:h-8 px-2 rounded-full flex items-center gap-1 text-xs font-medium transition-all",
                  currency === "USD" 
                    ? "bg-primary text-primary-foreground" 
                    : "hover:bg-muted/90 text-muted-foreground"
                )}
              >
                <DollarSign size={isMobile ? 12 : 14} className="stroke-[2.5px]" />
                <span className={isMobile ? "sr-only" : "inline"}>USD</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleCurrency("NGN")}
                className={cn(
                  "h-7 md:h-8 px-2 rounded-full flex items-center gap-1 text-xs font-medium transition-all",
                  currency === "NGN" 
                    ? "bg-primary text-primary-foreground" 
                    : "hover:bg-muted/90 text-muted-foreground"
                )}
              >
                <span className={cn(
                  "text-sm font-semibold leading-none", 
                  isMobile ? "text-xs" : "text-sm"
                )}>₦</span>
                <span className={isMobile ? "sr-only" : "inline"}>NGN</span>
              </Button>
            </div>
            </>
          )}
          
          {user && user.role === 'buyer' && !isMobile && !isAuthPage && (
            <Button
              variant="ghost"
              size="icon"
              className="relative h-8 w-8"
              onClick={() => navigate("/cart")}
            >
              <ShoppingCart size={18} />
              {itemCount > 0 && (
                <Badge 
                  className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]" 
                  variant="destructive"
                >
                  {itemCount}
                </Badge>
              )}
              <span className="sr-only">Cart</span>
            </Button>
          )}
          
          {user && !isAuthPage && (
            <NotificationCenter />
          )}
          
          {(!isAuthPage || user) && (
            <Button
              variant="ghost"
              size="icon"
              className="relative h-8 w-8"
              onClick={() => navigate("/search")}
            >
              <Search size={18} />
              <span className="sr-only">Search</span>
            </Button>
          )}
          
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative h-8 w-8 rounded-full"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar_url} alt={getDisplayName(user)} />
                    <AvatarFallback>{getInitials(getDisplayName(user))}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center justify-start gap-2 p-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar_url} alt={getDisplayName(user)} />
                    <AvatarFallback>{getInitials(getDisplayName(user))}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{getDisplayName(user)}</span>
                    <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate(getProfilePath())}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/favorites")}>
                  <Heart className="mr-2 h-4 w-4" />
                  <span>Favorites</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/purchased")}>
                  <Music2 className="mr-2 h-4 w-4" />
                  <span>My Purchases</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate(getSettingsPath())}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            !isAuthPage && (
              <Button
                variant="default"
                size="sm"
                className="font-medium"
                onClick={() => navigate("/login")}
              >
                Sign In
              </Button>
            )
          )}
        </div>
      </div>
    </header>
  );
}

export default Topbar;
