import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { publicEnv } from "@/config/publicEnv";
import { markOrderFailed } from "@/features/checkout/orderService";
import {
  createPendingSolanaOrder,
  SolanaVerificationError,
  type SolanaCheckoutItemInput,
  verifySolanaOrder,
} from "@/features/checkout/solanaCheckoutService";
import {
  isValidSolanaAddress,
  processMultipleUSDCPayments,
  processPlatformOnlyPayment,
  processUSDCPayment,
} from "@/utils/payment/usdcTransactions";

interface ProductData {
  id: string;
  licenseType: string;
  price: number;
  producerId: string;
  productType: "beat" | "soundpack";
  title: string;
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function getVerificationFailureMessage(error: unknown) {
  if (error instanceof SolanaVerificationError && error.recoverable) {
    return "Payment received. Verification is still settling and your items will appear in your library shortly.";
  }

  return "Payment failed";
}

function buildSingleCheckoutItem(
  amount: number,
  producerWalletAddress: string | null,
  productData?: ProductData | { items: unknown[] },
): SolanaCheckoutItemInput {
  if (productData && "id" in productData && "title" in productData) {
    return {
      id: productData.id,
      licenseType: productData.licenseType,
      price: amount,
      producerId: productData.producerId,
      producerWallet: producerWalletAddress,
      productType: productData.productType,
      title: productData.title,
    };
  }

  throw new Error("INVALID_PRODUCT_CONTEXT: Solana checkout requires product metadata");
}

export const useSolanaPayment = () => {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastTransactionSignature, setLastTransactionSignature] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(true);
  const network = publicEnv.solanaNetwork;

  useEffect(() => {
    return () => {
      setIsMounted(false);
    };
  }, []);

  const validatePaymentInputs = useCallback(
    (amount: number, producerWalletAddress: string) => {
      if (!wallet.connected || !wallet.publicKey) {
        throw new Error("WALLET_NOT_CONNECTED: Please connect your wallet first");
      }

      if (!amount || amount <= 0) {
        throw new Error("INVALID_AMOUNT: Payment amount must be positive");
      }

      if (!producerWalletAddress) {
        throw new Error("MISSING_ADDRESS: Producer wallet address is required");
      }

      if (!isValidSolanaAddress(producerWalletAddress)) {
        throw new Error("INVALID_ADDRESS: Creator wallet address is invalid");
      }
    },
    [wallet],
  );

  const makePayment = async (
    amount: number,
    producerWalletAddress: string | null,
    onSuccess?: (signature: string) => void,
    onError?: (error: unknown) => void,
    productData?: ProductData | { items: unknown[] },
  ) => {
    if (isProcessing) {
      toast.warning("Please wait for current transaction to complete");
      return null;
    }

    setIsProcessing(true);
    let orderId: string | null = null;
    let signature: string | null = null;

    try {
      const checkoutItem = buildSingleCheckoutItem(amount, producerWalletAddress, productData);
      const pendingOrder = await createPendingSolanaOrder([checkoutItem]);
      orderId = pendingOrder.orderId;

      if (producerWalletAddress === null) {
        signature = await processPlatformOnlyPayment(amount, connection, wallet, network);
      } else {
        validatePaymentInputs(amount, producerWalletAddress);
        signature = await processUSDCPayment(
          amount,
          producerWalletAddress,
          connection,
          wallet,
          network,
        );
      }

      if (isMounted) {
        setLastTransactionSignature(signature);
      }

      await verifySolanaOrder({
        network,
        orderId,
        signatures: [signature],
      });

      if (isMounted) {
        toast.success("Payment successful! Your beats will appear in your library shortly.");
      }

      onSuccess?.(signature);
      return signature;
    } catch (error: unknown) {
      if (signature && error instanceof SolanaVerificationError && error.recoverable) {
        if (isMounted) {
          toast.success(getVerificationFailureMessage(error));
        }
        onSuccess?.(signature);
        return signature;
      }

      if (orderId) {
        await markOrderFailed(orderId);
      }

      if (isMounted) {
        toast.error(`Payment failed: ${getErrorMessage(error, "Unknown error")}`);
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
    items: {
      id?: string;
      licenseType: string;
      price: number;
      producerId: string;
      producerWallet: string | null;
      productType: "beat" | "soundpack";
      title?: string;
    }[],
    onSuccess?: (signatures: string[]) => void,
    onError?: (error: unknown) => void,
    maxRetries = 2,
  ) => {
    void maxRetries;

    if (isProcessing) {
      toast.warning("Please wait for current transaction to complete");
      return null;
    }

    if (!items.length) {
      toast.error("No payment items provided");
      return null;
    }

    setIsProcessing(true);
    let orderId: string | null = null;
    const signatures: string[] = [];

    try {
      const pendingOrder = await createPendingSolanaOrder(
        items.map((item) => ({
          id: item.id || "unknown",
          licenseType: item.licenseType,
          price: item.price,
          producerId: item.producerId,
          producerWallet: item.producerWallet,
          productType: item.productType,
          title: item.title || "Product",
        })),
      );
      orderId = pendingOrder.orderId;

      const validItems = items.filter(
        (item): item is {
          id?: string;
          licenseType: string;
          price: number;
          producerId: string;
          producerWallet: string;
          productType: "beat" | "soundpack";
          title?: string;
        } =>
          Boolean(item.producerWallet) && isValidSolanaAddress(item.producerWallet),
      );
      const fallbackItems = items.filter((item) => !item.producerWallet);

      if (validItems.length > 0) {
        const normalSignatures = await processMultipleUSDCPayments(
          validItems,
          connection,
          wallet,
          network,
        );
        signatures.push(...normalSignatures);
      }

      if (fallbackItems.length > 0) {
        const fallbackAmount = fallbackItems.reduce((total, item) => total + item.price, 0);
        const fallbackSignature = await processPlatformOnlyPayment(
          fallbackAmount,
          connection,
          wallet,
          network,
        );
        signatures.push(fallbackSignature);
      }

      if (!signatures.length) {
        throw new Error("No on-chain signatures were produced for the order");
      }

      if (isMounted) {
        setLastTransactionSignature(signatures[0]);
      }

      await verifySolanaOrder({
        network,
        orderId,
        signatures,
      });

      if (isMounted) {
        toast.success("Payment successful! Your beats will appear in your library shortly.");
      }

      onSuccess?.(signatures);
      return signatures;
    } catch (error: unknown) {
      if (signatures.length > 0 && error instanceof SolanaVerificationError && error.recoverable) {
        if (isMounted) {
          toast.success(getVerificationFailureMessage(error));
        }
        onSuccess?.(signatures);
        return signatures;
      }

      if (orderId) {
        await markOrderFailed(orderId);
      }

      if (isMounted) {
        toast.error(`Payment failed: ${getErrorMessage(error, "Unknown error")}`);
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
    isProcessing,
    isWalletConnected: wallet.connected,
    lastTransactionSignature,
    makeMultiplePayments,
    makePayment,
    network,
    walletAddress: wallet.publicKey?.toString(),
  };
};
