
import { Home, Search, ShoppingCart, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { cn } from "@/lib/utils";
import { Dispatch, SetStateAction } from "react";

interface MobileBottomNavProps {
  activeBottomTab?: string;
  user?: any;
  itemCount?: number;
  setIsOpen?: Dispatch<SetStateAction<boolean>>;
  setActiveBottomTab?: Dispatch<SetStateAction<string>>;
}

export function MobileBottomNav({ 
  activeBottomTab: propActiveBottomTab,
  setActiveBottomTab: propSetActiveBottomTab 
}: MobileBottomNavProps = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { cartItems } = useCart();

  // Calculate total items in cart
  const cartItemsCount = cartItems?.length || 0;

  const menuItems = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      path: '/',
    },
    {
      id: 'discover',
      label: 'Discover',
      icon: Search,
      path: '/discover',
    },
    {
      id: 'cart',
      label: 'Cart',
      icon: ShoppingCart,
      path: '/cart',
      badge: cartItemsCount > 0 ? cartItemsCount : undefined,
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      path: user ? '/profile' : '/login',
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50 md:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center min-w-0 flex-1 py-1 px-1 relative",
                "transition-colors duration-200",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="relative">
                <Icon size={20} />
                {item.badge && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              <span className="text-xs mt-1 truncate w-full text-center">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
