import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { AnnouncementBanner } from "@/components/layout/AnnouncementBanner";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useAnnouncementVisible } from "@/hooks/useAnnouncement";

interface MainLayoutProps {
  children: React.ReactNode;
  activeTab?: string;
  currentPath?: string;
  hideSidebar?: boolean;
}

export function MainLayout({ children, activeTab, currentPath, hideSidebar }: MainLayoutProps) {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isMobile = useIsMobile();
  const location = useLocation();
  const isAnnouncementVisible = useAnnouncementVisible();
  const resolvedPath = currentPath || location.pathname;
  const isAuthPage = resolvedPath === "/login" || resolvedPath === "/signup" || resolvedPath === "/reset-password";

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
      <div className={cn("relative min-h-screen w-full overflow-hidden", isAnnouncementVisible && "pt-10")}>
        <div className="canvas-orb left-[-8rem] top-[-6rem] h-64 w-64 bg-brand-blue/20 md:h-80 md:w-80" />
        <div className="canvas-orb bottom-[8%] right-[-8rem] h-72 w-72 bg-brand-violet/20 md:h-96 md:w-96" />

        <div className="relative flex min-h-screen w-full">
          {!hideSidebar && (
            <Sidebar
              activeTab={activeTab}
              currentPath={currentPath}
              onCollapsedChange={setIsCollapsed}
            />
          )}

          <div
            className={cn(
              "flex min-w-0 flex-1 flex-col transition-[margin] duration-300 ease-out",
              !isMobile && !hideSidebar && (isCollapsed ? "lg:ml-[96px]" : "lg:ml-[272px]")
            )}
          >
            {!(isAuthPage && hideSidebar) && (
              <Topbar sidebarVisible={!isMobile && sidebarVisible && !hideSidebar} />
            )}

            <main className={cn("flex-1 w-full overflow-x-hidden", isAuthPage ? "pb-0" : "pb-32 md:pb-12")}>
              <div className="w-full max-w-full flex flex-col">{children}</div>
            </main>
          </div>
        </div>
      </div>
    </>
  );
}
