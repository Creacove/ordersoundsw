
import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { AnnouncementBanner } from "@/components/layout/AnnouncementBanner";
import { PersistentPlayer } from "@/components/player/PersistentPlayer";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePlayer } from "@/context/PlayerContext";
import { cn } from "@/lib/utils";
import { useAnnouncementVisible } from "@/hooks/useAnnouncement";

export function PersistentLayout() {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isMobile = useIsMobile();
  const { currentBeat } = usePlayer();
  const location = useLocation();
  const isAnnouncementVisible = useAnnouncementVisible();
  const hasPlayer = !!currentBeat;
  
  const isAuthPage = location.pathname === "/login" || 
                     location.pathname === "/signup" || 
                     location.pathname === "/reset-password";
  
  const isAnimationsPage = location.pathname === "/animations";
  
  const hideSidebar = isAuthPage || isAnimationsPage;

  useEffect(() => {
    const handleSidebarChange: EventListener = (event) => {
      const sidebarEvent = event as CustomEvent<{ isOpen?: boolean }>;
      setSidebarVisible(Boolean(sidebarEvent.detail?.isOpen));
    };

    window.addEventListener("sidebarChange", handleSidebarChange);
    return () => {
      window.removeEventListener("sidebarChange", handleSidebarChange);
    };
  }, []);

  return (
    <>
      <AnnouncementBanner />
      <div className={cn("relative min-h-screen w-full overflow-clip", isAnnouncementVisible && "pt-10")}>
        {/* Background Orbs */}
        <div className="canvas-orb left-[-8rem] top-[-6rem] h-64 w-64 bg-brand-blue/20 md:h-80 md:w-80" />
        <div className="canvas-orb bottom-[8%] right-[-8rem] h-72 w-72 bg-brand-violet/20 md:h-96 md:w-96" />

        <div className="relative flex min-h-screen w-full">
          {!hideSidebar && (
            <Sidebar
              onCollapsedChange={setIsCollapsed}
            />
          )}
          <div
            className={cn(
              "flex min-w-0 flex-1 flex-col transition-[margin] duration-300 ease-out",
              !isMobile && !hideSidebar && (isCollapsed ? "lg:ml-[96px]" : "lg:ml-[272px]")
            )}
          >
            {!(isAuthPage && hideSidebar) && !isAnimationsPage && (
              <Topbar sidebarVisible={!isMobile && sidebarVisible && !hideSidebar} />
            )}
            <main
              className={cn(
                "flex-1 w-full overflow-x-hidden",
                !hideSidebar && (hasPlayer ? (isMobile ? "pb-52" : "pb-44") : isMobile ? "pb-28" : "pb-14")
              )}
            >
              <div className="w-full max-w-full flex flex-col">
                <Outlet />
              </div>
            </main>
            {!hideSidebar && <PersistentPlayer isCollapsed={isCollapsed} hideSidebar={hideSidebar} />}
          </div>
        </div>
      </div>
    </>
  );
}
