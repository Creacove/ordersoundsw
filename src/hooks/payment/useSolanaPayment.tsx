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
const recordFallbackPayment = async (amount: number, signature: string, productData?: ProductData | { items: any[] }) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("Could not get user for fallback payment recording:", userError);
      return;
    }

    // Create a temporary order to link payment to
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        buyer_id: user.id,
        total_price: amount,
        status: 'completed',
        currency_used: 'USDC',
        payment_method: 'solana_usdc',
        transaction_signatures: [signature]
      })
      .select()
      .single();

    if (orderError) {
      console.error("Failed to create fallback order:", orderError);
      return;
    }

    // Record payment with 100% platform share and fallback metadata
    const { data: paymentData, error: paymentError } = await supabase
      .from('payments')
      .insert({
        amount,
        order_id: orderData.id,
        payment_method: 'solana_usdc',
        status: 'completed',
        transaction_reference: signature,
        platform_share: amount, // 100% to platform
        producer_share: 0, // 0% to producer (missing wallet)
        payment_details: {
          fallback_reason: 'missing_producer_wallet',
          transaction_signature: signature,
          items: 'items' in (productData || {}) ? (productData as { items: any[] }).items : [productData]
        }
      });

    if (paymentError) {
      console.error("Failed to record fallback payment:", paymentError);
    } else {
      console.log("Recorded fallback payment for manual distribution:", paymentData);
    }
  } catch (error) {
    console.error("Error recording fallback payment:", error);
  }
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
      // Handle fallback payment when producer wallet is missing
      if (producerWalletAddress === null) {
        console.log(`💳 Processing platform fallback payment: $${amount} (producer wallet missing)`);

        // Use platform-only payment function
        const { processPlatformOnlyPayment } = await import('@/utils/payment/usdcTransactions');
        const signature = await processPlatformOnlyPayment(
          amount,
          connection,
          wallet,
          network
        );

        // Record fallback payment details
        await recordFallbackPayment(amount, signature, productData);

        if (isMounted) {
          setLastTransactionSignature(signature);
          toast.success("✅ Payment completed successfully!", {
            description: `$${amount} payment processed`
          });
        }
        onSuccess?.(signature);
        return signature;
      }

      // Validate inputs for normal payment
      validatePaymentInputs(amount, producerWalletAddress);

      console.log(`💳 Processing USDC payment: $${amount} to ${producerWalletAddress} on ${network}`);

      // Process USDC payment using the connection from provider
      const signature = await processUSDCPayment(
        amount,
        producerWalletAddress,
        connection,
        wallet,
        network
      );

      // Wait for confirmation using HTTP polling (no WebSocket required)
      console.log('⏳ Waiting for transaction confirmation via polling...');
      const confirmationStart = Date.now();
      const confirmationTimeout = 90000; // 90 seconds for mainnet
      const pollInterval = 3000;

      let confirmed = false;
      let confirmationError = null;

      while (Date.now() - confirmationStart < confirmationTimeout) {
        try {
          const { value: statuses } = await connection.getSignatureStatuses([signature]);
          const status = statuses?.[0];

          if (status) {
            console.log(`📊 Transaction status: ${status.confirmationStatus}`);

            if (status.err) {
              confirmationError = status.err;
              break;
            }

            if (status.confirmationStatus === 'confirmed' || status.confirmationStatus === 'finalized') {
              confirmed = true;
              break;
            }
          }
        } catch (error) {
          console.warn('Status check failed, retrying...', error);
        }
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }

      if (confirmationError) {
        throw new Error(`TRANSACTION_FAILED: ${JSON.stringify(confirmationError)}`);
      }

      if (!confirmed) {
        throw new Error(`TRANSACTION_TIMEOUT: Check Solscan: https://solscan.io/tx/${signature}`);
      }

      if (isMounted) {
        setLastTransactionSignature(signature);
      }

      // Handle product purchase record if applicable (non-blocking)
      if (productData && 'id' in productData) {
        try {
          // Get current user for buyer_id
          const { data: { user }, error: userError } = await supabase.auth.getUser();

          if (userError || !user) {
            console.error("Could not get user for order recording:", userError);
            // Don't throw - payment was successful, just log the issue
          } else {
            // Create order record with buyer_id
            const { data: orderData, error: orderError } = await supabase
              .from('orders')
              .insert({
                buyer_id: user.id,
                total_price: amount,
                status: 'completed',
                transaction_signatures: [signature],
                payment_method: 'solana_usdc',
                currency_used: 'USDC'
              })
              .select()
              .single();

            if (orderError) {
              console.error("Order creation failed:", orderError);
              // Don't throw - payment was successful, just log the issue
            } else {
              // Create order item record
              const { error: itemError } = await supabase
                .from('order_items')
                .insert({
                  order_id: orderData.id,
                  product_id: productData.id,
                  title: productData.title,
                  price: productData.price,
                  quantity: 1,
                });

              if (itemError) {
                console.error("Order item creation failed:", itemError);
                // Attempt to clean up the order if items fail
                await supabase.from('orders').delete().eq('id', orderData.id);
              } else {
                // CRITICAL: Create user_purchased_beats record so it shows in library
                const { error: purchasedBeatError } = await supabase
                  .from('user_purchased_beats')
                  .insert({
                    user_id: user.id,
                    beat_id: productData.id,
                    order_id: orderData.id,
                    license_type: 'basic', // Default license type for single purchases
                    currency_code: 'USDC'
                  });

                if (purchasedBeatError) {
                  console.error("Failed to create purchased beat record:", purchasedBeatError);
                  // This is critical for library display but don't fail the payment
                }
              }
            }
          }
        } catch (dbError) {
          console.error("Database recording failed after successful payment:", dbError);
          // Payment was successful, don't fail the entire operation
        }
      }

      // TODO: HOLIDAY PROMO - Revert to 80/20 message after January 31, 2025
      if (isMounted) {
        // Original: const platformFee = (amount * 0.2).toFixed(2);
        // Original: const producerAmount = (amount * 0.8).toFixed(2);
        toast.success("✅ USDC payment successful!", {
          description: `$${amount} paid (100% to producer - Holiday Promo! 🎉)`
        });
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

    // Check for missing wallets and group fallback items
    const validItems = items.filter(item => item.producerWallet && isValidSolanaAddress(item.producerWallet));
    const fallbackItems = items.filter(item => !item.producerWallet);

    if (fallbackItems.length > 0) {
      console.log(`${fallbackItems.length} items will use platform fallback payment`);
    }

    setIsProcessing(true);

    try {
      if (!wallet.connected || !wallet.publicKey) {
        throw new Error("WALLET_NOT_CONNECTED: Please connect your wallet first");
      }

      console.log(`💳 Processing ${items.length} USDC payments on ${network} network (${validItems.length} normal + ${fallbackItems.length} fallback)`);

      const signatures: string[] = [];

      // Process normal payments first
      if (validItems.length > 0) {
        const normalSignatures = await processMultipleUSDCPayments(validItems, connection, wallet, network);
        signatures.push(...normalSignatures);
      }

      // Process fallback payment for items with missing producer wallets
      if (fallbackItems.length > 0) {
        const fallbackAmount = fallbackItems.reduce((total, item) => total + item.price, 0);
        console.log(`Processing fallback payment of $${fallbackAmount} for ${fallbackItems.length} items`);

        const { processPlatformOnlyPayment } = await import('@/utils/payment/usdcTransactions');
        const fallbackSignature = await processPlatformOnlyPayment(
          fallbackAmount,
          connection,
          wallet,
          network
        );

        signatures.push(fallbackSignature);

        // Record fallback payment
        await recordFallbackPayment(fallbackAmount, fallbackSignature, { items: fallbackItems });
      }

      // Record transaction details in database (non-blocking)
      try {
        // Get current user for buyer_id  
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
          console.error("Could not get user for order recording:", userError);
        } else {
          // Create order record with buyer_id
          const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .insert({
              buyer_id: user.id,
              total_price: items.reduce((total, item) => total + item.price, 0),
              status: 'completed',
              transaction_signatures: signatures,
              payment_method: 'solana_usdc',
              currency_used: 'USDC'
            })
            .select()
            .single();

          if (!orderError && orderData) {
            // Create order items
            const orderItems = items.map(item => ({
              order_id: orderData.id,
              product_id: item.id || 'unknown',
              title: item.title || 'Beat purchase',
              price: item.price,
              quantity: 1,
            }));

            const { error: itemsError } = await supabase.from('order_items').insert(orderItems);

            if (!itemsError) {
              // CRITICAL: Create user_purchased_beats records for library display
              const purchasedBeatsRecords = items.map(item => ({
                user_id: user.id,
                beat_id: item.id || '',
                order_id: orderData.id,
                license_type: 'basic', // Default license type
                currency_code: 'USDC'
              })).filter(record => record.beat_id); // Only insert valid beat IDs

              if (purchasedBeatsRecords.length > 0) {
                const { error: purchasedBeatsError } = await supabase
                  .from('user_purchased_beats')
                  .insert(purchasedBeatsRecords);

                if (purchasedBeatsError) {
                  console.error("Failed to create purchased beats records:", purchasedBeatsError);
                  // Critical for library display but don't fail the payment
                }
              }
            }
          }
        }
      } catch (dbError) {
        // Don't fail the transaction if database recording fails
        console.error("Failed to record transaction in database:", dbError);
      }

      if (isMounted) {
        setLastTransactionSignature(signatures[signatures.length - 1]);
        const totalAmount = items.reduce((total, item) => total + item.price, 0);
        toast.success(`✅ ${signatures.length} USDC payments completed successfully!`, {
          description: `Total: $${totalAmount.toFixed(2)} processed`
        });
      }
      onSuccess?.(signatures);
      return signatures;
    } catch (error: any) {
      console.error("❌ Multiple USDC payments error:", error);
      const message = error.message.includes(':')
        ? error.message.split(':').pop().trim()
        : "Payments failed";

      if (isMounted) {
        toast.error(`Payments failed: ${message}`);
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