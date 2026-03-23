import type { LucideIcon } from "lucide-react";
import { NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { User } from "@/types";
import { useProducers } from "@/hooks/useProducers";
import { useState } from "react";
import { useAnnouncementVisible } from "@/hooks/useAnnouncement";
import { Logo } from "@/components/ui/Logo";

interface UnifiedSidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  user: User | null;
  handleSignOut: () => void;
  getSidebarContent: () => Array<{
    title: string;
    items: Array<{
      icon: LucideIcon;
      title: string;
      href: string;
      onClick?: () => void;
    }>;
  }>;
  isCollapsed: boolean;
  toggleCollapsed: () => void;
  isMobile: boolean;
  itemCount?: number;
}

export function UnifiedSidebar({
  isOpen,
  setIsOpen,
  user,
  getSidebarContent,
  isCollapsed,
  toggleCollapsed,
  isMobile,
  itemCount = 0,
}: UnifiedSidebarProps) {
  const { prefetchProducers } = useProducers();
  const [prefetchedSections, setPrefetchedSections] = useState<Set<string>>(new Set());
  const isAnnouncementVisible = useAnnouncementVisible();

  const handleMenuHover = (title: string) => {
    const sectionKey = title.toLowerCase();

    if (!prefetchedSections.has(sectionKey)) {
      if (sectionKey === "producers") {
        prefetchProducers();
        setPrefetchedSections((prev) => new Set([...prev, sectionKey]));
      }
    }
  };

  return (
    <>
      {isMobile && isOpen && <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" onClick={() => setIsOpen(false)} />}

      <aside
        className={cn(
          "fixed left-0 bottom-0 z-40 flex flex-col transition-all duration-300 ease-in-out",
          "border-r border-white/5 bg-[#030407]/95 text-white/80 shadow-[0_30px_120px_rgba(0,0,0,0.8)] backdrop-blur-2xl",
          isMobile ? (isOpen ? "translate-x-0" : "-translate-x-full") : "translate-x-0",
          isCollapsed ? "w-[88px]" : "w-[260px]",
          isMobile ? "top-16 shadow-2xl" : isAnnouncementVisible ? "top-10" : "top-0"
        )}
      >
        {!isMobile && (
          <div className={cn("relative flex items-center border-b border-white/5", isCollapsed ? "justify-center px-3 py-4" : "justify-between pl-6 py-4 pr-4")}>
            {!isCollapsed && <Logo size="desktop" />}
            
            <Button variant="ghost" size="icon" className="h-8 w-8 text-white/50 hover:text-white" rounded="full" onClick={toggleCollapsed}>
              {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>
        )}

        {/* Mobile menu header removed as requested */}

        <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-4 py-5 custom-scrollbar">
          {getSidebarContent().map((section, index) => (
            <div key={index} className="flex flex-col gap-2">
              {!isCollapsed && (
                <div className="mb-1 ml-3 text-[0.6rem] font-bold uppercase tracking-[0.25em] text-white/30">
                  {section.title}
                </div>
              )}
              <nav className="flex flex-col gap-1">
                {section.items.map((item, idx) => {
                  if (item.onClick) {
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          if (item.onClick) {
                            item.onClick();
                          }
                          if (isMobile) setIsOpen(false);
                        }}
                        className={cn(
                          "group flex items-center gap-3.5 rounded-xl px-3 py-2.5 text-sm transition-all duration-200 outline-none",
                          "text-white/60 hover:bg-white/5 hover:text-white",
                          isCollapsed && "justify-center"
                        )}
                      >
                        <item.icon size={18} strokeWidth={2} className="shrink-0 transition-transform group-hover:scale-110 group-hover:text-white" />
                        {!isCollapsed && <span className="font-semibold tracking-[-0.01em]">{item.title}</span>}
                      </button>
                    );
                  }

                  return (
                    <NavLink
                      key={idx}
                      to={item.href}
                      onClick={() => {
                        if (isMobile) setIsOpen(false);
                      }}
                      onMouseEnter={() => handleMenuHover(item.title)}
                      className={({ isActive }) =>
                        cn(
                          "group flex items-center gap-3.5 rounded-xl px-3 py-2.5 text-sm transition-all duration-300 outline-none relative overflow-hidden",
                          isActive
                            ? "bg-gradient-to-r from-[#9A3BDC]/15 to-transparent text-white border border-[#9A3BDC]/30 shadow-[inset_20px_0_40px_rgba(154,59,220,0.05)]"
                            : "text-white/50 hover:bg-white/5 hover:text-white border border-transparent",
                          isCollapsed && "justify-center px-0 bg-none border-none shadow-none"
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && !isCollapsed && <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#9A3BDC] shadow-[0_0_12px_#9A3BDC]" />}
                          <div className="relative flex items-center justify-center">
                            <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} className={cn("shrink-0 transition-transform group-hover:scale-110", isActive ? "text-white" : "group-hover:text-white")} />
                            {item.title === "Cart" && itemCount > 0 && isCollapsed && (
                              <Badge
                                className="absolute -right-2 -top-2 h-4 min-w-4 text-[9px] justify-center p-0 bg-accent text-white border-none"
                              >
                                {itemCount > 9 ? "9+" : itemCount}
                              </Badge>
                            )}
                          </div>
                          {!isCollapsed && (
                            <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
                              <span className={cn("truncate tracking-[-0.01em]", isActive ? "font-bold" : "font-semibold")}>{item.title}</span>
                              {item.title === "Cart" && itemCount > 0 && (
                                <Badge className="h-5 min-w-5 justify-center p-0 bg-accent font-bold text-[10px] text-white border-none" variant="default">
                                  {itemCount > 9 ? "9+" : itemCount}
                                </Badge>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>

        {!isCollapsed && (
          <div className="border-t border-white/5 px-6 py-6">
            <div className="text-[0.6rem] font-bold uppercase tracking-[0.25em] text-white/30 mb-2">
              Role
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_theme(colors.emerald.400)]" />
              <div className="text-sm font-bold text-white uppercase tracking-wider">
                {user?.role === "producer" ? "Producer" : user?.role === "admin" ? "Admin" : "Buyer"}
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
