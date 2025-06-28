
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface OrderItem {
  beat_id: string;
  title: string;
  price: number;
  license: string;
}

export const validateCartItems = async (user: any, cartItems: any[]) => {
  try {
    if (!user) {
      throw new Error('You must be logged in to complete this purchase.');
    }
    
    if (cartItems.length === 0) {
      throw new Error('Your cart is empty. Add items before checkout.');
    }
    
    const beatIds = cartItems.map(item => item.beat.id);
    
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
    
    return true;
  } catch (error) {
    console.error('Cart validation error:', error);
    return { error: error.message };
  }
};

export const createOrder = async (user: any, totalAmount: number, orderItemsData: any[]) => {
  try {
    console.log('Creating order with items:', orderItemsData);
    
    if (!user || !user.id) {
      throw new Error('User not authenticated. Please sign in.');
    }
    
    // Verify the user has an id
    console.log('Creating order for user ID:', user.id);
    
    // Get current session to ensure we have valid auth
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !sessionData.session) {
      console.error('Session validation failed:', sessionError);
      throw new Error('Authentication session expired. Please refresh and try again.');
    }
    
    console.log('Session validated, user authenticated:', sessionData.session.user.id);
    
    // Create an order record with explicit user context
    const orderData = {
      buyer_id: user.id,
      total_price: totalAmount,
      payment_method: 'Paystack',
      status: 'pending',
      currency_used: 'NGN'
    };
    
    console.log('Inserting order with data:', orderData);
    
    const { data: insertedOrder, error: orderError } = await supabase
      .from('orders')
      .insert(orderData)
      .select('id')
      .single();
    
    if (orderError) {
      console.error('Order creation error:', orderError);
      console.error('Error details:', {
        message: orderError.message,
        details: orderError.details,
        hint: orderError.hint,
        code: orderError.code
      });
      throw new Error(`Order creation failed: ${orderError.message}`);
    }
    
    if (!insertedOrder || !insertedOrder.id) {
      throw new Error('Failed to create order: No order ID returned');
    }
    
    console.log('Order created with ID:', insertedOrder.id);
    
    // Create line items for each beat in the cart
    const lineItems = orderItemsData.map(item => ({
      order_id: insertedOrder.id,
      beat_id: item.beat_id,
      price_charged: item.price,
      currency_code: 'NGN',
    }));
    
    const { error: lineItemError } = await supabase
      .from('line_items')
      .insert(lineItems);
    
    if (lineItemError) {
      console.error('Line items error:', lineItemError);
      throw new Error(`Line items creation failed: ${lineItemError.message}`);
    }
    
    console.log('Line items created successfully');
    
    return { orderId: insertedOrder.id };
  } catch (error) {
    console.error('Order creation error:', error);
    return { error: error.message };
  }
};

export const verifyPaystackPayment = async (paymentReference: string, orderId: string, orderItems: OrderItem[]) => {
  try {
    console.log('Payment success, verifying with backend...', paymentReference, orderId);
    
    // Show loading toast - use a unique ID based on reference to prevent duplicate toasts
    const verificationToastId = `payment-verification-${paymentReference}`;
    toast.loading('Verifying payment...', { id: verificationToastId });
    
    // Force success in test mode for specific test references
    const isTestReference = paymentReference.startsWith('ORDER_');
    
    if (isTestReference) {
      console.log('Test reference detected, validating order data...');
      
      try {
        // First check if the order exists
        const { data: orderCheck, error: orderCheckError } = await supabase
          .from('orders')
          .select('status')
          .eq('id', orderId)
          .maybeSingle();
          
        if (orderCheckError) {
          console.error('Error checking order:', orderCheckError);
          toast.dismiss(verificationToastId);
          toast.error('Could not verify order data. Please try again.');
          return { success: false, error: 'Order verification failed' };
        }
        
        if (!orderCheck) {
          console.error('Order not found:', orderId);
          toast.dismiss(verificationToastId);
          toast.error('Order details not found. Please try again.');
          return { success: false, error: 'Order not found' };
        }
      } catch (checkError) {
        console.error('Order check error:', checkError);
        toast.dismiss(verificationToastId);
        toast.error('Error during payment verification. Please try again.');
        return { success: false, error: 'Order check failed' };
      }
    }
    
    // Get current session for authorization headers
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !sessionData.session) {
      console.error('Session validation failed before edge function call:', sessionError);
      toast.dismiss(verificationToastId);
      toast.error('Authentication session expired. Please refresh and try again.');
      return { success: false, error: 'Authentication required' };
    }
    
    console.log('Calling verify-paystack-payment edge function with auth headers...');
    
    // Create payload - DON'T stringify it as invoke() handles JSON conversion internally
    const requestPayload = { 
      reference: paymentReference, 
      orderId,
      orderItems,
      isTestMode: isTestReference
    };
    
    console.log('Request payload before sending:', requestPayload);
    
    // Ensure all required fields are present
    if (!paymentReference || !orderId || !orderItems) {
      console.error('Missing required fields in request payload');
      toast.dismiss(verificationToastId);
      toast.error('Invalid payment data. Please try again.');
      return { success: false, error: 'Invalid payment data' };
    }
    
    // Call the verification edge function - Pass payload as object, NOT stringified
    const { data, error } = await supabase.functions.invoke('verify-paystack-payment', {
      body: requestPayload, // Pass as plain object, not JSON.stringify()
      headers: {
        'Authorization': `Bearer ${sessionData.session.access_token}`,
        'Content-Type': 'application/json'
      }
    });
    
    // Always dismiss the loading toast
    toast.dismiss(verificationToastId);
    
    if (error) {
      console.error('Verification error from edge function:', error);
      console.error('Full error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      toast.error(`Payment could not be verified. ${error.message || 'Please try again later.'}`);
      return { success: false, error: error.message };
    }
    
    console.log('Verification response:', data);
    
    if (data && data.verified) {
      console.log('Payment successfully verified by edge function');
      return { success: true };
    } else {
      const errorMsg = data?.message || 'Payment verification failed';
      console.error('Payment verification failed:', errorMsg);
      toast.error(`Payment could not be completed. Please try again or contact support with reference: ${paymentReference}`);
      return { success: false, error: errorMsg };
    }
  } catch (error) {
    console.error('Payment verification exception:', error);
    toast.dismiss(`payment-verification-${paymentReference}`);
    toast.error(`Transaction could not be completed. Please contact support with reference: ${paymentReference}`);
    return { success: false, error: error.message };
  }
};
