import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { PlayerProvider } from "@/context/PlayerContext";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ScrollToTop } from "@/components/utils/ScrollToTop";
import { AppRoutes } from "@/routes/AppRoutes";
import "@solana/wallet-adapter-react-ui/styles.css";
import "./wallet-button.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 0,
      staleTime: 10 * 60 * 1000,
      gcTime: 60 * 60 * 1000,
      networkMode: "online",
    },
  },
});

const AppContent = () => (
  <AuthProvider>
    <CartProvider>
      <PlayerProvider>
        <SidebarProvider>
          <ScrollToTop />
          <Toaster />
          <Sonner position="top-right" expand={true} closeButton={true} />
          <AppRoutes />
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
