
import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { publicEnv } from '@/config/publicEnv';
import { PaystackCheckout } from './PaystackCheckout';
import { useAuth } from '@/context/AuthContext';
import { AlertCircle, RefreshCw, Loader2 } from 'lucide-react';
import { useCartWithBeatDetailsOptimized } from '@/hooks/useCartWithBeatDetailsOptimized';
import { toast } from 'sonner';

interface PaymentHandlerProps {
  totalAmount: number;
  onSuccess?: () => void;
  producerId?: string;
  beatId?: string;
}

const hasConfiguredPaystackKey = Boolean(publicEnv.paystackPublicKey);

export function PaymentHandler({ totalAmount, onSuccess, producerId, beatId }: PaymentHandlerProps) {
  const [isPaystackOpen, setIsPaystackOpen] = useState(false);
  const { currency, user } = useAuth();
  const { clearCart, cartItems } = useCartWithBeatDetailsOptimized();
  const [hasItems, setHasItems] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [scriptError, setScriptError] = useState(false);
  const [loadingScript, setLoadingScript] = useState(false);
  const [initiatingPayment, setInitiatingPayment] = useState(false);
  const scriptLoadAttempts = useRef(0);
  const maxScriptLoadAttempts = 3;
  const scriptCheckInterval = useRef<NodeJS.Timeout | null>(null);
  const paystackScriptUrl = "https://js.paystack.co/v1/inline.js";
  const scriptRef = useRef<HTMLScriptElement | null>(null);

  // Check if Paystack is already available in the window object
  const verifyPaystackAvailable = useCallback(() => {
    try {
      return window.PaystackPop && 
             typeof window.PaystackPop === 'object' && 
             typeof window.PaystackPop.setup === 'function';
    } catch (e) {
      console.error('Error checking PaystackPop:', e);
      return false;
    }
  }, []);

  // Clean up any ongoing checks or timeouts
  const cleanupPaystackResources = useCallback(() => {
    if (scriptCheckInterval.current) {
      clearInterval(scriptCheckInterval.current);
      scriptCheckInterval.current = null;
    }
  }, []);

  // Improved script loading with better error handling
  const loadPaystackScript = useCallback(() => {
    // Don't try loading if we've reached the max attempts
    if (scriptLoadAttempts.current >= maxScriptLoadAttempts) {
      console.error('Maximum script load attempts reached');
      setScriptError(true);
      setLoadingScript(false);
      toast.error('Payment system unavailable. Please try again later.');
      return;
    }

    // Clean up any existing script element
    if (scriptRef.current && scriptRef.current.parentNode) {
      scriptRef.current.parentNode.removeChild(scriptRef.current);
      scriptRef.current = null;
    }

    // Clean up any existing intervals
    cleanupPaystackResources();
    
    // Show loading state
    setLoadingScript(true);
    setScriptError(false);
    scriptLoadAttempts.current += 1;
    
    // Remove any existing script element
    const existingScript = document.getElementById('paystack-script');
    if (existingScript) {
      existingScript.remove();
    }

    // Create a new script element
    const script = document.createElement('script');
    script.src = paystackScriptUrl;
    script.id = "paystack-script";
    script.async = true;
    scriptRef.current = script;
    
    script.onload = () => {
      console.log('Paystack script loaded, checking for PaystackPop object');
      
      // Check for Paystack object using interval for reliability
      let checkCount = 0;
      const maxChecks = 10;
      
      scriptCheckInterval.current = setInterval(() => {
        checkCount++;
        if (verifyPaystackAvailable()) {
          cleanupPaystackResources();
          console.log('Paystack script loaded successfully');
          setScriptLoaded(true);
          setScriptError(false);
          setLoadingScript(false);
        } else if (checkCount >= maxChecks) {
          cleanupPaystackResources();
          console.error('Paystack script loaded but PaystackPop not available after multiple checks');
          setScriptError(true);
          setLoadingScript(false);
          
          // Try again after a delay
          setTimeout(() => {
            loadPaystackScript();
          }, 2000);
        } else {
          console.log(`Checking for PaystackPop (${checkCount}/${maxChecks})`);
        }
      }, 300);
    };
    
    script.onerror = () => {
      console.error('Failed to load Paystack script');
      setScriptError(true);
      setLoadingScript(false);
      toast.error('Payment system could not be loaded. Please try again.');
      
      // Try again after a delay
      setTimeout(() => {
        loadPaystackScript();
      }, 2000);
    };
    
    document.body.appendChild(script);
  }, [cleanupPaystackResources, verifyPaystackAvailable]);

  // Load script on component mount
  useEffect(() => {
    if (!hasConfiguredPaystackKey) {
      setScriptLoaded(false);
      setLoadingScript(false);
      return;
    }

    // If Paystack is already available, don't load the script again
    if (verifyPaystackAvailable()) {
      console.log('Paystack already loaded');
      setScriptLoaded(true);
      setLoadingScript(false);
      return;
    }
    
    loadPaystackScript();
    
    return () => {
      cleanupPaystackResources();
    };
  }, [cleanupPaystackResources, loadPaystackScript, verifyPaystackAvailable]);

  // Update hasItems when cart changes
  useEffect(() => {
    setHasItems(cartItems && cartItems.length > 0);
  }, [cartItems]);
  
  // Handle successful payment
  const handlePaystackSuccess = (reference: string) => {
    console.log('Payment successful with reference:', reference);
    
    clearCart();
    
    toast.success('Payment successful! Redirecting to your library...');
    
    if (onSuccess) {
      onSuccess();
    }
    
    setIsPaystackOpen(false);
    setInitiatingPayment(false);
  };

  // Handle payment modal close
  const handlePaystackClose = () => {
    setInitiatingPayment(false);
    setIsPaystackOpen(false);
  };

  // Handle script reload
  const handleReloadScript = () => {
    setScriptError(false);
    scriptLoadAttempts.current = 0;
    loadPaystackScript();
    toast.info('Reloading payment system...');
  };

  // Start payment process
  const handleStartPayment = () => {
    if (!producerId && (!cartItems || cartItems.length === 0)) {
      toast.error('Your cart is empty. Please add items before checkout.');
      return;
    }
    
    if (loadingScript) {
      toast.error('Payment system still initializing. Please wait a moment.');
      return;
    }
    
    if (!verifyPaystackAvailable()) {
      toast.error('Payment system not ready. Reloading payment gateway...');
      handleReloadScript();
      return;
    }
    
    setInitiatingPayment(true);
    
    // Small delay to show feedback before opening dialog
    setTimeout(() => {
      setIsPaystackOpen(true);
      setInitiatingPayment(false);
    }, 300);
  };

  // If user is not logged in, show message
  if (!user) {
    return (
      <div className="flex items-center gap-2 p-4 border rounded-md bg-muted/30 text-muted-foreground">
        <AlertCircle className="h-5 w-5" />
        <p>Please sign in to proceed with checkout</p>
      </div>
    );
  }

  const isDisabled = totalAmount <= 0 || (!hasItems && !producerId) || !scriptLoaded || loadingScript;

  return (
    <div className="space-y-4">
      {scriptError && (
        <div className="p-3 border border-destructive/50 bg-destructive/10 rounded-md mb-4">
          <p className="text-sm font-medium text-destructive">
            There was an error loading the payment system. Please try reloading.
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2 w-full flex items-center justify-center gap-2"
            onClick={handleReloadScript}
          >
            <RefreshCw size={14} />
            Reload Payment System
          </Button>
        </div>
      )}

      {!hasConfiguredPaystackKey && (
        <div className="p-3 border border-destructive/50 bg-destructive/10 rounded-md mb-4">
          <p className="text-sm font-medium text-destructive">
            NGN checkout is unavailable because `VITE_PAYSTACK_PUBLIC_KEY` is missing from the browser env.
          </p>
        </div>
      )}
      
      {loadingScript && !scriptError && (
        <div className="p-3 border border-primary/20 bg-primary/5 rounded-md mb-4">
          <p className="text-sm text-primary/80 flex items-center gap-2">
            <Loader2 size={14} className="animate-spin" />
            Loading payment system...
          </p>
        </div>
      )}
      
      {currency === 'NGN' && (
        <>
          <Button 
            onClick={handleStartPayment}
            className="w-full py-6 text-base"
            size="lg"
            disabled={isDisabled}
          >
            {initiatingPayment ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                Initializing...
              </>
            ) : loadingScript ? (
              'Loading Payment System...'
            ) : (
              `Pay with Paystack (₦${Math.round(totalAmount).toLocaleString()})`
            )}
          </Button>
          
          <PaystackCheckout 
            isOpen={isPaystackOpen}
            onSuccess={handlePaystackSuccess}
            onClose={handlePaystackClose}
            totalAmount={totalAmount}
            beatId={beatId}
            producerId={producerId}
          />
        </>
      )}
    </div>
  );
}
