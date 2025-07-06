
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  Home, 
  Users, 
  ShoppingCart, 
  MoreHorizontal,
  Music,
  LayoutDashboard,
  DollarSign
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
  setActiveBottomTab 
}: MobileBottomNavProps) {
  const location = useLocation();
  let mobileMenuItems = [];

  if (user?.role === "producer") {
    mobileMenuItems = [
      { icon: <LayoutDashboard size={20} />, label: "Dashboard", to: "/producer/dashboard", id: "producer" },
      { icon: <Music size={20} />, label: "My Beats", to: "/producer/beats", id: "beats" },
      { icon: <DollarSign size={20} />, label: "Royalties", to: "/producer/royalties", id: "royalties" },
      { icon: <MoreHorizontal size={20} />, label: "More", to: "#", id: "more", action: () => setIsOpen(true) },
    ];
  } else {
    mobileMenuItems = [
      { icon: <Home size={20} />, label: "Home", to: "/", id: "home" },
      { icon: <Users size={20} />, label: "Producers", to: "/producers", id: "producers" },
      { icon: <Music size={20} />, label: "Library", to: "/library", id: "library" },
      { icon: <ShoppingCart size={20} />, label: "Cart", to: "/cart", id: "cart", badge: itemCount > 0 ? itemCount : null },
      { icon: <MoreHorizontal size={20} />, label: "More", to: "#", id: "more", action: () => setIsOpen(true) },
    ];
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0e0e0e] border-t border-[#272727] py-1 safe-area-bottom">
      <div className="flex justify-around">
        {mobileMenuItems.map((item, idx) => {
          const isActive = activeBottomTab === item.id || 
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
                  "flex flex-col items-center justify-center py-1 px-2 relative",
                  isActive ? "text-purple-500" : "text-gray-400"
                )}
              >
                <div
                  className={cn(
                    "relative p-1.5 rounded-full transition-colors",
                    isActive ? "bg-purple-500/20" : ""
                  )}
                >
                  {item.icon}
                </div>
                <span
                  className={cn(
                    "text-xs mt-0.5",
                    isActive ? "text-purple-500 font-medium" : ""
                  )}
                >
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <Link
              key={idx}
              to={item.to}
              className={cn(
                "flex flex-col items-center justify-center py-1 px-2 relative",
                isActive ? "text-purple-500" : "text-gray-400"
              )}
              onClick={() => setActiveBottomTab(item.id)}
            >
              <div
                className={cn(
                  "relative p-1.5 rounded-full transition-colors",
                  isActive ? "bg-purple-500/20" : ""
                )}
              >
                {item.icon}
                {item.badge && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-[10px]"
                  >
                    {item.badge > 9 ? "9+" : item.badge}
                  </Badge>
                )}
              </div>
              <span
                className={cn(
                  "text-xs mt-0.5",
                  isActive ? "text-purple-500 font-medium" : ""
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
