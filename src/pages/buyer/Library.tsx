
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AlertCircle, CircleCheckBig, Heart, LibraryBig, ListMusic, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PurchasedBeats } from "@/components/library/PurchasedBeats";
import { FavoriteBeats } from "@/components/library/FavoriteBeats";
import { UserPlaylists } from "@/components/library/UserPlaylists";
import { useBeats } from "@/hooks/useBeats";
import { supabase } from "@/integrations/supabase/client";
import {
  clearPaymentSession,
  clearPurchaseSuccess,
  clearRedirectToLibrary,
  hasRecentPurchaseSuccess,
  shouldRedirectToLibrary,
} from "@/lib/paymentFlowStorage";

const tabMeta = {
  purchased: {
    icon: LibraryBig,
    title: "Purchases",
    copy: "Access your purchased beats and soundpacks.",
  },
  favorites: {
    icon: Heart,
    title: "Favorites",
    copy: "Your collection of favorite tracks.",
  },
  playlists: {
    icon: ListMusic,
    title: "Playlists",
    copy: "Organize your sounds into custom track sets.",
  },
};

export default function Library() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showPurchaseSuccess, setShowPurchaseSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState("purchased");
  const { refreshUserFavorites } = useBeats();

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("library-updates-optimized")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "user_purchased_beats",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          setActiveTab("purchased");
          setShowPurchaseSuccess(true);
          toast.success("New purchase detected. Library updated.");

          setTimeout(() => {
            setShowPurchaseSuccess(false);
          }, 8000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  useEffect(() => {
    if (location.pathname.includes("/favorites")) {
      setActiveTab("favorites");
    } else if (location.pathname.includes("/my-playlists")) {
      setActiveTab("playlists");
    } else {
      setActiveTab("purchased");
    }

    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.pathname, location.state]);

  useEffect(() => {
    document.title = "Acoustic Library | OrderSOUNDS";

    const fromPurchase = location.state?.fromPurchase;

    if (fromPurchase || hasRecentPurchaseSuccess() || shouldRedirectToLibrary()) {
      setShowPurchaseSuccess(true);
      setActiveTab("purchased");

      const currentPathname = location.pathname;
      navigate(currentPathname, { replace: true, state: { activeTab: "purchased" } });

      clearPurchaseSuccess();
      clearRedirectToLibrary();
      clearPaymentSession();

      toast.success("Purchase successful! Your new beats are now in your library.", {
        duration: 5000,
      });

      const timer = setTimeout(() => {
        setShowPurchaseSuccess(false);
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [location, navigate]);

  useEffect(() => {
    clearPaymentSession();
    clearRedirectToLibrary();
  }, []);

  const handleTabChange = (value: string) => {
    setActiveTab(value);

    if (value === "favorites") {
      refreshUserFavorites();
      navigate("/favorites", { replace: true });
    } else if (value === "playlists") {
      navigate("/my-playlists", { replace: true });
    } else {
      navigate("/library", { replace: true });
    }
  };

  if (!user) {
    return (
      <div className="container py-20 px-4 md:px-6">
        <div className="max-w-xl mx-auto p-12 rounded-[2.5rem] bg-white/[0.02] border border-white/5 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-3xl bg-[#9A3BDC]/10 flex items-center justify-center mb-6">
            <AlertCircle className="h-10 w-10 text-[#9A3BDC]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white italic tracking-tighter uppercase mb-4">Sign In Required</h1>
          <p className="text-white/50 italic mb-8">
            Please sign in to view your purchased sounds and library.
          </p>
          <Button className="w-full h-14 rounded-2xl font-black uppercase italic tracking-tighter text-lg bg-white text-black hover:bg-white/90" onClick={() => navigate("/login")}>
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  const activeMeta = tabMeta[activeTab as keyof typeof tabMeta] ?? tabMeta.purchased;
  const ActiveIcon = activeMeta.icon;

  return (
    <div className="container py-8 md:py-12 px-4 md:px-6">
      <div className="space-y-10">
        {showPurchaseSuccess && (
          <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-6 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                <CircleCheckBig className="h-7 w-7 text-emerald-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white uppercase italic tracking-tighter">Order Success</h3>
                <p className="text-emerald-500/70 text-sm">Your new items have been added to your library.</p>
              </div>
            </div>
            <Button variant="outline" className="rounded-xl border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10 h-10 px-6 font-bold uppercase italic" onClick={() => setShowPurchaseSuccess(false)}>
              Got it
            </Button>
          </div>
        )}

        <div className="relative p-[1px] rounded-[2.5rem] bg-gradient-to-br from-white/10 to-transparent">
          <div className="bg-[#030407] rounded-[2.4rem] p-8 md:p-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-5">
               <ActiveIcon className="h-32 w-32 text-white" />
            </div>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
              <div className="space-y-2">
                <span className="text-xs font-black uppercase tracking-[0.2em] text-[#9A3BDC] flex items-center gap-2">
                  <Sparkles size={14} /> Marketplace
                </span>
                <h1 className="text-2xl sm:text-3xl md:text-5xl font-black text-white italic tracking-tighter uppercase">
                  Library <span className="text-white/20">/</span> {activeMeta.title}
                </h1>
                <p className="text-white/40 text-lg italic">{activeMeta.copy}</p>
              </div>

              <div className="hidden lg:grid grid-cols-2 gap-4 max-w-sm">
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 text-[10px] uppercase font-bold tracking-widest text-white/30 leading-relaxed">
                  Your library is updated in real-time across all devices.
                </div>
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 text-[10px] uppercase font-bold tracking-widest text-white/30 leading-relaxed">
                  High-quality downloads available for all your tracks.
                </div>
              </div>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-8">
          <TabsList className="bg-white/[0.02] border border-white/5 p-1 rounded-2xl h-14 w-full md:w-auto md:inline-flex overflow-x-auto no-scrollbar">
            <TabsTrigger value="purchased" className="flex-1 md:flex-none rounded-xl px-4 sm:px-10 font-bold data-[state=active]:bg-white data-[state=active]:text-black transition-all uppercase italic tracking-tighter">Purchases</TabsTrigger>
            <TabsTrigger value="favorites" className="flex-1 md:flex-none rounded-xl px-4 sm:px-10 font-bold data-[state=active]:bg-white data-[state=active]:text-black transition-all uppercase italic tracking-tighter">Favorites</TabsTrigger>
            <TabsTrigger value="playlists" className="flex-1 md:flex-none rounded-xl px-4 sm:px-10 font-bold data-[state=active]:bg-white data-[state=active]:text-black transition-all uppercase italic tracking-tighter">Playlists</TabsTrigger>
          </TabsList>

          <TabsContent value="purchased" className="outline-none focus-visible:outline-none">
            <div className="min-h-[400px]">
              <PurchasedBeats />
            </div>
          </TabsContent>

          <TabsContent value="favorites" className="outline-none focus-visible:outline-none">
            <div className="min-h-[400px]">
              <FavoriteBeats />
            </div>
          </TabsContent>

          <TabsContent value="playlists" className="outline-none focus-visible:outline-none">
            <div className="min-h-[400px]">
              <UserPlaylists />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
