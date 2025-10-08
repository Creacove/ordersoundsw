
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
    
    // Separate beats and soundpacks
    const beatItems = cartItems.filter((item: any) => item.itemType === 'beat');
    const soundpackItems = cartItems.filter((item: any) => item.itemType === 'soundpack');
    
    // Validate beats
    if (beatItems.length > 0) {
      const beatIds = beatItems.map((item: any) => item.itemId);
      
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
      const soundpackIds = soundpackItems.map((item: any) => item.itemId);
      
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
    return { error: error.message };
  }
};

export const createOrder = async (user: any, totalAmount: number, orderItemsData: any[]) => {
  try {
    console.log('Creating order with items:', orderItemsData);
    
    if (!user || !user.id) {
      throw new Error('User not authenticated. Please sign in.');
    }
    
    console.log('Creating order for user ID:', user.id);
    
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !sessionData.session) {
      console.error('Session validation failed:', sessionError);
      throw new Error('Authentication session expired. Please refresh and try again.');
    }
    
    console.log('Session validated, user authenticated:', sessionData.session.user.id);
    
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
    
    // Separate beats and soundpacks
    const beatItems = orderItemsData.filter(item => item.item_type === 'beat');
    const soundpackItems = orderItemsData.filter(item => item.item_type === 'soundpack');
    
    // Insert beat line items
    if (beatItems.length > 0) {
      const lineItems = beatItems.map(item => ({
        order_id: insertedOrder.id,
        beat_id: item.beat_id || item.item_id,
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
      
      console.log('Beat line items created successfully');
    }
    
    // Note: Soundpack purchases will be created in the verification edge function
    // We don't create them here to avoid duplication
    
    return { orderId: insertedOrder.id };
  } catch (error) {
    console.error('Order creation error:', error);
    return { error: error.message };
  }
};

export const verifyPaystackPayment = async (paymentReference: string, orderId: string, orderItems: OrderItem[]) => {
  try {
    console.log('Payment success, verifying with backend...', paymentReference, orderId);
    
    const verificationToastId = `payment-verification-${paymentReference}`;
    toast.loading('Verifying payment...', { id: verificationToastId });
    
    // Remove test mode detection - now all payments are live
    
    // Get current session to ensure user is logged in before proceeding.
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !sessionData.session) {
      console.error('Session validation failed before edge function call:', sessionError);
      toast.dismiss(verificationToastId);
      toast.error('Authentication session expired. Please refresh and try again.');
      return { success: false, error: 'Authentication required' };
    }
    
    console.log('Calling verify-paystack-payment edge function...');
    
    const requestPayload = { 
      reference: paymentReference, 
      orderId,
      orderItems
      // Removed isTestMode - all payments are now live
    };
    
    console.log('Request payload before sending:', requestPayload);
    
    if (!paymentReference || !orderId || !orderItems) {
      console.error('Missing required fields in request payload');
      toast.dismiss(verificationToastId);
      toast.error('Invalid payment data. Please try again.');
      return { success: false, error: 'Invalid payment data' };
    }
    
    // The Supabase client will automatically handle JSON stringification and add the necessary headers
    const { data, error } = await supabase.functions.invoke('verify-paystack-payment', {
      body: requestPayload 
    });
    
    toast.dismiss(verificationToastId);
    
    if (error) {
      console.error('Verification error from edge function:', error);
      console.error('Full error details:', {
        message: error.message,
        // @ts-ignore
        details: error.details,
        // @ts-ignore
        hint: error.hint,
        // @ts-ignore
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
  } catch (error: any) {
    console.error('Payment verification exception:', error);
    toast.dismiss(`payment-verification-${paymentReference}`);
    toast.error(`Transaction could not be completed. Please contact support with reference: ${paymentReference}`);
    return { success: false, error: error.message };
  }
};
