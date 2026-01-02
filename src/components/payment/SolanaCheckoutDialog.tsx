
import { useState, useEffect } from "react";
import { useSolanaPayment } from "@/hooks/payment/useSolanaPayment";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useWallet } from '@solana/wallet-adapter-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle, CheckCircle2, Wallet, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import WalletButton from "../wallet/WalletButton";

interface CartItem {
  id: string;
  title: string;
  price: number;
  thumbnail_url: string;
  quantity: number;
  producer_wallet?: string;
}

interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cartItems: CartItem[];
  onCheckoutSuccess: () => void;
}

interface PaymentResult {
  success: boolean;
  signature?: string;
  error?: string;
  groupIndex: number;
  producerWallet: string;
  amount: number;
  items: CartItem[];
}

export const SolanaCheckoutDialog = ({
  open,
  onOpenChange,
  cartItems,
  onCheckoutSuccess
}: CheckoutDialogProps) => {
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [validatedItems, setValidatedItems] = useState<CartItem[]>([]);
  const [validationComplete, setValidationComplete] = useState(false);
  const [validationError, setValidationError] = useState('');
  const { makePayment, makeMultiplePayments, isProcessing, isWalletConnected, network } = useSolanaPayment();
  const wallet = useWallet();

  // Add debug logs for dialog state
  useEffect(() => {
    console.log("SolanaCheckoutDialog - open state changed:", open);
    console.log("SolanaCheckoutDialog - cartItems count:", cartItems?.length);
    console.log("SolanaCheckoutDialog - wallet connected:", wallet.connected);
    console.log("SolanaCheckoutDialog - network:", network);
  }, [open, cartItems, wallet.connected, network]);

  // Re-validate wallet addresses when dialog opens
  useEffect(() => {
    const checkWalletAddresses = async () => {
      if (!open || cartItems.length === 0) return;

      setValidationError('');
      setValidationComplete(false);
      console.log("Validating USDC wallet addresses for items:", cartItems);

      try {
        const productIds = cartItems.map(item => item.id);

        const { data: beatsData, error: beatsError } = await supabase
          .from('beats')
          .select('id, producer_id')
          .in('id', productIds);

        if (beatsError) {
          console.error("Error fetching beats data:", beatsError);
          throw beatsError;
        }

        if (!beatsData || beatsData.length === 0) {
          console.error("No beats data returned");
          setValidationError("Could not verify beat information");
          return;
        }

        const producerIds = beatsData.map(beat => beat.producer_id);
        console.log("Producer IDs to check:", producerIds);

        const { data: producersData, error: producersError } = await supabase
          .from('users')
          .select('id, wallet_address, stage_name')
          .in('id', producerIds);

        if (producersError) {
          console.error("Error fetching producer data:", producersError);
          throw producersError;
        }

        console.log("Producer data from database:", producersData);

        const producerWalletMap: Record<string, string | null> = {};
        const producersWithoutWallets: string[] = [];

        producersData?.forEach(producer => {
          producerWalletMap[producer.id] = producer.wallet_address;
          if (!producer.wallet_address) {
            producersWithoutWallets.push(producer.stage_name || 'Unknown Producer');
          }
          console.log(`Producer ${producer.stage_name} wallet: ${producer.wallet_address || 'MISSING'}`);
        });

        const beatProducerMap: Record<string, string> = {};
        beatsData.forEach(beat => {
          beatProducerMap[beat.id] = beat.producer_id;
        });

        const updatedItems = cartItems.map(item => {
          const producerId = beatProducerMap[item.id];
          const verifiedWalletAddress = producerId ? producerWalletMap[producerId] : null;

          console.log(`Item ${item.id} - producer ${producerId} - wallet: ${verifiedWalletAddress || 'MISSING'}`);

          return {
            ...item,
            producer_wallet: verifiedWalletAddress || item.producer_wallet
          };
        });

        console.log("Updated items with verified wallet addresses:", updatedItems);

        const missingWallets = updatedItems.filter(item => {
          const hasWallet = !!item.producer_wallet;
          console.log(`Item ${item.id} has wallet: ${hasWallet} (${item.producer_wallet || 'null'})`);
          return !hasWallet;
        });

        // Allow checkout even with missing producer wallets - log for platform tracking
        if (missingWallets.length > 0) {
          console.log("Items with missing wallet addresses will use platform fallback:", missingWallets);
          console.log("Producers without wallets:", producersWithoutWallets);
        }

        // Set validation complete regardless of missing wallets
        setValidatedItems(updatedItems);
        setValidationComplete(true);
        setValidationError('');
      } catch (error: any) {
        console.error('Error validating wallet addresses:', error);
        setValidationError('Error validating producer payment information: ' + (error.message || 'Unknown error'));
      }
    };

    if (open) {
      checkWalletAddresses();
    }
  }, [open, cartItems]);

  const totalPrice = cartItems.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);

  const getItemsByProducer = () => {
    const itemsToUse = validatedItems.length > 0 ? validatedItems : cartItems;
    const groupedItems: Record<string, { items: CartItem[], total: number }> = {};

    itemsToUse.forEach(item => {
      const producerWallet = item.producer_wallet || '';

      // Use special key for items with missing producer wallets
      const walletKey = producerWallet || 'PLATFORM_FALLBACK';

      if (!groupedItems[walletKey]) {
        groupedItems[walletKey] = { items: [], total: 0 };
      }

      groupedItems[walletKey].items.push(item);
      groupedItems[walletKey].total += item.price * item.quantity;
    });

    return Object.entries(groupedItems).map(([wallet, data]) => ({
      producerWallet: wallet,
      items: data.items,
      total: data.total
    }));
  };

  const handleCheckout = async () => {
    if (!isWalletConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!validationComplete) {
      toast.error("Please wait for payment validation to complete");
      return;
    }

    setIsCheckingOut(true);

    // Clear any stale purchase flags from previous sessions to prevent redirect loops
    localStorage.removeItem('purchaseSuccess');
    localStorage.removeItem('purchaseTime');
    localStorage.removeItem('pendingOrderId');
    localStorage.removeItem('paystackReference');

    // Set flag to indicate payment is in progress (prevents Cart from redirecting mid-checkout)
    localStorage.setItem('paymentInProgress', 'true');

    try {
      console.log(`Processing unified Solana checkout for ${cartItems.length} items...`);

      // 1. Prepare items for the hook
      const itemsForPayment = validatedItems.map(item => ({
        price: item.price,
        producerWallet: item.producer_wallet || null, // null triggers fallback in the hook
        id: item.id,
        title: item.title
      }));

      const signatures = await makeMultiplePayments(
        itemsForPayment,
        () => {
          onCheckoutSuccess();
          onOpenChange(false);
          toast.success("Checkout completed successfully!");
        }
      );

      if (!signatures) {
        throw new Error("Checkout failed to produce transaction signatures");
      }

    } catch (error: any) {
      console.error("USDC checkout error:", error);
      const errorMessage = error.message || "An error occurred during checkout";
      toast.error(errorMessage);
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border shadow-lg">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold">Complete USDC Payment</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Purchase {cartItems.length} item(s) for ${totalPrice.toFixed(2)} USDC on {network}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!wallet.connected && (
            <Card className="border-amber-200 dark:border-amber-800">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="space-y-3">
                    <div>
                      <p className="font-medium text-amber-900 dark:text-amber-100">Wallet Connection Required</p>
                      <p className="text-sm text-amber-700 dark:text-amber-300">Connect your Solana wallet to complete this purchase</p>
                    </div>
                    <WalletButton className="w-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {wallet.connected && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Wallet className="h-5 w-5 text-primary flex-shrink-0" />
                  <div>
                    <div className="font-medium">Connected: {wallet.publicKey?.toString().slice(0, 8)}...{wallet.publicKey?.toString().slice(-8)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {validationComplete ? (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                <p className="font-medium">Payment Ready</p>
                <p className="text-sm mt-1">Your order is ready for checkout</p>
              </AlertDescription>
            </Alert>
          ) : (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin flex-shrink-0" />
                  <div>
                    <p className="font-medium">Verifying wallet addresses...</p>
                    <p className="text-sm text-muted-foreground">Please wait while we validate producer payment information</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Order Summary</h3>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>${totalPrice.toFixed(2)} USDC</span>
                </div>

                {/* Payment breakdown - TODO: HOLIDAY PROMO - Revert to 80/20 after January 31, 2025 */}
                <div className="p-3 bg-muted/30 rounded-lg text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">To Producers</span>
                    <span className="text-green-500 font-medium">100% 🎉</span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>Holiday Promo - Zero Platform Fees!</span>
                    <span>$0.00</span>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  Secure payment powered by Solana
                </p>
              </div>

              <div className="text-sm text-muted-foreground">
                <p>✨ Instant download access after payment completion</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isCheckingOut}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            className="w-full sm:w-auto"
            variant="premium"
            onClick={handleCheckout}
            disabled={isCheckingOut || !wallet.connected || !validationComplete}
          >
            {isCheckingOut ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing Payment...
              </>
            ) : (
              `Pay ${totalPrice.toFixed(2)} USDC`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
