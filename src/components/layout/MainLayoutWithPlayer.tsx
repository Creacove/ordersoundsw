
import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { PersistentPlayer } from "@/components/player/PersistentPlayer";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePlayer } from "@/context/PlayerContext";
import { useLocation } from "react-router-dom";

interface MainLayoutWithPlayerProps {
  children: React.ReactNode;
  activeTab?: string;
  currentPath?: string;
  hideSidebar?: boolean;
}

export function MainLayoutWithPlayer({ children, activeTab, currentPath, hideSidebar }: MainLayoutWithPlayerProps) {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isMobile = useIsMobile();
  const { currentBeat } = usePlayer();
  const location = useLocation();
  const hasPlayer = !!currentBeat;
  
  // Check if the current path is an auth page
  const isAuthPage = location.pathname === "/login" || location.pathname === "/signup";

  // Listen for sidebar open/close events
  useEffect(() => {
    const handleSidebarChange = (event: CustomEvent) => {
      setSidebarVisible(event.detail.isOpen);
    };

    window.addEventListener('sidebarChange' as any, handleSidebarChange);
    return () => {
      window.removeEventListener('sidebarChange' as any, handleSidebarChange);
    };
  }, []);

  return (
    <div className="flex min-h-screen w-full overflow-x-hidden">
      {!hideSidebar && (
        <Sidebar 
          activeTab={activeTab} 
          currentPath={currentPath} 
          onCollapsedChange={setIsCollapsed}
        />
      )}
      <div className={`flex flex-col flex-1 min-w-0 transition-all duration-300 ${!isMobile && !hideSidebar ? (isCollapsed ? "md:ml-[80px]" : "md:ml-[240px]") : ""}`}>
        {/* Only show topbar if not explicitly hidden or if it's not an auth page with hideSidebar */}
        {!(isAuthPage && hideSidebar) && (
          <Topbar sidebarVisible={!isMobile && sidebarVisible && !hideSidebar} />
        )}
        <main className={`flex-1 w-full overflow-x-hidden ${hasPlayer ? (isMobile ? 'pb-36' : 'pb-28') : (isMobile ? 'pb-20' : 'pb-8')}`}>
          <div className="w-full max-w-full flex flex-col">
            {children}
          </div>
        </main>
        <PersistentPlayer />
      </div>
    </div>
  );
}
