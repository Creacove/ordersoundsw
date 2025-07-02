
import { usePaystackCheckout } from '@/hooks/payment/usePaystackCheckout';
import { PaystackDialog } from './PaystackDialog';

interface PaystackProps {
  onSuccess: (reference: string) => void;
  onClose: () => void;
  isOpen: boolean;
  totalAmount: number;
  splitCode?: string | null;
  producerId?: string;
  beatId?: string;
}

export function PaystackCheckout({ 
  onSuccess, 
  onClose, 
  isOpen, 
  totalAmount,
  splitCode,
  producerId,
  beatId
}: PaystackProps) {
  // Remove testMode forcing - now running in live mode
  const {
    isProcessing,
    isValidating,
    validationError,
    handlePaymentStart,
    handleRefreshCart,
    forceCancel,
    paymentStarted
  } = usePaystackCheckout({
    onSuccess,
    onClose,
    totalAmount,
    splitCode,
    producerId,
    beatId
    // Removed testMode: true to switch to live mode
  });

  // Don't render anything if dialog is not open
  if (!isOpen) return null;

  return (
    <PaystackDialog
      isOpen={isOpen}
      onClose={onClose}
      totalAmount={totalAmount}
      validationError={validationError}
      isProcessing={isProcessing}
      isValidating={isValidating}
      onPaymentStart={handlePaymentStart}
      onRefreshCart={handleRefreshCart}
      forceCancel={forceCancel}
      paymentStarted={paymentStarted}
    />
  );
}
