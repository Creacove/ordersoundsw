
import { RefreshCw, Loader2, X, Info, CreditCard } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

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
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-0 max-h-[90vh] overflow-y-auto border-primary/20 shadow-xl backdrop-blur-sm bg-background/95">
        <DialogHeader className="px-6 pt-6 pb-4 bg-gradient-to-r from-primary/5 to-secondary/5 border-b border-primary/10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold text-foreground">Complete Your Purchase</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground mt-1">
                {paymentStarted ? 
                  "Payment window is opening. If you don't see it, please check if it's been blocked by your browser." :
                  "You'll be redirected to Paystack's secure payment platform to complete this transaction."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="p-6 space-y-5">
          {/* Order Summary Card */}
          <div className="p-5 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-xl border border-primary/10 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-foreground">Order Total</h3>
              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                Live Payment
              </Badge>
            </div>
            
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-primary">₦{totalAmount.toLocaleString()}</span>
              <span className="text-sm text-muted-foreground">.00</span>
            </div>
            
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <Info className="h-3 w-3" />
              Secure payment powered by Paystack
            </p>
          </div>
          
          {/* Validation Error */}
          {validationError && (
            <div className="p-4 border border-destructive/20 bg-destructive/5 rounded-lg">
              <div className="flex items-start gap-3">
                <X className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-destructive mb-2">{validationError}</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full border-destructive/30 hover:border-destructive/50 hover:bg-destructive/10 transition-colors"
                    onClick={onRefreshCart}
                    disabled={isValidating}
                  >
                    {isValidating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Refreshing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" /> 
                        Refresh Cart
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {/* Live Payment Information */}
          {paymentStarted && (
            <Alert className="bg-green-50/80 dark:bg-green-900/20 border-green-200 dark:border-green-800/40">
              <Info className="h-4 w-4 text-green-500 dark:text-green-400" />
              <AlertDescription className="text-sm text-green-700 dark:text-green-300">
                <div className="space-y-2">
                  <p className="font-medium">Live Payment Processing</p>
                  <p className="text-xs">You will be charged the full amount. Please use your actual payment details.</p>
                </div>
              </AlertDescription>
            </Alert>
          )}
          
          <Separator className="my-4" />
          
          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <Button 
              onClick={onPaymentStart}
              disabled={isProcessing || isValidating || validationError !== null || paymentStarted}
              className="w-full py-6 text-base shadow-md hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing Payment...
                </>
              ) : paymentStarted ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Opening Payment Window...
                </>
              ) : isValidating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Validating Cart...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-5 w-5" />
                  Proceed to Payment
                </>
              )}
            </Button>
            
            {(isProcessing || paymentStarted) && forceCancel && (
              <Button 
                variant="destructive" 
                onClick={forceCancel}
                className="w-full py-3 text-sm hover:bg-destructive/90 transition-colors"
                size="sm"
              >
                <X size={16} className="mr-2" />
                Cancel Payment
              </Button>
            )}
            
            <Button 
              variant="outline" 
              onClick={onClose}
              disabled={isProcessing && !forceCancel}
              className="w-full py-5 text-base border-border hover:bg-accent/50 transition-all shadow-sm hover:shadow"
              size="lg"
            >
              Back to Cart
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
