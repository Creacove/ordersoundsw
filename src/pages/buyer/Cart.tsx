
import { useEffect, useMemo, useState } from "react";
import {
  useCartWithBeatDetailsOptimized,
  type CartItemWithDetails,
} from "@/hooks/useCartWithBeatDetailsOptimized";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  ShoppingCart,
  ArrowRight,
  ShieldCheck,
  Wallet,
  LoaderCircle,
  CircleCheckBig,
  AlertTriangle,
  Lock,
  Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useOnboardingTracker } from "@/hooks/useOnboardingTracker";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PaymentHandler } from "@/components/payment/PaymentHandler";
import { SolanaCheckoutDialog } from "@/components/payment/SolanaCheckoutDialog";
import WalletButton from "@/components/wallet/WalletButton";
import { useWalletSync } from "@/hooks/useWalletSync";
import { supabase } from "@/integrations/supabase/client";
import {
  clearPaymentSession,
  clearPurchaseSuccess,
  hasRecentPurchaseSuccess,
  isPaymentInProgress,
  markPurchaseSuccess,
} from "@/lib/paymentFlowStorage";
import {
  buildCheckoutLineItems,
  buildSolanaCheckoutItems,
  getCartItemUnitPrice,
  getCheckoutItemsMissingProducerWallet,
} from "@/features/checkout/cartCheckout";
import CartItemCard from "@/components/cart/CartItemCard";
import SoundpackCartItemCard from "@/components/cart/SoundpackCartItemCard";
import { SectionTitle } from "@/components/ui/SectionTitle";

type BeatCartItem = CartItemWithDetails & {
  beat: NonNullable<CartItemWithDetails["beat"]>;
  itemType: "beat";
};

type SoundpackCartItem = CartItemWithDetails & {
  itemType: "soundpack";
  soundpack: NonNullable<CartItemWithDetails["soundpack"]>;
};

function isBeatCartItem(item: CartItemWithDetails): item is BeatCartItem {
  return item.itemType === "beat" && Boolean(item.beat);
}

function isSoundpackCartItem(item: CartItemWithDetails): item is SoundpackCartItem {
  return item.itemType === "soundpack" && Boolean(item.soundpack);
}

function formatMoney(totalAmount: number, currency: "NGN" | "USD") {
  return currency === "NGN"
    ? `₦${Math.round(totalAmount).toLocaleString()}`
    : `$${Math.round(totalAmount).toLocaleString()}`;
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase();
}

function CartStatePanel({
  title,
  body,
  icon,
  action,
}: {
  title: string;
  body: string;
  icon: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-[400px] max-w-xl flex-col items-center justify-center p-12 text-center rounded-[2.5rem] bg-white/[0.02] border border-white/5">
      <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center mb-8">
        {icon}
      </div>
      <h2 className="text-3xl font-black italic tracking-tighter text-white uppercase mb-4">{title}</h2>
      <p className="text-white/50 italic mb-8 max-w-sm">{body}</p>
      {action && <div>{action}</div>}
    </div>
  );
}

