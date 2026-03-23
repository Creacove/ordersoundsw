import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { publicEnv } from '@/config/publicEnv';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { useCartWithBeatDetailsOptimized } from '@/hooks/useCartWithBeatDetailsOptimized';
import { supabase } from '@/integrations/supabase/client';
import { buildCheckoutLineItems } from '@/features/checkout/cartCheckout';
import {
  clearPaymentSession,
  getStoredPaymentSession,
  markPurchaseSuccess,
  persistPaymentSession,
} from '@/lib/paymentFlowStorage';
import { createOrder, verifyPaystackPayment } from '@/utils/payment/paystackUtils';

declare global {
  interface Window {
    PaystackPop?: {
      setup: (config: PaystackConfig) => PaystackHandler;
    };
  }
}

interface PaystackCallbackResponse {
  reference: string;
}

interface PaystackHandler {
  close?: () => void;
  openIframe: () => void;
}

interface PaystackConfig {
  amount: number;
  callback: (response: PaystackCallbackResponse) => void;
  container?: undefined;
  currency: string;
  email: string;
  key: string;
  label: string;
  metadata: {
    custom_fields: Array<{
      display_name: string;
      value: string;
      variable_name: string;
    }>;
  };
  onClose: () => void;
  ref: string;
  split_code?: string;
}

interface UsePaystackCheckoutProps {
  onSuccess: (reference: string) => void;
  onClose: () => void;
  totalAmount: number;
  producerId?: string;
  beatId?: string;
}

interface OrderItem {
  item_type: 'beat' | 'soundpack';
  license: string;
  license_type?: string;
  price: number;
  producer_id?: string;
  product_id: string;
  title: string;
}

const PAYSTACK_PUBLIC_KEY = publicEnv.paystackPublicKey;

