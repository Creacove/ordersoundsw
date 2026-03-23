import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  Users,
  ShoppingCart,
  MoreHorizontal,
  Music,
  LayoutDashboard,
  DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { User } from "@/types";

interface MobileBottomNavProps {
  activeBottomTab: string;
  user: User | null;
  itemCount: number;
  setIsOpen: (isOpen: boolean) => void;
  setActiveBottomTab: (tab: string) => void;
}

export function MobileBottomNav({
  activeBottomTab,
  user,
  itemCount,
  setIsOpen,
  setActiveBottomTab,
}: MobileBottomNavProps) {
  const location = useLocation();
  let mobileMenuItems = [];

  if (user?.role === "producer") {
    mobileMenuItems = [
      { icon: <LayoutDashboard size={18} />, label: "Dashboard", to: "/producer/dashboard", id: "producer" },
      { icon: <Home size={18} />, label: "Explore", to: "/", id: "explore" },
      { icon: <Music size={18} />, label: "Beats", to: "/producer/beats", id: "beats" },
      { icon: <DollarSign size={18} />, label: "Earnings", to: "/producer/earnings", id: "earnings" },
      { icon: <MoreHorizontal size={18} />, label: "More", to: "#", id: "more", action: () => setIsOpen(true) },
    ];
  } else {
    mobileMenuItems = [
      { icon: <Home size={18} />, label: "Home", to: "/", id: "home" },
      { icon: <Users size={18} />, label: "Producers", to: "/producers", id: "producers" },
      { icon: <Music size={18} />, label: "Library", to: "/library", id: "library" },
      { icon: <ShoppingCart size={18} />, label: "Cart", to: "/cart", id: "cart", badge: itemCount > 0 ? itemCount : null },
      { icon: <MoreHorizontal size={18} />, label: "More", to: "#", id: "more", action: () => setIsOpen(true) },
    ];
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 px-3 pb-[calc(env(safe-area-inset-bottom,0px)+0.85rem)] pt-2">
      <div className="mx-auto max-w-md rounded-[1.75rem] border border-white/12 bg-[#0a0d18]/88 px-2 py-2 shadow-[0_30px_90px_rgba(4,6,20,0.45)] backdrop-blur-2xl">
        <div className="grid grid-cols-5 gap-1">
          {mobileMenuItems.map((item, idx) => {
            const isActive =
              activeBottomTab === item.id ||
              (item.to === "/" && location.pathname === "/") ||
              (item.id === "producers" && location.pathname === "/producers") ||
              (item.id === "library" &&
                (location.pathname === "/library" ||
                  location.pathname === "/purchased" ||
                  location.pathname === "/my-playlists"));

            if (item.action) {
              return (
                <button
                  key={idx}
                  onClick={item.action}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 rounded-[1.2rem] px-2 py-2.5 text-[11px] font-medium transition-all",
                    isActive ? "text-white" : "text-muted-foreground"
                  )}
                >
                  <div
                    className={cn(
                      "relative flex h-10 w-10 items-center justify-center rounded-2xl transition-all",
                      isActive
                        ? "bg-[#9A3BDC] text-white shadow-[0_10px_20px_rgba(154,59,220,0.3)]"
                        : "bg-white/[0.04] text-white/50"
                    )}
                  >
                    {item.icon}
                  </div>
                  <span>{item.label}</span>
                </button>
              );
            }

            return (
              <Link
                key={idx}
                to={item.to}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 rounded-[1.2rem] px-2 py-2.5 text-[11px] font-medium transition-all",
                  isActive ? "text-white" : "text-muted-foreground"
                )}
                onClick={() => setActiveBottomTab(item.id)}
              >
                <div
                  className={cn(
                    "relative flex h-10 w-10 items-center justify-center rounded-2xl transition-all",
                    isActive
                      ? "bg-[#9A3BDC] text-white shadow-[0_10px_20px_rgba(154,59,220,0.3)]"
                      : "bg-white/[0.04] text-white/50"
                  )}
                >
                  {item.icon}
                  {item.badge && (
                    <Badge
                      variant="destructive"
                      className="absolute -right-1 -top-1 h-5 min-w-5 justify-center p-0"
                    >
                      {item.badge > 9 ? "9+" : item.badge}
                    </Badge>
                  )}
                </div>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
