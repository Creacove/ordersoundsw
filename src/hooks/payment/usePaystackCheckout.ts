
import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { useCartWithBeatDetailsOptimized } from '@/hooks/useCartWithBeatDetailsOptimized';
import { supabase } from '@/integrations/supabase/client';
import { createOrder, verifyPaystackPayment } from '@/utils/payment/paystackUtils';

declare global {
  interface Window {
    PaystackPop: any;
  }
}

interface UsePaystackCheckoutProps {
  onSuccess: (reference: string) => void;
  onClose: () => void;
  totalAmount: number;
  splitCode?: string | null;
  producerId?: string;
  beatId?: string;
  testMode?: boolean;
}

export function usePaystackCheckout({ 
  onSuccess, 
  onClose, 
  totalAmount,
  splitCode,
  producerId,
  beatId,
  testMode = false
}: UsePaystackCheckoutProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [paymentStarted, setPaymentStarted] = useState(false);
  const { user } = useAuth();
  const { cartItems, clearCart } = useCartWithBeatDetailsOptimized();
  const navigate = useNavigate();
  const paymentTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const paystackHandlerRef = useRef<any>(null);
  
  // Create function references for Paystack callbacks
  const paystackCloseRef = useRef(() => {
    console.log('Payment window closed');
    setIsProcessing(false);
    setPaymentStarted(false);
    localStorage.removeItem('paymentInProgress');
    
    if (paymentTimeoutRef.current) {
      clearTimeout(paymentTimeoutRef.current);
      paymentTimeoutRef.current = null;
    }
    
    onClose();
  });
  
  // Function to handle successful payments
  const paystackSuccessRef = useRef((response: any) => {
    console.log('Payment complete! Response:', response);
    
    if (paymentTimeoutRef.current) {
      clearTimeout(paymentTimeoutRef.current);
      paymentTimeoutRef.current = null;
    }
    
    const handleSuccess = async () => {
      try {
        const orderId = localStorage.getItem('pendingOrderId');
        const orderItemsStr = localStorage.getItem('orderItems');
        
        if (!orderId || !orderItemsStr) {
          toast.error('Order information missing. Please try again.');
          setIsProcessing(false);
          setPaymentStarted(false);
          return;
        }
        
        const orderItemsData = JSON.parse(orderItemsStr);
        
        // Check current order status first
        const { data: orderData, error: orderCheckError } = await supabase
          .from('orders')
          .select('status')
          .eq('id', orderId)
          .single();
          
        if (orderCheckError) {
          console.error('Error checking order status:', orderCheckError);
        } else if (orderData && orderData.status === 'completed') {
          // Order already completed, skip verification
          console.log('Order already completed, proceeding as success');
          toast.success('Payment successful! Redirecting to your library...');
          
          clearCart();
          localStorage.setItem('purchaseSuccess', 'true');
          localStorage.setItem('purchaseTime', Date.now().toString());
          setIsProcessing(false);
          setPaymentStarted(false);
          onSuccess(response.reference);
          
          // Force redirect to library
          setTimeout(() => {
            window.location.href = '/library';
          }, 1500);
          return;
        }
        
        // Show verification toast
        toast.loading('Verifying payment...', { id: 'payment-verification' });
        
        // Verify the payment
        const verificationResult = await verifyPaystackPayment(
          response.reference, 
          orderId,
          orderItemsData
        );
        
        // Dismiss the loading toast
        toast.dismiss('payment-verification');
        
        if (verificationResult.success) {
          clearCart();
          localStorage.setItem('purchaseSuccess', 'true');
          localStorage.setItem('purchaseTime', Date.now().toString());
          localStorage.removeItem('paymentInProgress');
          localStorage.removeItem('pendingOrderId');
          localStorage.removeItem('orderItems');
          setIsProcessing(false);
          setPaymentStarted(false);
          onSuccess(response.reference);
          
          // Redirect to library
          toast.success('Payment successful! Redirecting to your library...');
          setTimeout(() => {
            window.location.href = '/library';
          }, 1500);
        } else {
          setIsProcessing(false);
          setPaymentStarted(false);
          toast.error(`Payment verification failed. Please try again or contact support with reference: ${response.reference}`);
        }
      } catch (error) {
        console.error('Error during payment verification:', error);
        toast.error('An error occurred processing your payment');
        setIsProcessing(false);
        setPaymentStarted(false);
      }
    };
    
    handleSuccess();
  });

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (paymentTimeoutRef.current) {
        clearTimeout(paymentTimeoutRef.current);
        paymentTimeoutRef.current = null;
      }
    };
  }, []);

  // Validate cart items before checkout
  const validateCartItems = useCallback(async () => {
    if (!user) {
      setValidationError('You must be logged in to complete this purchase');
      return false;
    }

    setIsValidating(true);
    setValidationError(null);

    try {
      // Verify session is still valid
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !sessionData.session) {
        setValidationError('Your session has expired. Please refresh and log in again.');
        return false;
      }

      // Direct beat purchase with producer split
      if (producerId && beatId) {
        console.log('Validating direct beat purchase:', beatId);
        
        // Validate the beat exists and is available
        const { data: beatData, error: beatError } = await supabase
          .from('beats')
          .select('id, status, producer_id, title')
          .eq('id', beatId)
          .maybeSingle();
        
        if (beatError) {
          console.error('Error validating beat:', beatError);
          setValidationError('Failed to validate the beat');
          return false;
        }
        
        if (!beatData || beatData.status !== 'published') {
          setValidationError('This beat is no longer available for purchase');
          return false;
        }
        
        if (beatData.producer_id !== producerId) {
          setValidationError('Producer mismatch. Please try again.');
          return false;
        }
        
        // Check if already purchased
        const { data: purchasedData, error: purchasedError } = await supabase
          .from('user_purchased_beats')
          .select('id')
          .eq('user_id', user.id)
          .eq('beat_id', beatId)
          .maybeSingle();
          
        if (purchasedError && purchasedError.code !== 'PGRST116') {
          console.error('Error checking purchased beat:', purchasedError);
        }
        
        if (purchasedData) {
          setValidationError(`You've already purchased this beat: ${beatData.title}`);
          return false;
        }
        
        return true;
      }
      
      // Cart validation
      console.log('Validating cart items:', cartItems);
      
      if (!cartItems || cartItems.length === 0) {
        setValidationError('Your cart is empty');
        return false;
      }

      const beatIds = cartItems.map(item => item.beat.id);
      const { data: beatsData, error: beatsError } = await supabase
        .from('beats')
        .select('id, status')
        .in('id', beatIds);

      if (beatsError) {
        console.error('Error validating beats:', beatsError);
        setValidationError('Failed to validate your cart items');
        return false;
      }

      if (!beatsData) {
        setValidationError('Failed to validate your cart items');
        return false;
      }

      const availableBeats = beatsData.filter(beat => beat.status === 'published');
      if (availableBeats.length !== beatIds.length) {
        setValidationError(`Some beats in your cart are no longer available`);
        return false;
      }

      const { data: purchasedData, error: purchasedError } = await supabase
        .from('user_purchased_beats')
        .select('beat_id')
        .eq('user_id', user.id)
        .in('beat_id', beatIds);

      if (purchasedError) {
        console.error('Error checking purchased beats:', purchasedError);
        setValidationError('Failed to validate your previous purchases');
        return false;
      }

      if (purchasedData && purchasedData.length > 0) {
        const alreadyPurchasedTitles = cartItems
          .filter(item => purchasedData.some(p => p.beat_id === item.beat.id))
          .map(item => item.beat.title);
          
        setValidationError(
          `You've already purchased: ${alreadyPurchasedTitles.join(', ')}`
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error('Cart validation error:', error);
      setValidationError('An error occurred while validating your cart');
      return false;
    } finally {
      setIsValidating(false);
    }
  }, [user, cartItems, producerId, beatId]);

  // Start the payment process
  const handlePaymentStart = useCallback(async () => {
    if (isProcessing || isValidating || paymentStarted) return;
    
    setIsProcessing(true);
    
    try {
      // Verify PaystackPop is available
      if (typeof window === 'undefined' || !window.PaystackPop || typeof window.PaystackPop.setup !== 'function') {
        console.error('PaystackPop not properly loaded');
        toast.error('Payment system not ready. Please refresh the page and try again.');
        setIsProcessing(false);
        return;
      }
      
      // Validate cart items
      const isValid = await validateCartItems();
      
      if (!isValid) {
        setIsProcessing(false);
        return;
      }
      
      // Verify session again before creating order
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !sessionData.session) {
        toast.error('Your session has expired. Please refresh and log in again.');
        setIsProcessing(false);
        return;
      }
      
      // Generate a unique reference ID
      const reference = `ORDER_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
      
      // Prepare order item data
      let orderItemsData;
      
      if (producerId && beatId) {
        // Direct beat purchase
        const { data: beatData, error: beatError } = await supabase
          .from('beats')
          .select('id, title, basic_license_price_local')
          .eq('id', beatId)
          .maybeSingle();
          
        if (beatError || !beatData) {
          toast.error('Failed to fetch beat details. Please try again.');
          setIsProcessing(false);
          return;
        }
        
        orderItemsData = [{
          beat_id: beatData.id,
          title: beatData.title,
          price: beatData.basic_license_price_local,
          license: 'basic'
        }];
      } else {
        // Cart purchase - use optimized cart items
        orderItemsData = cartItems.map(item => ({
          beat_id: item.beat.id,
          title: item.beat.title,
          price: item.beat.basic_license_price_local,
          license: item.licenseType || 'basic'
        }));
      }
      
      // Important: Make sure we have a user
      if (!user || !user.id) {
        toast.error('User authentication required. Please sign in.');
        setIsProcessing(false);
        return;
      }
      
      console.log('Creating order for user:', user.id);
      console.log('Session verified:', sessionData.session.user.id);
      
      // Create order in database with verified session
      const { orderId, error: orderError } = await createOrder(user, totalAmount, orderItemsData);
      
      if (orderError) {
        toast.error('Failed to create order: ' + orderError);
        setIsProcessing(false);
        return;
      }
      
      if (!orderId) {
        toast.error('Failed to create order: No order ID returned');
        setIsProcessing(false);
        return;
      }
      
      // Store order data for verification
      localStorage.setItem('pendingOrderId', orderId);
      localStorage.setItem('orderItems', JSON.stringify(orderItemsData));
      localStorage.setItem('paystackReference', reference);
      localStorage.setItem('paystackAmount', totalAmount.toString());
      localStorage.setItem('paymentInProgress', 'true');
      localStorage.setItem('purchaseTime', Date.now().toString());
      
      // Add metadata
      const metadata = {
        custom_fields: [
          {
            display_name: "Order ID",
            variable_name: "order_id",
            value: orderId
          }
        ]
      };
      
      console.log('Starting Paystack payment');
      
      // Mark payment as started
      setPaymentStarted(true);
      
      try {
        // Create Paystack handler with proper configuration
        const handler = window.PaystackPop.setup({
          key: 'pk_test_b3ff87016c279c34b015be72594fde728d5849b8', // Public test key
          email: user?.email || '',
          amount: totalAmount * 100, // Convert to kobo
          currency: 'NGN',
          ref: reference,
          label: 'OrderSOUNDS',
          metadata: metadata,
          onClose: paystackCloseRef.current,
          callback: paystackSuccessRef.current,
          // These settings are important for the payment window to display properly
          frame: true,
          embed: false,
          container: undefined, // Make sure we don't set a container
        });
        
        paystackHandlerRef.current = handler;
        
        // Explicitly open the payment iframe
        handler.openIframe();
        
        // Set timeout to check for problems
        if (paymentTimeoutRef.current) {
          clearTimeout(paymentTimeoutRef.current);
        }
        
        // First timeout - provide feedback
        paymentTimeoutRef.current = setTimeout(() => {
          if (!paymentStarted) return;
          
          // Longer timeout for the overall process
          paymentTimeoutRef.current = setTimeout(() => {
            if (!paymentStarted) return;
            console.log('Payment taking too long - automatic timeout');
            toast.error('Payment taking too long. Please try again.');
            setIsProcessing(false);
            setPaymentStarted(false);
            localStorage.removeItem('paymentInProgress');
          }, 120000); // 2 minute overall timeout
        }, 3000);
      } catch (error) {
        console.error('Paystack initialization error:', error);
        toast.error('Failed to initialize payment. Please try again.');
        setIsProcessing(false);
        setPaymentStarted(false);
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Failed to start payment process');
      setIsProcessing(false);
      setPaymentStarted(false);
    }
  }, [isProcessing, isValidating, paymentStarted, totalAmount, user, validateCartItems, cartItems, producerId, beatId, splitCode, clearCart]);

  // Handle cart refresh
  const handleRefreshCart = async () => {
    setValidationError(null);
    await validateCartItems();
  };

  // Force cancel payment
  const forceCancel = () => {
    setIsProcessing(false);
    setPaymentStarted(false);
    setValidationError(null);
    localStorage.removeItem('paymentInProgress');
    localStorage.removeItem('pendingOrderId');
    localStorage.removeItem('paystackReference');
    localStorage.removeItem('orderItems');
    
    if (paymentTimeoutRef.current) {
      clearTimeout(paymentTimeoutRef.current);
      paymentTimeoutRef.current = null;
    }
    
    if (paystackHandlerRef.current && typeof paystackHandlerRef.current.close === 'function') {
      try {
        paystackHandlerRef.current.close();
      } catch (err) {
        console.error('Error closing Paystack iframe:', err);
      }
      paystackHandlerRef.current = null;
    }
    
    onClose();
    toast.info('Payment canceled');
  };

  return {
    isProcessing,
    isValidating,
    validationError,
    handlePaymentStart,
    handleRefreshCart,
    forceCancel,
    paymentStarted
  };
}
