import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { getAssociatedTokenAddress, createTransferInstruction, TOKEN_PROGRAM_ID, transfer } from "@solana/spl-token";
import { clusterApiUrl, Connection, Keypair, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useRouter } from "next/navigation";
import { SOLANA_NETWORK } from "@/config";
import { v4 as uuidv4 } from 'uuid';
import { supabase } from "@/integrations/supabase/client";
import { useSolanaNotifications } from "./useSolanaNotifications";

export function useSolanaPayment() {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const { clearCart, cart } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const { notifyBuyerPaymentSuccess, notifyProducerSale } = useSolanaNotifications();

  const establishConnection = useCallback(async () => {
    try {
      const connection = new Connection(clusterApiUrl(SOLANA_NETWORK), 'confirmed');
      const version = await connection.getVersion();
      console.log('Connection to cluster established:', version);
      return connection;
    } catch (error) {
      console.error("Error establishing connection:", error);
      toast({
        title: "Error",
        description: "Failed to connect to Solana network.",
        variant: "destructive",
      });
      return null;
    }
  }, [toast]);

  const airdropSolIfNeeded = useCallback(async (connection: Connection, publicKey: PublicKey) => {
    try {
      const balance = await connection.getBalance(publicKey);
      console.log("account balance:", balance);
      if (balance < 0.5 * LAMPORTS_PER_SOL) {
        console.log("Airdropping SOL...");
        const airdropSignature = await connection.requestAirdrop(
          publicKey,
          2 * LAMPORTS_PER_SOL,
        );
        const result = await connection.confirmTransaction(airdropSignature);
        console.log(`Airdrop confirmed: ${result}`);
        toast({
          title: "Airdrop Successful",
          description: "Successfully airdropped SOL to your account.",
        });
      } else {
        console.log("Sufficient SOL balance, skipping airdrop.");
      }
    } catch (error) {
      console.error("Error airdropping SOL:", error);
      toast({
        title: "Airdrop Failed",
        description: "Failed to airdrop SOL to your account.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const createOrder = useCallback(async () => {
    if (!user || !cart) {
      toast({
        title: "Error",
        description: "User or cart data not available.",
        variant: "destructive",
      });
      return null;
    }

    const orderId = uuidv4();
    const paymentReference = uuidv4();

    try {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([
          {
            id: orderId,
            buyer_id: user.id,
            total_price: cart.total,
            currency_used: 'USD',
            payment_method: 'solana',
            payment_reference: paymentReference,
            status: 'pending',
          },
        ])
        .select()

      if (orderError) {
        console.error("Error creating order:", orderError);
        toast({
          title: "Error",
          description: "Failed to create order.",
          variant: "destructive",
        });
        return null;
      }

      const lineItems = cart.cart_items.map((item) => ({
        order_id: orderId,
        beat_id: item.beat_id,
        quantity: item.quantity,
      }));

      const { error: lineItemError } = await supabase
        .from('line_items')
        .insert(lineItems)

      if (lineItemError) {
        console.error("Error creating line items:", lineItemError);
        toast({
          title: "Error",
          description: "Failed to create line items.",
          variant: "destructive",
        });
        return null;
      }

      toast({
        title: "Order Created",
        description: "Order successfully created.",
      });

      setOrder(orderData[0]);
      return { orderId, paymentReference };
    } catch (error) {
      console.error("Error creating order:", error);
      toast({
        title: "Error",
        description: "Failed to create order.",
        variant: "destructive",
      });
      return null;
    }
  }, [toast, user, cart]);

  const handlePaymentSuccess = async (signature: string, orderId: string) => {
    try {
      setIsProcessing(true);
      
      // Update order status to 'completed'
      const { error: updateError } = await supabase
        .from('orders')
        .update({ status: 'completed', transaction_signature: signature })
        .eq('id', orderId);

      if (updateError) {
        console.error("Error updating order status:", updateError);
        toast({
          title: "Error",
          description: "Failed to update order status.",
          variant: "destructive",
        });
        return;
      }

      // Send notifications after successful payment
      if (user && order && order.line_items) {
        // Notify buyer
        await notifyBuyerPaymentSuccess(
          orderId,
          order.total_price,
          order.line_items.length
        );

        // Notify producers
        for (const lineItem of order.line_items) {
          if (lineItem.beats && lineItem.beats.producer_id) {
            await notifyProducerSale(
              lineItem.beats.producer_id,
              lineItem.beats.title,
              lineItem.beats.basic_license_price_diaspora || 0,
              lineItem.beats.id
            );
          }
        }
      }

      toast({
        title: "Payment Successful",
        description: "Your payment was successfully processed.",
      });
      clearCart();
      router.push(`/profile/${user?.id}/purchases`);
    } catch (error) {
      console.error("Payment processing error:", error);
      toast({
        title: "Payment Error",
        description: "An error occurred while processing your payment.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isProcessing,
    establishConnection,
    airdropSolIfNeeded,
    createOrder,
    handlePaymentSuccess,
  };
}
