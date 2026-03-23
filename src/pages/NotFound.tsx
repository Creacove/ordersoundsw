
import { useLocation, Link, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, Ghost } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
    
    document.title = "404 - Page Not Found | OrderSOUNDS";
    
    const isDirectPageLoad = !window.performance
      .getEntriesByType("navigation")
      .some((nav) => (nav as any).type === "navigate");
      
    if (isDirectPageLoad && location.pathname !== "/404") {
      const validPaths = [
        '/trending', '/new', '/playlists', '/genres', '/producers', 
        '/charts', '/search', '/contact', '/cart', '/library',
        '/favorites', '/purchased', '/my-playlists', '/orders',
        '/login', '/signup', '/settings'
      ];
      
      const isPathPotentiallyValid = validPaths.some(validPath => 
        location.pathname.startsWith(validPath)
      );
      
      if (isPathPotentiallyValid) {
        const timer = setTimeout(() => {
          setShouldRedirect(true);
        }, 100);
        
        return () => clearTimeout(timer);
      }
    }
  }, [location.pathname]);

  if (shouldRedirect) {
    return <Navigate to="/" replace />;
  }

  const isPlaylistPath = location.pathname.includes('/playlist/');
  const correctPath = isPlaylistPath 
    ? location.pathname.replace('/playlist/', '/playlists/') 
    : null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#030407] overflow-hidden relative">
      <div className="absolute inset-0 z-0">
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#9A3BDC]/10 blur-[120px] rounded-full" />
      </div>

      <div className="text-center max-w-lg mx-auto p-12 relative z-10">
        <div className="mb-8 flex justify-center">
          <div className="w-24 h-24 rounded-3xl bg-white/[0.03] border border-white/10 flex items-center justify-center animate-bounce">
            <Ghost size={48} className="text-[#9A3BDC]" />
          </div>
        </div>
        
        <h1 className="text-8xl md:text-9xl font-black text-white italic tracking-tighter uppercase mb-4 opacity-20">404</h1>
        <h2 className="text-2xl md:text-4xl font-black text-white italic tracking-tighter uppercase mb-6 -mt-12 md:-mt-16 relative z-20">Page Not Found</h2>
        <p className="text-lg text-white/50 mb-10 italic">The page you're looking for doesn't exist or may have moved.</p>
        
        {isPlaylistPath && (
          <div className="mb-10 p-6 bg-white/[0.03] border border-white/5 rounded-3xl backdrop-blur-sm">
            <p className="text-sm text-white/70 mb-4 italic">
              It looks like you have a legacy playlist link. Try the updated URL below.
            </p>
            <Button asChild className="w-full h-12 rounded-xl font-bold bg-[#9A3BDC] text-white hover:bg-[#9A3BDC]/90">
              <Link to={correctPath || '/'}>
                Go to Playlists
              </Link>
            </Button>
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild className="h-14 px-8 rounded-2xl font-black uppercase italic tracking-tighter text-lg bg-white text-black hover:bg-white/90">
            <Link to="/">
              <Home className="mr-2 h-5 w-5" />
              Go Home
            </Link>
          </Button>
          <Button 
            variant="outline" 
            className="h-14 px-8 rounded-2xl font-black uppercase italic tracking-tighter text-lg border-white/10 bg-white/[0.03] text-white hover:bg-white/10"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
