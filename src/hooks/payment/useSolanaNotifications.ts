
import { useAuth } from "@/context/AuthContext";
import { createNotification } from "@/lib/notificationService";

export function useSolanaNotifications() {
  const { user } = useAuth();

  const notifyBuyerPaymentSuccess = async (
    orderId: string,
    amount: number,
    beatCount: number
  ) => {
    if (!user) return;
    
    try {
      await createNotification({
        recipientId: user.id,
        title: 'Payment Successful',
        body: `Your USDC payment of $${amount.toLocaleString()} for ${beatCount} beat${beatCount > 1 ? 's' : ''} has been processed successfully.`,
        type: 'success',
        notificationType: 'payment',
        relatedEntityId: orderId,
        relatedEntityType: 'order'
      });
    } catch (error) {
      console.error('Error sending buyer notification:', error);
    }
  };

  const notifyProducerSale = async (
    producerId: string,
    beatTitle: string,
    amount: number,
    beatId: string
  ) => {
    try {
      await createNotification({
        recipientId: producerId,
        title: 'Beat Sale - USDC Payment Received',
        body: `Your beat "${beatTitle}" has been purchased! USDC payment of $${amount.toLocaleString()} has been processed.`,
        type: 'success',
        notificationType: 'sale',
        relatedEntityId: beatId,
        relatedEntityType: 'beat'
      });
    } catch (error) {
      console.error('Error sending producer notification:', error);
    }
  };

  return {
    notifyBuyerPaymentSuccess,
    notifyProducerSale
  };
}
