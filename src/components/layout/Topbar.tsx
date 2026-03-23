import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Search,
  LogOut,
  Settings,
  Heart,
  Music2,
  User,
  ShoppingCart,
  DollarSign,
  Wallet,
  Sparkles,
} from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { useCartLightweight } from "@/hooks/useCartLightweight";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { useAnnouncementVisible } from "@/hooks/useAnnouncement";
import { Logo } from "@/components/ui/Logo";
import type { User as AppUser } from "@/types";

interface TopbarProps {
  sidebarVisible?: boolean;
}

const routeCopy: Array<{ match: RegExp; title: string; subtitle: string }> = [
  { match: /^\/$/, title: "Discover what moves next", subtitle: "Curated beats, soundpacks, and producers with stronger purchase confidence." },
  { match: /^\/producers/, title: "Producers", subtitle: "Connect with the minds behind the most impactful sound waves on the platform." },
  { match: /^\/cart/, title: "Checkout with confidence", subtitle: "Clean totals, clear payment states, and the fastest path to ownership." },
  { match: /^\/library|^\/purchased|^\/favorites|^\/my-playlists/, title: "Your sound vault", subtitle: "Everything you own, love, and return to lives here." },
  { match: /^\/producer/, title: "Producer operations", subtitle: "Publishing, earnings, and catalog management in one calm surface." },
  { match: /^\/admin/, title: "Platform control", subtitle: "Moderation, payment operations, and system oversight." },
  { match: /^\/beat\//, title: "Review before you buy", subtitle: "Audio-first detail, license clarity, and fast purchase action." },
];

export function Topbar({ sidebarVisible = false }: TopbarProps) {
  const { user, logout, currency, setCurrency } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { itemCount } = useCartLightweight();
  const isMobile = useIsMobile();
  const isAnnouncementVisible = useAnnouncementVisible();
  const { connected, publicKey, connecting } = useWallet();
  const { setVisible: setWalletModalVisible } = useWalletModal();
  const [isScrolled, setIsScrolled] = useState(false);

  const isAuthPage = location.pathname === "/login" || location.pathname === "/signup";

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const routeMeta = useMemo(() => {
    return routeCopy.find((entry) => entry.match.test(location.pathname)) ?? routeCopy[0];
  }, [location.pathname]);

  const handleSignOut = async () => {
    await logout();
    navigate("/login");
  };

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const toggleCurrency = (newCurrency: "USD" | "NGN") => {
    if (newCurrency === currency) return;

    setCurrency(newCurrency);
    localStorage.setItem("preferred_currency", newCurrency);
    toast.success(`Currency changed to ${newCurrency === "USD" ? "US Dollar" : "Nigerian Naira"}`);
  };

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

  const getDisplayName = (currentUser: AppUser) => {
    if (currentUser.role === "producer") {
      return currentUser.producer_name || currentUser.stage_name || currentUser.name;
    }
    return currentUser.name;
  };

  return (
    <header
      className={cn(
        "sticky z-40 w-full transition-all duration-300",
        isAnnouncementVisible ? "top-10" : "top-0",
        isScrolled ? "py-3" : "py-4"
      )}
    >
      <div className="page-shell">
        <div
          className={cn(
            "flex items-center justify-between gap-3 rounded-[1.75rem] border border-white/10 bg-[#0b0d18]/78 px-3 py-3 shadow-[0_20px_70px_rgba(4,6,20,0.3)] backdrop-blur-2xl sm:px-4",
            sidebarVisible && !isMobile && "border-white/12"
          )}
        >
          <div className="flex min-w-0 items-center gap-3 md:gap-4">
            <div className="md:hidden">
              <Logo size="mobile" showText={false} />
            </div>

            {!isMobile && !isAuthPage && (
              <Button
                variant="outline"
                rounded="full"
                className="hidden xl:inline-flex xl:min-w-[260px] xl:justify-start xl:text-muted-foreground"
                onClick={() => navigate("/search")}
              >
                <Search className="h-4 w-4" />
                Search beats, moods, producers
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {(!isAuthPage || user) && (
              <div className="flex rounded-full border border-white/10 bg-white/[0.04] p-0.5 md:p-1 md:mr-2">
                <Button
                  variant={currency === "USD" ? "default" : "ghost"}
                  size="sm"
                  rounded="full"
                  onClick={() => toggleCurrency("USD")}
                  className={cn("h-7 px-2 text-[10px] md:h-8 md:px-3 md:text-xs", currency !== "USD" && "text-muted-foreground")}
                >
                  <DollarSign className="h-3 w-3 md:h-3.5 md:w-3.5 md:mr-1" />
                  USD
                </Button>
                <Button
                  variant={currency === "NGN" ? "default" : "ghost"}
                  size="sm"
                  rounded="full"
                  onClick={() => toggleCurrency("NGN")}
                  className={cn("h-7 px-2 text-[10px] md:h-8 md:px-3 md:text-xs", currency !== "NGN" && "text-muted-foreground")}
                >
                  <span className="text-[10px] font-bold md:text-sm md:font-semibold md:mr-1">₦</span>
                  NGN
                </Button>
              </div>
            )}

            {user && user.role === "buyer" && !isAuthPage && (
              <Button
                variant="secondary"
                size="icon-sm"
                rounded="full"
                className="relative"
                onClick={() => navigate("/cart")}
              >
                <ShoppingCart className="h-4 w-4" />
                {itemCount > 0 && (
                  <Badge className="absolute -right-1 -top-1 h-5 min-w-5 justify-center p-0" variant="destructive">
                    {itemCount > 9 ? "9+" : itemCount}
                  </Badge>
                )}
                <span className="sr-only">Cart</span>
              </Button>
            )}

            {user && !isAuthPage && <NotificationCenter />}

            {(!isAuthPage || user) && (
              <Button variant="ghost" size="icon-sm" rounded="full" className="xl:hidden" onClick={() => navigate("/search")}>
                <Search className="h-4 w-4 md:h-5 md:w-5" />
                <span className="sr-only">Search</span>
              </Button>
            )}

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" rounded="full" className="relative h-10 w-10">
                    <Avatar className="h-10 w-10 border border-white/12">
                      <AvatarImage src={user.avatar_url} alt={getDisplayName(user)} />
                      <AvatarFallback>{getInitials(getDisplayName(user))}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-72 rounded-[1.4rem] border border-white/10 bg-[#0d101b]/95 p-2 text-foreground backdrop-blur-2xl"
                >
                  <div className="flex items-center gap-3 rounded-[1.15rem] border border-white/8 bg-white/[0.03] p-3">
                    <Avatar className="h-10 w-10 border border-white/10">
                      <AvatarImage src={user.avatar_url} alt={getDisplayName(user)} />
                      <AvatarFallback>{getInitials(getDisplayName(user))}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <span className="block truncate text-sm font-semibold">{getDisplayName(user)}</span>
                      <span className="block truncate text-xs text-muted-foreground">{user.email}</span>
                    </div>
                  </div>

                  <button
                    className="mt-2 flex w-full items-center gap-3 rounded-[1rem] px-3 py-2.5 text-left text-sm transition-colors hover:bg-white/[0.05]"
                    onClick={() => {
                      if (!connected) {
                        setWalletModalVisible(true);
                      } else {
                        navigate(getSettingsPath());
                      }
                    }}
                  >
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
                      <Wallet className="h-4 w-4 text-muted-foreground" />
                    </span>
                    <div className="min-w-0 flex-1">
                      {connecting ? (
                        <span className="text-xs text-muted-foreground">Connecting...</span>
                      ) : connected && publicKey ? (
                        <>
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-emerald-400" />
                            <span className="text-sm font-medium">Wallet connected</span>
                          </div>
                          <span className="block truncate font-mono text-[11px] text-muted-foreground">
                            {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}
                          </span>
                        </>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-muted-foreground/50" />
                          <span className="text-sm text-muted-foreground">Connect wallet</span>
                        </div>
                      )}
                    </div>
                  </button>

                  <DropdownMenuSeparator className="my-2 bg-white/10" />
                  <DropdownMenuItem className="rounded-xl px-3 py-2.5 focus:bg-white/[0.06]" onClick={() => navigate(getProfilePath())}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="rounded-xl px-3 py-2.5 focus:bg-white/[0.06]" onClick={() => navigate("/favorites")}>
                    <Heart className="mr-2 h-4 w-4" />
                    <span>Favorites</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="rounded-xl px-3 py-2.5 focus:bg-white/[0.06]" onClick={() => navigate("/purchased")}>
                    <Music2 className="mr-2 h-4 w-4" />
                    <span>My purchases</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="rounded-xl px-3 py-2.5 focus:bg-white/[0.06]" onClick={() => navigate(getSettingsPath())}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="my-2 bg-white/10" />
                  <DropdownMenuItem className="rounded-xl px-3 py-2.5 focus:bg-white/[0.06]" onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              !isAuthPage && (
                <Button variant="default" size="sm" rounded="full" className="px-5" onClick={() => navigate("/login")}>
                  Sign In
                </Button>
              )
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Topbar;
