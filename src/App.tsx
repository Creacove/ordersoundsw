import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { PlayerProvider } from "@/context/PlayerContext";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ScrollToTop } from "@/components/utils/ScrollToTop";

// Direct imports instead of lazy loading
import Home from "./pages/buyer/Home";
import NotFound from "./pages/NotFound";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import ResetPassword from "./pages/auth/ResetPassword";
import AuthCallback from "./pages/auth/Callback";
import ProducerActivation from "./pages/auth/ProducerActivation";
import Library from "./pages/buyer/Library";
import Trending from "./pages/buyer/Trending";
import New from "./pages/buyer/New";
import GamingSoundtrack from "./pages/buyer/GamingSoundtrack";
import Playlists from "./pages/buyer/Playlists";
import Genres from "./pages/buyer/Genres";
import Producers from "./pages/buyer/Producers";
import Charts from "./pages/buyer/Charts";
import Orders from "./pages/buyer/Orders";
import Cart from "./pages/buyer/Cart";
import Search from "./pages/buyer/Search";
import Settings from "./pages/user/Settings";
import ProducerSettings from "./pages/producer/Settings";
import Contact from "./pages/Contact";
import BuyerProfile from "./pages/buyer/BuyerProfile";
import ProducerProfile from "./pages/producer/ProducerProfile";
import BeatDetail from "./pages/buyer/BeatDetail";
import SoundpackDetail from "./pages/buyer/SoundpackDetail";
import ProducerDashboard from "./pages/producer/Dashboard";
import UploadBeat from "./pages/producer/UploadBeat";
import ProducerBeats from "./pages/producer/Beats";
import Royalties from "./pages/producer/Royalties";
import ProtectedProducerRoute from "./components/auth/ProtectedProducerRoute";
import ProtectedAdminRoute from "./components/auth/ProtectedAdminRoute";
import Sandbox from "./pages/Sandbox";
import Licenses from "./pages/Licenses";

// Lazy load admin dashboard to avoid affecting main app performance
import { lazy, Suspense } from "react";
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));

// Add custom wallet styles
import '@solana/wallet-adapter-react-ui/styles.css';
import './wallet-button.css';
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import SolanaWalletProvider from "./components/wallet/SolanaWalletProvider";

// Configure QueryClient with optimized settings for less API stress
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 0, // Disable retries - user will manually refresh
      staleTime: 10 * 60 * 1000, // 10 minutes stale time
      gcTime: 60 * 60 * 1000, // 1 hour garbage collection
      networkMode: 'online', // Only fetch when online
    },
  },
});

// Helper component for dynamic redirect
const PlaylistRedirect = () => {
  const location = useLocation();
  const playlistId = location.pathname.split("/").pop();
  return <Navigate to={`/playlists/${playlistId}`} replace />;
};

// Wrapper component to ensure proper context nesting
const AppContent = () => (
  <AuthProvider>
    <CartProvider>
      <PlayerProvider>
        <SidebarProvider>
          <ScrollToTop />
          <Toaster />
          <Sonner position="top-right" expand={true} closeButton={true} />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/trending" element={<Trending />} />
            <Route path="/new" element={<New />} />
            <Route path="/gaming-soundtrack" element={<GamingSoundtrack />} />
            <Route path="/playlists" element={<Playlists />} />
            <Route path="/playlists/:playlistId" element={<Playlists />} />
            <Route path="/playlist/:playlistId" element={<PlaylistRedirect />} />
            <Route path="/genres" element={<Genres />} />
            <Route path="/producers" element={<Producers />} />
            <Route path="/charts" element={<Charts />} />
            <Route path="/search" element={<Search />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/beat/:beatId" element={<BeatDetail />} />
            <Route path="/soundpack/:soundpackId" element={<SoundpackDetail />} />
            <Route path="/licenses" element={<Licenses />} />
            <Route path="/sandbox" element={<Sandbox />} />

            {/* Profile Routes */}
            <Route path="/buyer/:buyerId" element={<BuyerProfile />} />
            <Route path="/producer/:producerId" element={<ProducerProfile />} />

            {/* Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/producer-activation" element={<ProducerActivation />} />

            {/* Library Routes */}
            <Route path="/library" element={<Library />} />
            <Route path="/buyer/library" element={<Navigate to="/library" replace />} />
            <Route path="/favorites" element={<Library />} />
            <Route path="/purchased" element={<Navigate to="/library" replace />} />
            <Route path="/my-playlists" element={<Library />} />
            <Route path="/my-playlists/:playlistId" element={<Library />} />
            <Route path="/orders" element={<Orders />} />

            {/* Producer Routes */}
            <Route path="/producer/dashboard" element={<ProtectedProducerRoute><ProducerDashboard /></ProtectedProducerRoute>} />
            <Route path="/producer/upload" element={<ProtectedProducerRoute><UploadBeat /></ProtectedProducerRoute>} />
            <Route path="/producer/beats" element={<ProtectedProducerRoute><ProducerBeats /></ProtectedProducerRoute>} />
            <Route path="/producer/royalties" element={<ProtectedProducerRoute><Royalties /></ProtectedProducerRoute>} />
            <Route path="/producer/settings" element={<ProtectedProducerRoute><ProducerSettings /></ProtectedProducerRoute>} />

            {/* Admin Routes - Lazy loaded and protected */}
            <Route 
              path="/admin" 
              element={
                <ProtectedAdminRoute>
                  <Suspense fallback={
                    <div className="flex items-center justify-center h-screen">
                      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
                    </div>
                  }>
                    <AdminDashboard />
                  </Suspense>
                </ProtectedAdminRoute>
              } 
            />

            {/* Catch-all Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </SidebarProvider>
      </PlayerProvider>
    </CartProvider>
  </AuthProvider>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AppContent />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