export default function Cart() {
  const { cartItems, removeFromCart, clearCart, totalAmount, itemCount, isLoading, error, refreshCartFromStorage } =
    useCartWithBeatDetailsOptimized();
  const { user, currency } = useAuth();
  const { checkAndCompleteOnboarding } = useOnboardingTracker();
  const navigate = useNavigate();
  const { isWalletSynced, needsAuth, isConnected, walletMismatch, storedWalletAddress, syncStatus } = useWalletSync();

  const [isSolanaDialogOpen, setIsSolanaDialogOpen] = useState(false);
  const [purchaseComplete, setPurchaseComplete] = useState(false);

  const checkoutLineItems = useMemo(() => buildCheckoutLineItems(cartItems, currency), [cartItems, currency]);
  const solanaCheckoutItems = useMemo(() => buildSolanaCheckoutItems(cartItems, currency), [cartItems, currency]);
  const itemsMissingProducerWallet = useMemo(
    () => getCheckoutItemsMissingProducerWallet(checkoutLineItems),
    [checkoutLineItems]
  );

  useEffect(() => {
    const checkPurchaseStatus = () => {
      if (isPaymentInProgress()) {
        return false;
      }

      if (hasRecentPurchaseSuccess()) {
        setPurchaseComplete(true);

        setTimeout(() => {
          clearPurchaseSuccess();
          clearPaymentSession();
          window.location.href = "/library";
        }, 1500);
        return true;
      }

      clearPurchaseSuccess();
      clearPaymentSession();

      return false;
    };

    if (checkPurchaseStatus()) {
      return;
    }

    const setupPurchaseListener = () => {
      if (!user) return { unsubscribe: () => {} };

      return supabase
        .channel("purchased-beats-changes")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "user_purchased_beats",
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            if (isPaymentInProgress()) {
              return;
            }

            clearCart();
            markPurchaseSuccess();

            window.location.href = "/library";
          }
        )
        .subscribe();
    };

    const subscription = setupPurchaseListener();

    return () => {
      subscription.unsubscribe();
    };
  }, [user, clearCart]);

  const handleRemoveItem = (itemId: string) => {
    try {
      removeFromCart(itemId);
      toast.success("Item removed from cart");
    } catch {
      toast.error("Failed to remove item");
    }
  };

  const handleClearCart = () => {
    try {
      clearCart();
      toast.success("Cart cleared successfully");
    } catch {
      toast.error("Failed to clear cart");
    }
  };

  const handlePaymentSuccess = () => {
    clearCart();
    checkAndCompleteOnboarding();
    markPurchaseSuccess();
    setPurchaseComplete(true);

    setTimeout(() => {
      window.location.href = "/library";
    }, 1500);
  };

  const handleContinueShopping = () => {
    navigate("/");
  };

  const handleOpenSolanaCheckout = async () => {
    if (!cartItems || cartItems.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    if (!user) {
      toast.error("Please log in to make a purchase");
      navigate("/login");
      return;
    }

    if (!isConnected) {
      toast.error("Please connect your Solana wallet first");
      return;
    }

    if (needsAuth) {
      toast.error("Please log in to sync your wallet");
      navigate("/login");
      return;
    }

    if (walletMismatch) {
      toast.error(`Connected wallet doesn't match your saved wallet. Please use "Force Sync" to update your saved wallet.`);
      return;
    }

    if (syncStatus === "syncing") {
      toast.error("Please wait for wallet to sync with your account");
      return;
    }

    if (syncStatus === "error") {
      toast.error('Wallet sync failed. Please try "Force Sync" or reconnect your wallet');
      return;
    }

    if (!isWalletSynced) {
      toast.error('Wallet not synced. Please try "Force Sync" or reconnect your wallet');
      return;
    }

    if (checkoutLineItems.length !== cartItems.length) {
      toast.error("Some cart items could not be prepared for checkout. Please refresh your cart.");
      return;
    }

    const invalidPricedItems = checkoutLineItems.filter((item) => item.price <= 0);
    if (invalidPricedItems.length > 0) {
      toast.error("Some cart items have invalid pricing. Please review your cart before checkout.");
      return;
    }

    setIsSolanaDialogOpen(true);
  };

  if (error) {
    return (
      <div className="container py-20 px-4 md:px-6">
        <CartStatePanel
          title="Archive Error"
          body={error}
          icon={<AlertTriangle className="h-10 w-10 text-red-500" />}
          action={
            <div className="flex gap-4">
              <Button onClick={() => window.location.reload()} variant="outline" className="h-12 px-6 rounded-xl border-white/10 font-bold">
                Reload Page
              </Button>
              <Button onClick={() => refreshCartFromStorage()} className="h-12 px-6 rounded-xl bg-white text-black font-bold">
                Retry
              </Button>
            </div>
          }
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container py-20 px-4 md:px-6">
        <CartStatePanel
          title="Loading Cart"
          body="Fetching your cart items and sound details..."
          icon={<LoaderCircle className="h-10 w-10 animate-spin text-[#9A3BDC]" />}
        />
      </div>
    );
  }

  if (purchaseComplete) {
    return (
      <div className="container py-20 px-4 md:px-6">
        <CartStatePanel
          title="Payment Successful"
          body="Thank you! Your items are now available in your personal library."
          icon={<CircleCheckBig className="h-10 w-10 text-emerald-500" />}
        />
      </div>
    );
  }

  return (
    <div className="container py-8 md:py-12 px-4 md:px-6 max-w-7xl">
      {(!cartItems || cartItems.length === 0) ? (
        <CartStatePanel
          title="Cart Empty"
          body="Your cart is currently empty. Explore the marketplace to find your next sound."
          icon={<ShoppingCart className="h-10 w-10 text-white/20" />}
          action={
            <Button onClick={handleContinueShopping} className="h-12 px-8 rounded-xl font-black uppercase italic tracking-tighter bg-white text-black hover:bg-white/90">
              Go to Marketplace <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          }
        />
      ) : (
        <div className="grid gap-12 xl:grid-cols-[1fr_400px]">
          <div className="space-y-10">
            <header className="space-y-4">
              <SectionTitle 
                title="Order Summary" 
                icon={<ShoppingCart className="h-6 w-6" />}
              />
              <p className="text-white/40 italic text-lg">
                Review your items and complete your purchase.
              </p>
              
              <div className="flex flex-wrap gap-3">
                <span className="bg-white/5 border border-white/10 rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-widest text-white/60 italic">{itemCount} ITEMS</span>
                <span className="bg-[#9A3BDC]/10 border border-[#9A3BDC]/20 rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-widest text-[#9A3BDC] italic">TOTAL: {formatMoney(totalAmount, currency)}</span>
                <button onClick={handleClearCart} className="text-[10px] font-black uppercase tracking-widest text-white/30 hover:text-white transition-colors italic">Clear Cart</button>
              </div>
            </header>

            <div className="space-y-6">
              {cartItems.map((item) => {
                if (isSoundpackCartItem(item)) {
                  return (
                    <SoundpackCartItemCard
                      key={`${item.itemId}-${item.addedAt}`}
                      item={item}
                      price={getCartItemUnitPrice(item, currency)}
                      onRemove={handleRemoveItem}
                    />
                  );
                }
                if (!isBeatCartItem(item)) return null;
                return (
                  <CartItemCard
                    key={`${item.itemId}-${item.addedAt}`}
                    item={item}
                    price={getCartItemUnitPrice(item, currency)}
                    onRemove={handleRemoveItem}
                  />
                );
              })}
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 space-y-4">
                <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center">
                   <ShieldCheck className="h-5 w-5 text-[#9A3BDC]" />
                </div>
                <div>
                   <h4 className="text-xs font-black uppercase tracking-widest text-white mb-2 italic">Secured Rights</h4>
                   <p className="text-white/30 text-xs italic leading-relaxed">Full legal usage rights granted upon completion.</p>
                </div>
              </div>
              <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 space-y-4">
                <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center">
                   <Lock className="h-5 w-5 text-[#9A3BDC]" />
                </div>
                <div>
                   <h4 className="text-xs font-black uppercase tracking-widest text-white mb-2 italic">Secure Checkout</h4>
                   <p className="text-white/30 text-xs italic leading-relaxed">All payments are protected by industry-standard encryption.</p>
                </div>
              </div>
              <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 space-y-4">
                <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center">
                   <Zap className="h-5 w-5 text-[#9A3BDC]" />
                </div>
                <div>
                   <h4 className="text-xs font-black uppercase tracking-widest text-white mb-2 italic">Instant Access</h4>
                   <p className="text-white/30 text-xs italic leading-relaxed">Items available in your library immediately after purchase.</p>
                </div>
              </div>
            </div>
          </div>

          <aside className="space-y-6 xl:sticky xl:top-24 self-start">
            <div className="relative p-[1px] rounded-[2.5rem] bg-gradient-to-br from-white/10 to-transparent">
              <Card className="bg-[#030407] border-none rounded-[2.4rem] overflow-hidden">
                <CardHeader className="p-8 pb-4">
                  <CardTitle className="text-sm font-black uppercase tracking-widest text-white/40 italic">Order Total</CardTitle>
                </CardHeader>
                <CardContent className="p-8 pt-0 space-y-6">
                  <div className="flex items-end justify-between">
                     <span className="text-white/40 text-sm font-bold uppercase italic">{itemCount} Items</span>
                     <span className="text-3xl font-black text-white italic tracking-tighter uppercase">{formatMoney(totalAmount, currency)}</span>
                  </div>

                  <Separator className="bg-white/10" />

                  <p className="text-white/40 text-xs italic leading-relaxed">
                    By completing this order, you authorize the transfer of funds and confirm acceptance of the licensing agreements.
                  </p>

                  {currency === "USD" && (
                    <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/5 space-y-4">
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white italic">
                        <Wallet className="h-4 w-4 text-[#9A3BDC]" />
                        Pay with USDC (Solana)
                      </div>
                      <WalletButton buttonClass="w-full h-12 rounded-xl justify-center font-bold bg-white/5 border-white/10 hover:bg-white/10" />

                      <div className="space-y-2 text-[10px] italic">
                        {!user && <div className="text-amber-500 font-bold uppercase tracking-widest">VERIFICATION REQUIRED.</div>}
                        {user && !isConnected && <div className="text-white/40 uppercase tracking-widest">Awaiting Wallet Link...</div>}
                        {user && isConnected && needsAuth && <div className="text-amber-500 font-bold uppercase tracking-widest">Re-authorization needed.</div>}
                        {user && isWalletSynced && (
                          <div className="text-emerald-500 font-bold uppercase tracking-widest flex items-center gap-1">
                             <CircleCheckBig size={10} /> Wallet Connected.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="p-8 pt-4 flex flex-col gap-4">
                  {currency === "NGN" ? (
                    <div className="w-full">
                      <PaymentHandler totalAmount={totalAmount} onSuccess={handlePaymentSuccess} />
                    </div>
                  ) : (
                    <Button
                      onClick={handleOpenSolanaCheckout}
                      className="w-full h-14 rounded-2xl font-black uppercase italic tracking-tighter text-lg bg-[#9A3BDC] text-white hover:bg-[#9A3BDC]/90 shadow-[0_0_20px_rgba(154,59,220,0.3)]"
                      disabled={
                        !cartItems ||
                        cartItems.length === 0 ||
                        !user ||
                        !isConnected ||
                        needsAuth ||
                        walletMismatch ||
                        syncStatus === "syncing" ||
                        syncStatus === "error" ||
                        !isWalletSynced
                      }
                    >
                      {!user ? "VERIFY IDENTITY" :
                        !isConnected ? "LINK WALLET" :
                          needsAuth ? "RE-AUTHORIZE" :
                            walletMismatch ? "INVALID COORDS" :
                              syncStatus === "syncing" ? "SYNCING..." :
                                syncStatus === "error" ? "SYNC FAILURE" :
                                  !isWalletSynced ? "NOT SYNCED" :
                                    `PAY ${formatMoney(totalAmount, "USD")}`}
                    </Button>
                  )}

                  <Button variant="ghost" className="w-full h-12 rounded-xl text-white/40 font-bold uppercase tracking-widest italic hover:text-white" onClick={handleContinueShopping}>
                    Continue Shopping
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </aside>
        </div>
      )}

      <SolanaCheckoutDialog
        open={isSolanaDialogOpen}
        onOpenChange={setIsSolanaDialogOpen}
        cartItems={solanaCheckoutItems}
        onCheckoutSuccess={handlePaymentSuccess}
      />
    </div>
  );
}
