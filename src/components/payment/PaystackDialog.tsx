
import { RefreshCw, Loader2, X, ShieldCheck, CreditCard, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useEffect } from 'react';

interface PaystackDialogProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  validationError: string | null;
  isProcessing: boolean;
  isValidating: boolean;
  onPaymentStart: () => void;
  onRefreshCart: () => void;
  forceCancel?: () => void;
  paymentStarted?: boolean;
}

export function PaystackDialog({
  isOpen,
  onClose,
  totalAmount,
  validationError,
  isProcessing,
  isValidating,
  onPaymentStart,
  onRefreshCart,
  forceCancel,
  paymentStarted
}: PaystackDialogProps) {
  useEffect(() => {
    if (paymentStarted) {
      const timer = setTimeout(() => {
        // Paystack window takes full control
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [paymentStarted]);

  if (paymentStarted) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-sm p-0 border-white/10 bg-[#030407] rounded-[2rem] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="relative p-[1px] rounded-[2rem]">
          <div className="p-8 pb-6 space-y-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-[#9A3BDC]/10 flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-[#9A3BDC]" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#9A3BDC]">Secure Checkout</p>
                <h2 className="text-xl font-black text-white italic tracking-tighter uppercase">Complete Purchase</h2>
              </div>
            </div>

            {/* Order Total */}
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/30 italic">Order Total</p>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-white italic tracking-tighter">
                  ₦{totalAmount.toLocaleString()}
                </span>
                <span className="text-sm text-white/30">.00</span>
              </div>
              <div className="flex items-center gap-1.5 pt-1">
                <ShieldCheck className="h-3 w-3 text-emerald-500" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-500/70">Secured by Paystack</p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-8 pb-8 space-y-4">
          {/* Validation Error */}
          {validationError && (
            <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/10 flex items-start gap-3">
              <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <p className="text-sm font-medium text-red-400">{validationError}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-9 rounded-xl border-red-500/20 hover:bg-red-500/10 text-red-400 font-bold text-xs uppercase italic tracking-widest"
                  onClick={onRefreshCart}
                  disabled={isValidating}
                >
                  {isValidating ? (
                    <><Loader2 className="mr-2 h-3 w-3 animate-spin" /> Refreshing...</>
                  ) : (
                    <><RefreshCw className="mr-2 h-3 w-3" /> Refresh Cart</>
                  )}
                </Button>
              </div>
            </div>
          )}

          <Separator className="bg-white/5" />

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={onPaymentStart}
              disabled={isProcessing || isValidating || validationError !== null}
              className="w-full h-14 rounded-2xl bg-white text-black font-black uppercase italic tracking-tighter text-base hover:bg-white/90 transition-all disabled:opacity-40"
            >
              {isProcessing ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Opening Payment Window...</>
              ) : isValidating ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Validating Cart...</>
              ) : (
                <><CreditCard className="mr-2 h-5 w-5" /> Pay ₦{totalAmount.toLocaleString()}</>
              )}
            </Button>

            {isProcessing && forceCancel && (
              <Button
                variant="outline"
                onClick={forceCancel}
                className="w-full h-10 rounded-xl border-red-500/20 text-red-400 hover:bg-red-500/10 font-bold text-xs uppercase italic tracking-widest"
              >
                <X size={14} className="mr-2" /> Cancel Payment
              </Button>
            )}

            <Button
              variant="ghost"
              onClick={onClose}
              disabled={isProcessing && !forceCancel}
              className="w-full h-11 rounded-xl text-white/30 font-bold uppercase italic tracking-widest text-xs hover:text-white transition-colors"
            >
              Back to Cart
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
