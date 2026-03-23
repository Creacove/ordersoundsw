
import { supabase } from '@/integrations/supabase/client';
import { createPendingOrder } from '@/features/checkout/orderService';
import { toast } from 'sonner';

interface OrderItem {
  item_type: 'beat' | 'soundpack';
  license: string;
  license_type?: string;
  price: number;
  producer_id?: string;
  product_id: string;
  title: string;
}

interface CartValidationUser {
  id: string;
}

interface CheckoutCartItem {
  itemId: string;
  itemType: 'beat' | 'soundpack';
}

interface OrderCreationItem {
  license_type?: string;
  item_type?: 'beat' | 'soundpack';
  item_id?: string;
  price: number;
  producer_id?: string;
  product_id?: string;
  soundpack_id?: string;
  title?: string;
}

interface FunctionErrorLike {
  code?: string;
  details?: string;
  hint?: string;
  message: string;
}

interface VerifyPaystackResponse {
  message?: string;
  verified?: boolean;
}

function getErrorMessage(error: unknown, fallback = 'Unknown error') {
  return error instanceof Error ? error.message : fallback;
}

export const validateCartItems = async (user: CartValidationUser | null, cartItems: CheckoutCartItem[]) => {
  try {
    if (!user) {
      throw new Error('You must be logged in to complete this purchase.');
    }

    if (cartItems.length === 0) {
      throw new Error('Your cart is empty. Add items before checkout.');
    }

    // Separate beats and soundpacks
    const beatItems = cartItems.filter((item) => item.itemType === 'beat');
    const soundpackItems = cartItems.filter((item) => item.itemType === 'soundpack');

    // Validate beats
    if (beatItems.length > 0) {
      const beatIds = beatItems.map((item) => item.itemId);

      const { data: beatsExist, error: beatCheckError } = await supabase
        .from('beats')
        .select('id, producer_id')
        .in('id', beatIds);

      if (beatCheckError) {
        console.error('Error checking beats existence:', beatCheckError);
        throw new Error(`Failed to validate beats: ${beatCheckError.message}`);
      }

      if (!beatsExist || beatsExist.length !== beatIds.length) {
        const existingIds = beatsExist?.map(b => b.id) || [];
        const missingIds = beatIds.filter(id => !existingIds.includes(id));

        console.error('Some beats in cart no longer exist:', missingIds);
        throw new Error('Some items in your cart are no longer available. Please refresh your cart.');
      }
    }

    // Validate soundpacks
    if (soundpackItems.length > 0) {
      const soundpackIds = soundpackItems.map((item) => item.itemId);

      const { data: soundpacksExist, error: soundpackCheckError } = await supabase
        .from('soundpacks')
        .select('id, producer_id, published')
        .in('id', soundpackIds)
        .eq('published', true);

      if (soundpackCheckError) {
        console.error('Error checking soundpacks existence:', soundpackCheckError);
        throw new Error(`Failed to validate soundpacks: ${soundpackCheckError.message}`);
      }

      if (!soundpacksExist || soundpacksExist.length !== soundpackIds.length) {
        const existingIds = soundpacksExist?.map(s => s.id) || [];
        const missingIds = soundpackIds.filter(id => !existingIds.includes(id));

        console.error('Some soundpacks in cart no longer exist:', missingIds);
        throw new Error('Some soundpacks in your cart are no longer available. Please refresh your cart.');
      }
    }

    return true;
  } catch (error) {
    console.error('Cart validation error:', error);
    return { error: getErrorMessage(error) };
  }
};

export const createOrder = async (
  user: CartValidationUser | null,
  totalAmount: number,
  orderItemsData: OrderCreationItem[],
) => {
  try {
    if (!user || !user.id) {
      throw new Error('User not authenticated. Please sign in.');
    }

    const { orderId } = await createPendingOrder({
      currencyUsed: 'NGN',
      items: orderItemsData.map(item => ({
        licenseType: item.license_type ?? 'basic',
        price: item.price,
        producerId: item.producer_id || '',
        productId: item.product_id || item.item_id || item.soundpack_id,
        productType: item.item_type || 'beat',
        quantity: 1,
        title: item.title || 'Product',
      })),
      paymentMethod: 'Paystack',
      totalPrice: totalAmount,
    });

    return { orderId };
  } catch (error) {
    console.error('Order creation error:', error);
    return { error: getErrorMessage(error) };
  }
};

export const verifyPaystackPayment = async (paymentReference: string, orderId: string, orderItems: OrderItem[]) => {
  try {
    console.log('Payment success, verifying with backend...', paymentReference, orderId);

    // NOTE: Toast is handled by usePaystackCheckout.ts - don't duplicate here

    // Get current session to ensure user is logged in before proceeding.
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !sessionData.session) {
      console.error('Session validation failed before edge function call:', sessionError);
      return { success: false, error: 'Authentication required' };
    }

    console.log('Calling verify-paystack-payment edge function...');

    const requestPayload = {
      reference: paymentReference,
      orderId,
      orderItems
    };

    console.log('Request payload before sending:', requestPayload);

    if (!paymentReference || !orderId || !orderItems) {
      console.error('Missing required fields in request payload');
      return { success: false, error: 'Invalid payment data' };
    }

    const { data, error } = await supabase.functions.invoke<VerifyPaystackResponse>('verify-paystack-payment', {
      body: requestPayload
    });

    if (error) {
      const functionError = error as FunctionErrorLike;
      console.error('Verification error from edge function:', error);
      console.error('Full error details:', {
        message: functionError.message,
        details: functionError.details,
        hint: functionError.hint,
        code: functionError.code
      });
      return { success: false, error: error.message };
    }

    console.log('Verification response:', data);

    if (data && data.verified) {
      console.log('Payment successfully verified by edge function');
      return { success: true };
    } else {
      const errorMsg = data?.message || 'Payment verification failed';
      console.error('Payment verification failed:', errorMsg);
      return { success: false, error: errorMsg };
    }
  } catch (error) {
    console.error('Payment verification exception:', error);
    return { success: false, error: getErrorMessage(error) };
  }
};
