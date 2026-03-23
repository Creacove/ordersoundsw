import { useMemo, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { AlertTriangle, CheckCircle2, Info, Loader2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { publicEnv } from "@/config/publicEnv";
import {
  getSolanaAllocationSummary,
  type SolanaCheckoutDisplayItem,
} from "@/features/checkout/cartCheckout";
import { useSolanaPayment } from "@/hooks/payment/useSolanaPayment";
import {
  clearPaymentSession,
  clearPurchaseSuccess,
  markPaymentInProgress,
} from "@/lib/paymentFlowStorage";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import WalletButton from "../wallet/WalletButton";

interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cartItems: SolanaCheckoutDisplayItem[];
  onCheckoutSuccess: () => void;
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export const SolanaCheckoutDialog = ({
  open,
  onOpenChange,
  cartItems,
  onCheckoutSuccess,
}: CheckoutDialogProps) => {
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const { makeMultiplePayments, isWalletConnected, network } = useSolanaPayment();
  const wallet = useWallet();

  const totalPrice = useMemo(() => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  }, [cartItems]);
  const allocationSummary = useMemo(() => {
    return getSolanaAllocationSummary(
      cartItems,
      publicEnv.solanaPlatformFeeBps,
    );
  }, [cartItems]);

  const feePercentageLabel = (publicEnv.solanaPlatformFeeBps / 100).toFixed(2);
  const hasItems = cartItems.length > 0;
  const hasPricingIssues = cartItems.some((item) => item.price <= 0);
  const hasPlatformFallbackItems = allocationSummary.fallbackItemCount > 0;

  const handleCheckout = async () => {
    if (!isWalletConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!hasItems) {
      toast.error("Your cart is empty");
      return;
    }

    if (hasPricingIssues) {
      toast.error("One or more items have invalid pricing. Please review your cart.");
      return;
    }

    setIsCheckingOut(true);
    clearPurchaseSuccess();
    clearPaymentSession();
    markPaymentInProgress();

    try {
      const signatures = await makeMultiplePayments(
        cartItems.map((item) => ({
          id: item.id,
          licenseType: item.license_type,
          price: item.price,
          producerId: item.producer_id,
          producerWallet: item.producer_wallet,
          productType: item.type,
          title: item.title,
        })),
        () => {
          onCheckoutSuccess();
          onOpenChange(false);
        },
      );

      if (!signatures?.length) {
        throw new Error("Checkout failed to produce transaction signatures");
      }
    } catch (error) {
      toast.error(getErrorMessage(error, "An error occurred during checkout"));
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
              <DialogTitle className="text-xl font-semibold">
                Complete USDC Payment
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Pay ${totalPrice.toFixed(2)} USDC for {cartItems.length} item(s)
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
                      <p className="font-medium text-amber-900 dark:text-amber-100">
                        Wallet Connection Required
                      </p>
                      <p className="text-sm text-amber-700 dark:text-amber-300">
                        Connect your Solana wallet to complete this purchase
                      </p>
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
                  <div className="font-medium">
                    Connected: {wallet.publicKey?.toString().slice(0, 8)}...
                    {wallet.publicKey?.toString().slice(-8)}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              <p className="font-medium">Ready to Checkout</p>
              <p className="text-sm mt-1">
                Your order will be confirmed immediately after payment.
              </p>
            </AlertDescription>
          </Alert>

          {hasPlatformFallbackItems && (
            <Alert className="border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {allocationSummary.fallbackItemCount} item(s) will route to the platform wallet as the producer's wallet hasn't been configured.
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Order Summary</h3>
                <Badge variant="secondary">{cartItems.length} items</Badge>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>${totalPrice.toFixed(2)} USDC</span>
                </div>

                <div className="p-3 bg-muted/30 rounded-lg text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">To Producers</span>
                    <span className="font-medium">
                      ${allocationSummary.producerAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Platform Share ({feePercentageLabel}% default)
                    </span>
                    <span className="font-medium">
                      ${allocationSummary.platformAmount.toFixed(2)}
                    </span>
                  </div>
                  {hasPlatformFallbackItems && (
                    <p className="text-xs text-muted-foreground">
                      Some items will route to the platform wallet.
                    </p>
                  )}
                </div>

                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  Secure payment powered by Solana with transaction verification.
                </p>
              </div>

              <div className="text-sm text-muted-foreground">
                <p>You'll receive instant access to your purchased items in your library.</p>
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
            disabled={isCheckingOut || !wallet.connected || !hasItems || hasPricingIssues}
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
