
import { useState, useEffect } from "react";
import { useSolanaPayment } from "@/hooks/payment/useSolanaPayment";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useWallet } from '@solana/wallet-adapter-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle, CheckCircle2, Wallet, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import WalletButton from "../wallet/WalletButton";

interface CartItem {
  id: string;
  title: string;
  price: number;
  thumbnail_url: string;
  quantity: number;
  producer_wallet?: string;
}

interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cartItems: CartItem[];
  onCheckoutSuccess: () => void;
}

interface PaymentResult {
  success: boolean;
  signature?: string;
  error?: string;
  groupIndex: number;
  producerWallet: string;
  amount: number;
  items: CartItem[];
}

export const SolanaCheckoutDialog = ({
  open,
  onOpenChange,
  cartItems,
  onCheckoutSuccess
}: CheckoutDialogProps) => {
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [validatedItems, setValidatedItems] = useState<CartItem[]>([]);
  const [validationComplete, setValidationComplete] = useState(false);
  const [validationError, setValidationError] = useState('');
  const { makePayment, isProcessing, isWalletConnected, network } = useSolanaPayment();
  const wallet = useWallet();
  
  // Add debug logs for dialog state
  useEffect(() => {
    console.log("SolanaCheckoutDialog - open state changed:", open);
    console.log("SolanaCheckoutDialog - cartItems count:", cartItems?.length);
    console.log("SolanaCheckoutDialog - wallet connected:", wallet.connected);
    console.log("SolanaCheckoutDialog - network:", network);
  }, [open, cartItems, wallet.connected, network]);
  
  // Re-validate wallet addresses when dialog opens
  useEffect(() => {
    const checkWalletAddresses = async () => {
      if (!open || cartItems.length === 0) return;
      
      setValidationError('');
      setValidationComplete(false);
      console.log("Validating USDC wallet addresses for items:", cartItems);

      try {
        const productIds = cartItems.map(item => item.id);
        
        const { data: beatsData, error: beatsError } = await supabase
          .from('beats')
          .select('id, producer_id')
          .in('id', productIds);
          
        if (beatsError) {
          console.error("Error fetching beats data:", beatsError);
          throw beatsError;
        }
        
        if (!beatsData || beatsData.length === 0) {
          console.error("No beats data returned");
          setValidationError("Could not verify beat information");
          return;
        }
        
        const producerIds = beatsData.map(beat => beat.producer_id);
        console.log("Producer IDs to check:", producerIds);
        
        const { data: producersData, error: producersError } = await supabase
          .from('users')
          .select('id, wallet_address, stage_name')
          .in('id', producerIds);
          
        if (producersError) {
          console.error("Error fetching producer data:", producersError);
          throw producersError;
        }
        
        console.log("Producer data from database:", producersData);
        
        const producerWalletMap: Record<string, string | null> = {};
        const producersWithoutWallets: string[] = [];
        
        producersData?.forEach(producer => {
          producerWalletMap[producer.id] = producer.wallet_address;
          if (!producer.wallet_address) {
            producersWithoutWallets.push(producer.stage_name || 'Unknown Producer');
          }
          console.log(`Producer ${producer.stage_name} wallet: ${producer.wallet_address || 'MISSING'}`);
        });
        
        const beatProducerMap: Record<string, string> = {};
        beatsData.forEach(beat => {
          beatProducerMap[beat.id] = beat.producer_id;
        });
        
        const updatedItems = cartItems.map(item => {
          const producerId = beatProducerMap[item.id];
          const verifiedWalletAddress = producerId ? producerWalletMap[producerId] : null;
          
          console.log(`Item ${item.id} - producer ${producerId} - wallet: ${verifiedWalletAddress || 'MISSING'}`);
          
          return {
            ...item,
            producer_wallet: verifiedWalletAddress || item.producer_wallet
          };
        });
        
        console.log("Updated items with verified wallet addresses:", updatedItems);
        
        const missingWallets = updatedItems.filter(item => {
          const hasWallet = !!item.producer_wallet;
          console.log(`Item ${item.id} has wallet: ${hasWallet} (${item.producer_wallet || 'null'})`);
          return !hasWallet;
        });
        
        if (missingWallets.length > 0) {
          console.error("Items missing wallet addresses:", missingWallets);
          setValidationError(`Cannot process payment: ${producersWithoutWallets.join(', ')} ${producersWithoutWallets.length === 1 ? 'has' : 'have'} not set up ${producersWithoutWallets.length === 1 ? 'their' : 'their'} Solana wallet address yet.`);
          return;
        }
        
        setValidatedItems(updatedItems);
        setValidationComplete(true);
      } catch (error: any) {
        console.error('Error validating wallet addresses:', error);
        setValidationError('Error validating producer payment information: ' + (error.message || 'Unknown error'));
      }
    };
    
    if (open) {
      checkWalletAddresses();
    }
  }, [open, cartItems]);
  
  const totalPrice = cartItems.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
  
  const getItemsByProducer = () => {
    const itemsToUse = validatedItems.length > 0 ? validatedItems : cartItems;
    const groupedItems: Record<string, { items: CartItem[], total: number }> = {};
    
    itemsToUse.forEach(item => {
      const producerWallet = item.producer_wallet || '';
      if (!producerWallet) {
        console.error(`Missing wallet address for item: ${item.title}`);
        return;
      }
      
      if (!groupedItems[producerWallet]) {
        groupedItems[producerWallet] = { items: [], total: 0 };
      }
      
      groupedItems[producerWallet].items.push(item);
      groupedItems[producerWallet].total += item.price * item.quantity;
    });
    
    return Object.entries(groupedItems).map(([wallet, data]) => ({
      producerWallet: wallet,
      items: data.items,
      total: data.total
    }));
  };
  
  const handleCheckout = async () => {
    if (!isWalletConnected) {
      toast.error("Please connect your wallet first");
      return;
    }
    
    if (!validationComplete) {
      toast.error("Please wait for wallet validation to complete");
      return;
    }
    
    setIsCheckingOut(true);
    const groupedItems = getItemsByProducer();
    
    try {
      console.log(`Processing ${groupedItems.length} USDC payments on ${network} network`);

      // Process USDC payments and track results
      const paymentResults: PaymentResult[] = [];
      
      for (let i = 0; i < groupedItems.length; i++) {
        const group = groupedItems[i];
        
        if (!group.producerWallet) {
          paymentResults.push({
            success: false,
            error: `Missing producer wallet address for ${group.items[0].title}`,
            groupIndex: i,
            producerWallet: group.producerWallet,
            amount: group.total,
            items: group.items
          });
          continue;
        }
        
        try {
          console.log(`Processing USDC payment of $${group.total} to wallet ${group.producerWallet}`);
          
          const signature = await makePayment(
            group.total,
            group.producerWallet
          );
          
          if (signature) {
            paymentResults.push({
              success: true,
              signature,
              groupIndex: i,
              producerWallet: group.producerWallet,
              amount: group.total,
              items: group.items
            });
            console.log(`USDC payment successful: ${signature}`);
          } else {
            paymentResults.push({
              success: false,
              error: 'Payment returned no signature',
              groupIndex: i,
              producerWallet: group.producerWallet,
              amount: group.total,
              items: group.items
            });
          }
          
        } catch (error: any) {
          paymentResults.push({
            success: false,
            error: error.message || 'Unknown payment error',
            groupIndex: i,
            producerWallet: group.producerWallet,
            amount: group.total,
            items: group.items
          });
          console.error(`USDC payment error for ${group.producerWallet}:`, error);
        }
      }
      
      // Count successful payments and collect signatures
      const successfulPayments = paymentResults.filter(result => result.success);
      const transactionSignatures = successfulPayments.map(result => result.signature!);
      
      // Only create order if we have successful payments (non-blocking)
      if (successfulPayments.length > 0) {
        try {
          // Calculate accurate total from successful payments only
          const actualOrderTotal = successfulPayments.reduce((sum, payment) => sum + payment.amount, 0);
          
          console.log(`Creating order with accurate total: $${actualOrderTotal} (from ${successfulPayments.length} successful payments)`);
          
          // Get current user for buyer_id
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          
          if (userError || !user) {
            console.error("Could not get user for order recording:", userError);
            toast.warning("Payments completed but failed to record order");
          } else {
            const { data: order, error: orderError } = await supabase
              .from('orders')
              .insert({
                buyer_id: user.id,
                total_price: actualOrderTotal,
                status: 'completed',
                currency_used: 'USDC',
                payment_method: 'solana_usdc',
                transaction_signatures: transactionSignatures
              })
              .select()
              .single();
              
            if (orderError) {
              console.error("Order creation error:", orderError);
              toast.error("Payments completed but failed to create order record");
            } else {
              console.log("Created order:", order);
              
              // Create order items for successful payments only
              const successfulItems = successfulPayments.flatMap(result => result.items);
                
              const orderItems = successfulItems.map(item => ({
                order_id: order.id,
                product_id: item.id,
                quantity: item.quantity,
                price: item.price,
                title: item.title
              }));
              
              const { error: itemsError } = await supabase
                .from('order_items')
                .insert(orderItems);
                
              if (itemsError) {
                console.error("Order items error:", itemsError);
                toast.warning("Order created but some items may not be recorded properly");
              } else {
                // CRITICAL: Create user_purchased_beats records for library display
                const purchasedBeatsRecords = successfulItems.map(item => ({
                  user_id: user.id,
                  beat_id: item.id,
                  order_id: order.id,
                  license_type: 'basic', // Default license type for cart purchases
                  currency_code: 'USDC'
                }));
                
                const { error: purchasedBeatsError } = await supabase
                  .from('user_purchased_beats')
                  .insert(purchasedBeatsRecords);
                
                if (purchasedBeatsError) {
                  console.error("Failed to create purchased beats records:", purchasedBeatsError);
                  toast.warning("Order created but beats may not appear in library immediately");
                } else {
                  console.log("Successfully created purchased beats records for library");
                  
                  // Create notifications for buyer and producers
                  try {
                    // Notification for buyer
                    const { error: buyerNotificationError } = await supabase
                      .from('notifications')
                      .insert({
                        recipient_id: user.id,
                        title: 'Beat Purchase Complete',
                        body: `Your purchase of ${successfulItems.length} beat${successfulItems.length > 1 ? 's' : ''} is complete. You can now download from your library.`,
                        notification_type: 'purchase',
                        is_read: false,
                      });

                    if (buyerNotificationError) {
                      console.error('Error creating buyer notification:', buyerNotificationError);
                    } else {
                      console.log('Buyer notification created successfully');
                    }

                    // Create notifications for producers (grouped by producer)
                    const producerNotifications = new Map<string, { producerId: string; beatTitles: string[]; totalAmount: number }>();
                    
                    // Group successful items by producer
                    for (const result of successfulPayments) {
                      for (const item of result.items) {
                        // Get producer info for this beat
                        const { data: beatData, error: beatError } = await supabase
                          .from('beats')
                          .select('producer_id, users(id, full_name, stage_name)')
                          .eq('id', item.id)
                          .single();
                          
                        if (!beatError && beatData) {
                          const producerId = beatData.producer_id;
                          if (!producerNotifications.has(producerId)) {
                            producerNotifications.set(producerId, {
                              producerId,
                              beatTitles: [],
                              totalAmount: 0
                            });
                          }
                          
                          const notification = producerNotifications.get(producerId)!;
                          notification.beatTitles.push(item.title);
                          notification.totalAmount += item.price;
                        }
                      }
                    }

                    // Send notifications to each producer
                    for (const [_, notification] of producerNotifications) {
                      const beatList = notification.beatTitles.length > 1 
                        ? `${notification.beatTitles.slice(0, -1).join(', ')} and ${notification.beatTitles[notification.beatTitles.length - 1]}`
                        : notification.beatTitles[0];
                        
                      const { error: producerNotificationError } = await supabase
                        .from('notifications')
                        .insert({
                          recipient_id: notification.producerId,
                          title: 'Beat Sale - USDC Payment Received',
                          body: `Your beat${notification.beatTitles.length > 1 ? 's' : ''} "${beatList}" ha${notification.beatTitles.length > 1 ? 've' : 's'} been purchased! Payment of $${notification.totalAmount.toFixed(2)} USDC has been processed.`,
                          notification_type: 'sale',
                          related_entity_type: 'beat',
                          is_read: false,
                        });

                      if (producerNotificationError) {
                        console.error(`Error creating producer notification for ${notification.producerId}:`, producerNotificationError);
                      } else {
                        console.log(`Producer notification sent successfully to: ${notification.producerId}`);
                      }
                    }
                  } catch (notificationError) {
                    console.error('Error creating notifications:', notificationError);
                    // Don't fail the entire checkout for notification errors
                  }
                }
              }
            }
          }
        } catch (dbError) {
          console.error("Database error after successful payments:", dbError);
          toast.warning("Payments completed but failed to update order records");
        }
      }
      
      // Provide user feedback based on results
      const failedPayments = paymentResults.filter(result => !result.success);
      
      if (successfulPayments.length === groupedItems.length) {
        toast.success("All USDC payments completed successfully!");
        onCheckoutSuccess();
      } else if (successfulPayments.length > 0) {
        toast.warning(`${successfulPayments.length} of ${groupedItems.length} payments completed successfully`);
        if (failedPayments.length > 0) {
          toast.error(`Some payments failed: ${failedPayments[0].error}`);
        }
        onCheckoutSuccess();
      } else {
        const errorMessage = failedPayments.length > 0 ? failedPayments[0].error : "All payments failed";
        toast.error(errorMessage || "Checkout failed");
      }
      
    } catch (error: any) {
      console.error("USDC checkout error:", error);
      const errorMessage = error.message || "An error occurred during checkout";
      toast.error(errorMessage);
    } finally {
      setIsCheckingOut(false);
      onOpenChange(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border shadow-lg">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold">Complete USDC Payment</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Purchase {cartItems.length} item(s) for ${totalPrice.toFixed(2)} USDC on {network}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {!wallet.connected && (
            <Card className="border-amber-200 dark:border-amber-800">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="space-y-3">
                    <div>
                      <p className="font-medium text-amber-900 dark:text-amber-100">Wallet Connection Required</p>
                      <p className="text-sm text-amber-700 dark:text-amber-300">Connect your Solana wallet to complete this purchase</p>
                    </div>
                    <WalletButton className="w-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {wallet.connected && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Wallet className="h-5 w-5 text-primary flex-shrink-0" />
                  <div>
                    <div className="font-medium">Connected: {wallet.publicKey?.toString().slice(0, 8)}...{wallet.publicKey?.toString().slice(-8)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {validationError ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <p className="font-medium">Validation Error</p>
                <p className="text-sm mt-1">{validationError}</p>
              </AlertDescription>
            </Alert>
          ) : validationComplete ? (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                <p className="font-medium">Validation Complete</p>
                <p className="text-sm mt-1">All producer wallet addresses verified</p>
              </AlertDescription>
            </Alert>
          ) : (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin flex-shrink-0" />
                  <div>
                    <p className="font-medium">Verifying wallet addresses...</p>
                    <p className="text-sm text-muted-foreground">Please wait while we validate producer payment information</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Order Summary</h3>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>${totalPrice.toFixed(2)} USDC</span>
                </div>
                
                {/* Payment breakdown */}
                <div className="p-3 bg-muted/30 rounded-lg text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">To Producers (80%)</span>
                    <span>${(totalPrice * 0.8).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Platform Fee (20%)</span>
                    <span>${(totalPrice * 0.2).toFixed(2)}</span>
                  </div>
                </div>
                
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  Secure payment powered by Solana
                </p>
              </div>
              
              <div className="text-sm text-muted-foreground">
                <p>✨ Instant download access after payment completion</p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <DialogFooter className="flex flex-col sm:flex-row gap-3">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            disabled={isCheckingOut}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button 
            className="w-full sm:w-auto" 
            variant="premium"
            onClick={handleCheckout} 
            disabled={isCheckingOut || !wallet.connected || !validationComplete || !!validationError}
          >
            {isCheckingOut ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing Payment...
              </>
            ) : (
              `Pay ${totalPrice.toFixed(2)} USDC`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
