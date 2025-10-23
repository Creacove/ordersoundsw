import React from "react";
import { NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { User } from "@/types";
import { useProducers } from "@/hooks/useProducers";
import { useState } from "react";

interface UnifiedSidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  user: User | null;
  handleSignOut: () => void;
  getSidebarContent: () => any[];
  isCollapsed: boolean;
  toggleCollapsed: () => void;
  isMobile: boolean;
}

export function UnifiedSidebar({
  isOpen,
  setIsOpen,
  user,
  handleSignOut,
  getSidebarContent,
  isCollapsed,
  toggleCollapsed,
  isMobile,
}: UnifiedSidebarProps) {
  const { prefetchProducers } = useProducers();
  const [prefetchedSections, setPrefetchedSections] = useState<Set<string>>(new Set());

  const handleMenuHover = (title: string) => {
    const sectionKey = title.toLowerCase();

    if (!prefetchedSections.has(sectionKey)) {
      console.log(`Prefetching data for ${title} section`);

      if (sectionKey === "producers") {
        prefetchProducers();
        setPrefetchedSections((prev) => new Set([...prev, sectionKey]));
      }
    }
  };

  return (
    <>
      {isMobile && isOpen && <div className="fixed inset-0 bg-black/70 z-40" onClick={() => setIsOpen(false)} />}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex flex-col transition-all duration-300 ease-in-out",
          "bg-[#0e0e0e] text-white",
          isMobile ? (isOpen ? "translate-x-0" : "-translate-x-full") : "translate-x-0",
          isCollapsed ? "w-[80px]" : "w-[240px]",
          isMobile ? "shadow-lg" : "",
          isMobile ? "mt-16" : "", // Only add top margin on mobile
        )}
      >
        {/* Logo section - Desktop only */}
        {!isMobile && (
          <div className="flex items-center justify-center h-16 border-b border-[#272727]">
            <NavLink to="/" className="flex items-center">
              {isCollapsed ? (
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
            </NavLink>
          </div>
        )}

        {/* Mobile close button */}
        {isMobile && (
          <div className="flex items-center justify-end p-3 border-b border-[#272727]">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsOpen(false)}>
              <ChevronLeft size={16} />
            </Button>
          </div>
        )}

        <div className="flex flex-col flex-1 gap-2 p-4 overflow-y-auto">
          {getSidebarContent().map((section, index) => (
            <div key={index} className="mb-6">
              {!isCollapsed && (
                <h2 className="px-3 mb-2 text-xs font-medium uppercase text-gray-400">{section.title}</h2>
              )}
              <nav className="flex flex-col gap-1">
                {section.items.map((item: any, idx: number) => {
                  if (item.onClick) {
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          item.onClick && item.onClick();
                          if (isMobile) setIsOpen(false);
                        }}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-all duration-200",
                          "hover:bg-purple-500/20 hover:text-white",
                          "text-[#b3b3b3]",
                          isCollapsed && "justify-center",
                        )}
                      >
                        <item.icon size={20} className="text-[#b3b3b3]" />
                        {!isCollapsed && <span>{item.title}</span>}
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
                          "flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-all duration-200",
                          "hover:bg-purple-500/20 hover:text-white",
                          isActive
                            ? "text-purple-500 border-r-4 border-purple-500 font-medium rounded-r-none"
                            : "text-[#b3b3b3] border-r-0",
                          isCollapsed && "justify-center",
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <item.icon size={20} className={isActive ? "text-purple-500" : "text-[#b3b3b3]"} />
                          {!isCollapsed && <span>{item.title}</span>}
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>

        <div className={cn("flex items-center justify-center p-4 border-t border-[#272727]")}>
          {!isMobile && (
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 rounded-full hover:bg-purple-500/20 hover:text-purple-500 transition-colors"
              onClick={toggleCollapsed}
            >
              {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </Button>
          )}
        </div>
      </aside>
    </>
  );
}
