
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

export const useSolanaPayment = () => {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastTransactionSignature, setLastTransactionSignature] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(true);
  
  // Force devnet for testing phase
  const network = 'devnet';
  
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
    producerWalletAddress: string,
    onSuccess?: (signature: string) => void,
    onError?: (error: any) => void,
    productData?: ProductData
  ) => {
    if (isProcessing) {
      toast.warning("Please wait for current transaction to complete");
      return null;
    }

    setIsProcessing(true);
    
    try {
      // Validate inputs
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

      // Wait for confirmation with better error handling
      let confirmationAttempts = 0;
      const maxAttempts = 30; // 60 seconds with 2-second intervals
      
      while (confirmationAttempts < maxAttempts) {
        try {
          const confirmation = await connection.confirmTransaction(signature, 'confirmed');
          if (confirmation.value) {
            if (confirmation.value.err) {
              throw new Error(`TRANSACTION_FAILED: ${confirmation.value.err.toString()}`);
            }
            break;
          }
        } catch (error) {
          console.warn(`Confirmation attempt ${confirmationAttempts + 1} failed:`, error);
        }
        
        confirmationAttempts++;
        if (confirmationAttempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      if (confirmationAttempts >= maxAttempts) {
        throw new Error("TRANSACTION_TIMEOUT: Transaction confirmation timed out");
      }

      if (isMounted) {
        setLastTransactionSignature(signature);
      }
      
      // Handle product purchase record if applicable (non-blocking)
      if (productData) {
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
      
      if (isMounted) {
        toast.success("✅ USDC payment successful!", {
          description: `Transaction: ${signature.slice(0, 8)}...${signature.slice(-8)}`
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
    items: { price: number, producerWallet: string, id?: string, title?: string }[],
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

    // Validate all items have valid wallet addresses
    const invalidItems = items.filter(item => 
      !item.producerWallet || !isValidSolanaAddress(item.producerWallet)
    );
    
    if (invalidItems.length > 0) {
      const errorMessage = `${invalidItems.length} items have invalid wallet addresses`;
      toast.error(errorMessage);
      onError?.({ message: `INVALID_ADDRESSES: ${errorMessage}` });
      return null;
    }

    setIsProcessing(true);
    
    try {
      if (!wallet.connected || !wallet.publicKey) {
        throw new Error("WALLET_NOT_CONNECTED: Please connect your wallet first");
      }

      console.log(`💳 Processing ${items.length} USDC payments on ${network} network`);

      // Process multiple USDC payments with retry logic
      let retries = 0;
      let lastError;
      let signatures: string[] = [];

      while (retries <= maxRetries) {
        try {
          signatures = await processMultipleUSDCPayments(items, connection, wallet, network);
          break;
        } catch (error) {
          lastError = error;
          retries++;
          if (retries <= maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * retries));
            if (isMounted) {
              toast.info(`Retrying payments (attempt ${retries} of ${maxRetries})...`);
            }
          }
        }
      }

      if (!signatures.length) {
        throw lastError || new Error("PAYMENT_FAILED: All retries exhausted");
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
        toast.success(`✅ ${signatures.length} USDC payments completed successfully!`);
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
