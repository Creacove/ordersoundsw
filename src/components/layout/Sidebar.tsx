
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { usePlayer } from "@/context/PlayerContext";
import { useCart } from "@/context/CartContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileBottomNav } from "./MobileBottomNav";
import { getSidebarSections } from "./SidebarContentSections";
import { UnifiedSidebar } from "./UnifiedSidebar";

interface SidebarProps {
  activeTab?: string;
  currentPath?: string;
  onCollapsedChange?: (collapsed: boolean) => void;
}

function Sidebar({ activeTab, currentPath, onCollapsedChange }: SidebarProps) {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const { isPlaying, currentBeat } = usePlayer();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeBottomTab, setActiveBottomTab] = useState(activeTab || "");

  // Dispatch sidebar change event when isOpen changes
  useEffect(() => {
    const event = new CustomEvent('sidebarChange', { 
      detail: { isOpen: isOpen } 
    });
    window.dispatchEvent(event);
  }, [isOpen]);

  useEffect(() => {
    if (isMobile) {
      setIsOpen(false);
    } else {
      // On desktop, the sidebar is always visible in some form (either expanded or collapsed)
      setIsOpen(true);
    }

    if (activeTab) {
      setActiveBottomTab(activeTab);
    } else {
      const path = currentPath || location.pathname;

      if (path === "/") setActiveBottomTab("home");
      else if (path === "/genres" || path === "/discover") setActiveBottomTab("discover");
      else if (path === "/trending") setActiveBottomTab("trending");
      else if (path === "/playlists") setActiveBottomTab("playlists");
      else if (path === "/cart") setActiveBottomTab("cart");
      else if (path === "/producers") setActiveBottomTab("producers");
      else if (path === "/producer/dashboard") setActiveBottomTab("producer");
      else if (path === "/producer/beats") setActiveBottomTab("beats");
      else if (path === "/producer/royalties") setActiveBottomTab("royalties");
      else if (path === "/library" || path === "/purchased" || path === "/my-playlists") setActiveBottomTab("library");
      else setActiveBottomTab("");
    }
  }, [location.pathname, isMobile, activeTab, currentPath]);

  const handleSignOut = () => {
    logout && logout();
  };

  const toggleCollapsed = () => {
    const newCollapsedState = !isCollapsed;
    setIsCollapsed(newCollapsedState);
    
    // Notify parent component about the collapse state change
    if (onCollapsedChange) {
      onCollapsedChange(newCollapsedState);
    }
  };

  const getSidebarContent = () => {
    return getSidebarSections(user, handleSignOut);
  };

  return (
    <>
      {/* Show unified sidebar */}
      <UnifiedSidebar 
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        user={user}
        handleSignOut={handleSignOut}
        getSidebarContent={getSidebarContent}
        isCollapsed={isCollapsed}
        toggleCollapsed={toggleCollapsed}
        isMobile={isMobile}
      />
      
      {/* Only show bottom nav on mobile */}
      {isMobile && (
        <MobileBottomNav 
          activeBottomTab={activeBottomTab}
          user={user}
          itemCount={itemCount}
          setIsOpen={setIsOpen}
          setActiveBottomTab={setActiveBottomTab}
        />
      )}
    </>
  );
}

export { Sidebar };
