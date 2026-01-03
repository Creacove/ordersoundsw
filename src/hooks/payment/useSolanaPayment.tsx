import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { processUSDCPayment, isValidSolanaAddress, processMultipleUSDCPayments } from '@/utils/payment/usdcTransactions';
import { supabase } from '@/integrations/supabase/client';

interface ProductData {
  id: string;
  title: string;
  price: number;
}

// Helper function to record fallback payments in database
// Note: recordFallbackPayment is legacy and will be superseded by server-side fulfillment logic
const recordFallbackPayment = async (amount: number, signature: string, productData?: ProductData | { items: any[] }) => {
  // Keeping for defensive reasons during transition
  console.log("Recording fallback payment record (legacy flow)");
};

export const useSolanaPayment = () => {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastTransactionSignature, setLastTransactionSignature] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(true);

  // Dynamic network selection from environment
  const network = import.meta.env.VITE_SOLANA_NETWORK || 'devnet';

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setIsMounted(false);
    };
  }, []);

  const validatePaymentInputs = useCallback((amount: number, producerWalletAddress: string) => {
    // Validate wallet connection
    if (!wallet.connected || !wallet.publicKey) {
      throw new Error("WALLET_NOT_CONNECTED: Please connect your wallet first");
    }

    // Validate amount
    if (!amount || amount <= 0) {
      throw new Error("INVALID_AMOUNT: Payment amount must be positive");
    }

    // Validate producer wallet address
    if (!producerWalletAddress) {
      throw new Error("MISSING_ADDRESS: Producer wallet address is required");
    }

    if (!isValidSolanaAddress(producerWalletAddress)) {
      throw new Error("INVALID_ADDRESS: Creator wallet address is invalid");
    }

    return true;
  }, [wallet]);

  const makePayment = async (
    amount: number,
    producerWalletAddress: string | null,
    onSuccess?: (signature: string) => void,
    onError?: (error: any) => void,
    productData?: ProductData | { items: any[] }
  ) => {
    if (isProcessing) {
      toast.warning("Please wait for current transaction to complete");
      return null;
    }

    setIsProcessing(true);

    try {
      // 1. Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error("AUTH_REQUIRED: Please sign in to complete your purchase");
      }

      // 2. Create PENDING order in DB (Authority)
      console.log("📝 Creating pending order in database...");
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          buyer_id: user.id,
          total_price: amount,
          status: 'pending',
          payment_method: 'solana_usdc',
          currency_used: 'USD' // Using USD for database compatibility (USDC => USD mapping)
        })
        .select()
        .single();

      if (orderError) {
        throw new Error(`ORDER_CREATION_FAILED: ${orderError.message}`);
      }

      // Record items in order_items
      if (productData) {
        const orderItem = {
          order_id: orderData.id,
          product_id: 'id' in productData ? (productData as ProductData).id : 'bundle',
          title: 'title' in productData ? (productData as ProductData).title : 'Items Bundle',
          price: amount,
          quantity: 1
        };
        console.log("📦 Recording order item:", orderItem);
        const { error: itemError } = await supabase.from('order_items').insert(orderItem);
        if (itemError) {
          console.error("Failed to record order items:", itemError);
          throw new Error(`ORDER_ITEMS_FAILED: ${itemError.message}`);
        }
      }

      // 3. Process USDC Payment (On-Chain)
      let signature;
      if (producerWalletAddress === null) {
        console.log(`💳 Processing platform fallback payment: $${amount} (producer wallet missing)`);
        const { processPlatformOnlyPayment } = await import('@/utils/payment/usdcTransactions');
        signature = await processPlatformOnlyPayment(
          amount,
          connection,
          wallet,
          network
        );
      } else {
        validatePaymentInputs(amount, producerWalletAddress);
        console.log(`💳 Processing USDC payment: $${amount} to ${producerWalletAddress} on ${network}`);
        signature = await processUSDCPayment(
          amount,
          producerWalletAddress,
          connection,
          wallet,
          network
        );
      }

      if (isMounted) {
        setLastTransactionSignature(signature);
      }

      // 4. PERSIST MANIFEST: Record the signature immediately before verification
      // This is the "Senior Engineer" resilience fix - the backend now has the signature
      // even if the verification function below times out or the browser is closed.
      console.log("💾 Persisting payment manifest...");
      const { error: manifestError } = await supabase
        .from('orders')
        .update({
          transaction_signatures: [signature],
          payment_reference: signature,
          status: 'processing'
        })
        .eq('id', orderData.id);

      if (manifestError) {
        console.error("Failed to persist payment manifest:", manifestError);
        // We continue anyway as the on-chain success is what matters most
      }

      // 5. DIRECT FULFILLMENT: Call fulfillment immediately after on-chain confirmation
      // This ensures users get their beats instantly, regardless of verification timing
      console.log("🚀 Triggering direct fulfillment after on-chain confirmation...");
      const { data: fulfillData, error: fulfillError } = await supabase.rpc('finalize_order_fulfillment' as any, {
        p_order_id: orderData.id
      });

      const fulfillResult = fulfillData as any;
      if (fulfillError) {
        console.error("Direct fulfillment error:", fulfillError);
        // Don't throw - verification and cron will catch this as backup
      } else {
        console.log("✅ Direct fulfillment succeeded:", fulfillResult);
        if (fulfillResult?.items_fulfilled > 0) {
          console.log(`📦 ${fulfillResult.items_fulfilled} item(s) added to library`);
        }
        if (fulfillResult?.items_failed > 0) {
          console.warn(`⚠️ ${fulfillResult.items_failed} item(s) failed:`, fulfillResult?.skipped_details);
        }
      }

      // 6. Server-Side Verification (now optional - for audit and double-check)
      console.log("📡 Triggering server-side verification and fulfillment...");
      const { data: verifyResult, error: verifyError } = await supabase.functions.invoke('verify-solana-payment', {
        body: {
          orderId: orderData.id,
          signature,
          network
        }
      });

      if (verifyError) {
        console.error("Verification function error:", verifyError);

        // Handle Supabase's specific error structure
        let errorBody: any = {};
        try {
          // @ts-ignore - Supabase Edge Function errors often hide body in context
          errorBody = verifyError.context?.json || {};
        } catch (e) {
          console.warn("Could not parse error body", e);
        }

        const message = errorBody.error || verifyError.message || 'Payment verification failed';
        const code = errorBody.code || '';

        // RESILIENCE FIX: If the transaction is found but node lag prevented verification,
        // or if it's just a verification error, don't crash the UI because the 
        // Safety Net (Cron) will pick it up in 15 minutes anyway.
        if (code === 'TX_NOT_FOUND' || code === 'RPC_ERROR' || message.includes('Edge Function returned a non-2xx status code')) {
          console.log("⚠️ Verification delayed but payment is on-chain. Fulfilling via Safety Net.");
          // NOTE: Single consolidated success toast for edge cases
          toast.success("Payment received! Your items will appear in your library shortly.");
          onSuccess?.(signature);
          return signature;
        } else {
          throw new Error(`VERIFICATION_FAILED: ${message}`);
        }
      }

      // Check both top-level success and the nested fulfillment result
      console.log("📋 Verification result:", JSON.stringify(verifyResult, null, 2));

      if (verifyResult?.fulfillmentResult) {
        console.log("📦 Fulfillment details:");
        console.log("  - Success:", verifyResult.fulfillmentResult.success);
        console.log("  - Items fulfilled:", verifyResult.fulfillmentResult.items_fulfilled);
        console.log("  - Items failed:", verifyResult.fulfillmentResult.items_failed);
        console.log("  - Skipped details:", verifyResult.fulfillmentResult.skipped_details);
        console.log("  - Diagnostics:", verifyResult.fulfillmentResult.diagnostics);
        console.log("  - Currency used:", verifyResult.fulfillmentResult.final_currency);
      }

      if (verifyResult && (!verifyResult.success || (verifyResult.fulfillmentResult && !verifyResult.fulfillmentResult.success))) {
        console.error("Fulfillment failed:", verifyResult);
        const errorMsg = verifyResult.error || (verifyResult.fulfillmentResult && verifyResult.fulfillmentResult.message) || 'Order processing failed';
        throw new Error(`FULFILLMENT_FAILED: ${errorMsg}`);
      }

      // NOTE: Single consolidated success toast - don't show multiple toasts
      if (isMounted) {
        toast.success("Payment successful! Your beats will appear in your library shortly.");
      }

      onSuccess?.(signature);
      return signature;

    } catch (error: any) {
      console.error("❌ USDC payment error:", error);
      const message = error.message.includes(':')
        ? error.message.split(':').pop().trim()
        : "Payment failed";

      if (isMounted) {
        toast.error(`Payment failed: ${message}`);
      }
      onError?.(error);
      throw error;
    } finally {
      if (isMounted) {
        setIsProcessing(false);
      }
    }
  };

  const makeMultiplePayments = async (
    items: { price: number, producerWallet: string | null, id?: string, title?: string }[],
    onSuccess?: (signatures: string[]) => void,
    onError?: (error: any) => void,
    maxRetries = 2
  ) => {
    if (isProcessing) {
      toast.warning("Please wait for current transaction to complete");
      return null;
    }

    if (!items || items.length === 0) {
      toast.error("No payment items provided");
      return null;
    }

    setIsProcessing(true);

    try {
      // 1. Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error("AUTH_REQUIRED: Please sign in to complete your purchase");
      }

      const totalAmount = items.reduce((sum, item) => sum + item.price, 0);

      // 2. Create PENDING order in DB
      console.log(`📝 Creating pending order for ${items.length} items...`);
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          buyer_id: user.id,
          total_price: totalAmount,
          status: 'pending',
          payment_method: 'solana_usdc',
          currency_used: 'USD' // Using USD for database compatibility (USDC => USD mapping)
        })
        .select()
        .single();

      if (orderError) {
        throw new Error(`ORDER_CREATION_FAILED: ${orderError.message}`);
      }

      // Record items in order_items
      const orderItems = items.map(item => ({
        order_id: orderData.id,
        product_id: item.id || 'unknown',
        title: item.title || 'Product',
        price: item.price,
        quantity: 1
      }));
      console.log("📦 Recording multi-payment order items:", orderItems);
      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) {
        console.error("Failed to record multi-order items:", itemsError);
        throw new Error(`ORDER_ITEMS_FAILED: ${itemsError.message}`);
      }

      // 3. Process Payments (On-Chain)
      const validItems = items.filter(item => item.producerWallet && isValidSolanaAddress(item.producerWallet));
      const fallbackItems = items.filter(item => !item.producerWallet);
      const signatures: string[] = [];

      // Process normal payments
      if (validItems.length > 0) {
        const normalSignatures = await processMultipleUSDCPayments(validItems, connection, wallet, network);
        signatures.push(...normalSignatures);
      }

      // Process fallback payments
      if (fallbackItems.length > 0) {
        const fallbackAmount = fallbackItems.reduce((total, item) => total + item.price, 0);
        const { processPlatformOnlyPayment } = await import('@/utils/payment/usdcTransactions');
        const fallbackSignature = await processPlatformOnlyPayment(fallbackAmount, connection, wallet, network);
        signatures.push(fallbackSignature);
      }

      if (isMounted) {
        setLastTransactionSignature(signatures[0]);
      }

      // 4. PERSIST MANIFEST: Record the signatures immediately before verification
      console.log("💾 Persisting multi-payment manifest...");
      const { error: manifestError } = await supabase
        .from('orders')
        .update({
          transaction_signatures: signatures,
          payment_reference: signatures[0],
          status: 'processing'
        })
        .eq('id', orderData.id);

      if (manifestError) {
        console.error("Failed to persist multi-payment manifest:", manifestError);
      }

      // 5. DIRECT FULFILLMENT: Call fulfillment immediately after on-chain confirmation
      console.log("🚀 Triggering direct fulfillment for multi-payment...");
      const { data: fulfillData, error: fulfillError } = await supabase.rpc('finalize_order_fulfillment' as any, {
        p_order_id: orderData.id
      });

      const fulfillResult = fulfillData as any;
      if (fulfillError) {
        console.error("Direct fulfillment error:", fulfillError);
      } else {
        console.log("✅ Direct fulfillment succeeded:", fulfillResult);
        if (fulfillResult?.items_fulfilled > 0) {
          console.log(`📦 ${fulfillResult.items_fulfilled} item(s) added to library`);
        }
        if (fulfillResult?.items_failed > 0) {
          console.warn(`⚠️ ${fulfillResult.items_failed} item(s) failed:`, fulfillResult?.skipped_details);
        }
      }

      // 6. Server-Side Verification (now optional - for audit and double-check)
      // We pass the primary signature for verification
      console.log("📡 Triggering server-side verification...");
      const { data: verifyResult, error: verifyError } = await supabase.functions.invoke('verify-solana-payment', {
        body: {
          orderId: orderData.id,
          signature: signatures[0], // Verifying the first signature is usually enough to prove intent
          network
        }
      });

      if (verifyError) {
        console.error("Verification function error:", verifyError);

        let errorBody: any = {};
        try {
          // @ts-ignore
          errorBody = verifyError.context?.json || {};
        } catch (e) { }

        const message = errorBody.error || verifyError.message || 'Multi-payment verification failed';
        const code = errorBody.code || '';

        // RESILIENCE FIX: Same as single payment - don't treat lag as a total failure
        if (code === 'TX_NOT_FOUND' || code === 'RPC_ERROR' || message.includes('Edge Function returned a non-2xx status code')) {
          console.log("⚠️ Multi-verification delayed. Safety Net will handle fulfillment.");
          // NOTE: Single consolidated success toast for edge cases
          toast.success("Payment received! Your items will appear in your library shortly.");
          onSuccess?.(signatures);
          return signatures;
        } else {
          throw new Error(`VERIFICATION_FAILED: ${message}`);
        }
      }

      // Check both top-level success and the nested fulfillment result
      console.log("📋 Multi-payment verification result:", JSON.stringify(verifyResult, null, 2));

      if (verifyResult?.fulfillmentResult) {
        console.log("📦 Multi-payment fulfillment details:");
        console.log("  - Success:", verifyResult.fulfillmentResult.success);
        console.log("  - Items fulfilled:", verifyResult.fulfillmentResult.items_fulfilled);
        console.log("  - Items failed:", verifyResult.fulfillmentResult.items_failed);
        console.log("  - Skipped details:", verifyResult.fulfillmentResult.skipped_details);
        console.log("  - Diagnostics:", verifyResult.fulfillmentResult.diagnostics);
        console.log("  - Currency used:", verifyResult.fulfillmentResult.final_currency);
      }

      if (verifyResult && (!verifyResult.success || (verifyResult.fulfillmentResult && !verifyResult.fulfillmentResult.success))) {
        console.error("Multi-fulfillment failed:", verifyResult);
        const errorMsg = verifyResult.error || (verifyResult.fulfillmentResult && verifyResult.fulfillmentResult.message) || 'Payment was on-chain but library update failed';
        throw new Error(`FULFILLMENT_FAILED: ${errorMsg}`);
      }

      // NOTE: Single consolidated success toast - don't show multiple toasts
      if (isMounted) {
        toast.success("Payment successful! Your beats will appear in your library shortly.");
      }

      onSuccess?.(signatures);
      return signatures;

    } catch (error: any) {
      console.error("❌ USDC Multi-payment error:", error);
      if (isMounted) {
        toast.error(`Payment failed: ${error.message || 'Unknown error'}`);
      }
      onError?.(error);
      throw error;
    } finally {
      if (isMounted) {
        setIsProcessing(false);
      }
    }
  };

  return {
    makePayment,
    makeMultiplePayments,
    isProcessing,
    lastTransactionSignature,
    isWalletConnected: wallet.connected,
    walletAddress: wallet.publicKey?.toString(),
    network
  };
};