export function usePaystackCheckout({
  onSuccess,
  onClose,
  totalAmount,
  producerId,
  beatId,
}: UsePaystackCheckoutProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [paymentStarted, setPaymentStarted] = useState(false);
  const { user } = useAuth();
  const { cartItems, clearCart } = useCartWithBeatDetailsOptimized();
  const checkoutLineItems = useMemo(
    () => buildCheckoutLineItems(cartItems, 'NGN'),
    [cartItems],
  );
  const paymentTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const paystackHandlerRef = useRef<PaystackHandler | null>(null);

  // Create function references for Paystack callbacks
  const paystackCloseRef = useRef(() => {
    console.log('Payment window closed');
    setIsProcessing(false);
    setPaymentStarted(false);
    clearPaymentSession();

    if (paymentTimeoutRef.current) {
      clearTimeout(paymentTimeoutRef.current);
      paymentTimeoutRef.current = null;
    }

    onClose();
  });

  // Function to handle successful payments
  const paystackSuccessRef = useRef((response: PaystackCallbackResponse) => {
    console.log('Payment complete! Response:', response);

    if (paymentTimeoutRef.current) {
      clearTimeout(paymentTimeoutRef.current);
      paymentTimeoutRef.current = null;
    }

    const handleSuccess = async () => {
      try {
        const { orderId, orderItems } = getStoredPaymentSession<OrderItem>();

        if (!orderId || orderItems.length === 0) {
          toast.error('Order information missing. Please try again.');
          setIsProcessing(false);
          setPaymentStarted(false);
          return;
        }

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
          markPurchaseSuccess();
          clearPaymentSession();
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
          orderItems
        );

        // Dismiss the loading toast
        toast.dismiss('payment-verification');

        if (verificationResult.success) {
          clearCart();
          markPurchaseSuccess();
          clearPaymentSession();
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

  // Fetch producer's split code from database
  const fetchProducerSplitCode = async (producerId: string): Promise<string | null> => {
    try {
      console.log('Fetching split code for producer:', producerId);

      const { data, error } = await supabase
        .from('users')
        .select('paystack_split_code')
        .eq('id', producerId)
        .eq('role', 'producer')
        .maybeSingle();

      if (error) {
        console.error('Error fetching producer split code:', error);
        return null;
      }

      const splitCode = data?.paystack_split_code || null;
      console.log('Retrieved split code:', splitCode ? `SPL_${splitCode.substring(0, 8)}...` : 'none');

      return splitCode;
    } catch (error) {
      console.error('Exception fetching producer split code:', error);
      return null;
    }
  };

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

      const beatItems = checkoutLineItems.filter((item) => item.type === 'beat');
      const soundpackItems = checkoutLineItems.filter((item) => item.type === 'soundpack');

      if (beatItems.length > 0) {
        const beatIds = beatItems.map((item) => item.productId);
        const { data: beatsData, error: beatsError } = await supabase
          .from('beats')
          .select('id, status')
          .in('id', beatIds);

        if (beatsError || !beatsData) {
          console.error('Error validating beats:', beatsError);
          setValidationError('Failed to validate your beat purchases');
          return false;
        }

        const availableBeats = beatsData.filter((beat) => beat.status === 'published');
        if (availableBeats.length !== beatIds.length) {
          setValidationError('Some beats in your cart are no longer available');
          return false;
        }

        const { data: purchasedBeats, error: purchasedBeatsError } = await supabase
          .from('user_purchased_beats')
          .select('beat_id')
          .eq('user_id', user.id)
          .in('beat_id', beatIds);

        if (purchasedBeatsError) {
          console.error('Error checking purchased beats:', purchasedBeatsError);
          setValidationError('Failed to validate your previous beat purchases');
          return false;
        }

        if (purchasedBeats && purchasedBeats.length > 0) {
          const alreadyPurchasedTitles = beatItems
            .filter((item) => purchasedBeats.some((purchase) => purchase.beat_id === item.productId))
            .map((item) => item.title);

          setValidationError(`You've already purchased: ${alreadyPurchasedTitles.join(', ')}`);
          return false;
        }
      }

      if (soundpackItems.length > 0) {
        const soundpackIds = soundpackItems.map((item) => item.productId);
        const { data: soundpacksData, error: soundpacksError } = await supabase
          .from('soundpacks')
          .select('id, published')
          .in('id', soundpackIds);

        if (soundpacksError || !soundpacksData) {
          console.error('Error validating soundpacks:', soundpacksError);
          setValidationError('Failed to validate your soundpack purchases');
          return false;
        }

        const publishedSoundpacks = soundpacksData.filter((soundpack) => soundpack.published);
        if (publishedSoundpacks.length !== soundpackIds.length) {
          setValidationError('Some soundpacks in your cart are no longer available');
          return false;
        }

        const { data: purchasedSoundpacks, error: purchasedSoundpacksError } = await supabase
          .from('user_purchased_soundpacks')
          .select('pack_id')
          .eq('user_id', user.id)
          .in('pack_id', soundpackIds);

        if (purchasedSoundpacksError) {
          console.error('Error checking purchased soundpacks:', purchasedSoundpacksError);
          setValidationError('Failed to validate your previous soundpack purchases');
          return false;
        }

        if (purchasedSoundpacks && purchasedSoundpacks.length > 0) {
          const alreadyPurchasedTitles = soundpackItems
            .filter((item) =>
              purchasedSoundpacks.some((purchase) => purchase.pack_id === item.productId),
            )
            .map((item) => item.title);

          setValidationError(`You've already purchased: ${alreadyPurchasedTitles.join(', ')}`);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Cart validation error:', error);
      setValidationError('An error occurred while validating your cart');
      return false;
    } finally {
      setIsValidating(false);
    }
  }, [user, cartItems, producerId, beatId, checkoutLineItems]);

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

      if (!PAYSTACK_PUBLIC_KEY) {
        toast.error('Payment gateway is not configured. Please contact support.');
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

      const cartProducerIds = Array.from(
        new Set(checkoutLineItems.map((item) => item.producerId).filter(Boolean)),
      );
      const hasSingleProducerCart = cartProducerIds.length <= 1;

      // Determine the producer ID for split code fetching.
      let targetProducerId = producerId;
      if (!targetProducerId && hasSingleProducerCart) {
        targetProducerId = cartProducerIds[0];
      }

      // Fetch split code if producer ID is available
      let dynamicSplitCode: string | null = null;

      if (!producerId && !hasSingleProducerCart) {
        console.warn(
          'Skipping Paystack split code because the cart contains items from multiple producers.',
        );
        toast.info('This cart contains multiple producers, so automatic Paystack split routing has been skipped for this order.');
      } else if (targetProducerId) {
        const fetchedSplitCode = await fetchProducerSplitCode(targetProducerId);
        if (fetchedSplitCode) {
          dynamicSplitCode = fetchedSplitCode;
          console.log('Using fetched split code for payment');
        } else {
          console.log('No split code found, proceeding without split');
        }
      }

      // Generate a unique reference ID
      const reference = `ORDER_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;

      // Prepare order item data
      let orderItemsData: OrderItem[];

      if (producerId && beatId) {
        // Direct beat purchase
        const { data: beatData, error: beatError } = await supabase
          .from('beats')
          .select('id, producer_id, title, basic_license_price_local')
          .eq('id', beatId)
          .maybeSingle();

        if (beatError || !beatData) {
          toast.error('Failed to fetch beat details. Please try again.');
          setIsProcessing(false);
          return;
        }

        orderItemsData = [{
          item_type: 'beat',
          license: 'basic',
          license_type: 'basic',
          price: beatData.basic_license_price_local,
          producer_id: beatData.producer_id,
          product_id: beatData.id,
          title: beatData.title,
        }];
      } else {
        if (checkoutLineItems.length !== cartItems.length) {
          toast.error('Some cart items could not be prepared for checkout. Please refresh your cart.');
          setIsProcessing(false);
          return;
        }

        if (checkoutLineItems.some((item) => item.price <= 0)) {
          toast.error('One or more cart items have invalid pricing. Please review your cart.');
          setIsProcessing(false);
          return;
        }

        orderItemsData = checkoutLineItems.map((item) => ({
          item_type: item.type,
          license: item.licenseType || 'basic',
          license_type: item.licenseType || 'basic',
          price: item.price,
          producer_id: item.producerId,
          product_id: item.productId,
          title: item.title,
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

      // Update order with split code if available
      if (dynamicSplitCode) {
        console.log('Updating order with split code');
        const { error: updateError } = await supabase
          .from('orders')
          .update({ split_code: dynamicSplitCode })
          .eq('id', orderId);

        if (updateError) {
          console.error('Error updating order with split code:', updateError);
          // Don't fail the payment, just log the error
        }
      }

      // Store order data for verification
      persistPaymentSession({
        orderId,
        orderItems: orderItemsData,
        reference,
      });

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

      console.log('Starting Paystack payment in LIVE mode');
      console.log('Split code status:', dynamicSplitCode ? 'INCLUDED' : 'NOT_INCLUDED');

      try {
        // Create Paystack handler - popup mode
        const paystackConfig: PaystackConfig = {
          key: PAYSTACK_PUBLIC_KEY,
          email: user?.email || '',
          amount: totalAmount * 100,
          currency: 'NGN',
          ref: reference,
          label: 'OrderSOUNDS',
          metadata: metadata,
          onClose: paystackCloseRef.current,
          callback: paystackSuccessRef.current,
          container: undefined,
        };

        if (dynamicSplitCode) {
          paystackConfig.split_code = dynamicSplitCode;
          console.log('Added split code to Paystack configuration');
        }

        const handler = window.PaystackPop.setup(paystackConfig);
        paystackHandlerRef.current = handler;

        // Open popup FIRST, then set paymentStarted.
        // This prevents the blank-page flash.
        handler.openIframe();
        setPaymentStarted(true);

      } catch (error) {
        console.error('Paystack initialization error:', error);
        toast.error('Failed to initialize payment. Please try again.');
        setIsProcessing(false);
        setPaymentStarted(false);
        clearPaymentSession();
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Failed to start payment process');
      setIsProcessing(false);
      setPaymentStarted(false);
      clearPaymentSession();
    }
  }, [isProcessing, isValidating, paymentStarted, totalAmount, user, validateCartItems, cartItems, checkoutLineItems, producerId, beatId]);

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
    clearPaymentSession();

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
