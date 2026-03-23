import type { CartItemWithDetails } from "@/hooks/useCartWithBeatDetailsOptimized";
import type { CheckoutCurrency } from "./orderService";

export type CheckoutProductType = "beat" | "soundpack";

export interface CheckoutLineItem {
  licenseType: string;
  price: number;
  producerId: string;
  producerName: string;
  producerWallet: string | null;
  productId: string;
  quantity: number;
  thumbnailUrl: string;
  title: string;
  type: CheckoutProductType;
}

export interface SolanaCheckoutDisplayItem {
  id: string;
  license_type: string;
  price: number;
  producer_id: string;
  producer_wallet: string | null;
  quantity: number;
  thumbnail_url: string;
  title: string;
  type: CheckoutProductType;
}

export interface SolanaAllocationSummary {
  fallbackItemCount: number;
  platformAmount: number;
  producerAmount: number;
  subtotal: number;
}

function roundCurrencyAmount(amount: number) {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

function getLineItemSource(item: CartItemWithDetails) {
  return item.itemType === "soundpack" ? item.soundpack : item.beat;
}

export function getCartItemUnitPrice(
  item: CartItemWithDetails,
  currency: CheckoutCurrency,
) {
  const source = getLineItemSource(item);

  if (!source) {
    return 0;
  }

  const localPriceMap: Record<string, number | undefined> = {
    basic: source.basic_license_price_local,
    custom: source.custom_license_price_local,
    exclusive: source.exclusive_license_price_local,
    premium: source.premium_license_price_local,
  };
  const diasporaPriceMap: Record<string, number | undefined> = {
    basic: source.basic_license_price_diaspora,
    custom: source.custom_license_price_diaspora,
    exclusive: source.exclusive_license_price_diaspora,
    premium: source.premium_license_price_diaspora,
  };

  const selectedPrice =
    currency === "NGN"
      ? localPriceMap[item.licenseType]
      : diasporaPriceMap[item.licenseType];

  return selectedPrice ?? 0;
}

export function buildCheckoutLineItems(
  cartItems: CartItemWithDetails[],
  currency: CheckoutCurrency,
): CheckoutLineItem[] {
  return cartItems.flatMap((item) => {
    const source = getLineItemSource(item);
    const productId = source?.id ?? item.itemId;

    if (!source || !productId) {
      return [];
    }

    const producerName =
      source.producer_name ||
      ("producer" in source && source.producer?.stage_name) ||
      ("producer" in source && source.producer?.full_name) ||
      "Unknown Producer";
    const producerWallet =
      item.itemType === "soundpack"
        ? (source as any).producer_wallet ?? null
        : (source as any).producer_wallet_address ?? null;

    return [
      {
        licenseType: item.licenseType,
        price: getCartItemUnitPrice(item, currency),
        producerId: source.producer_id,
        producerName,
        producerWallet,
        productId,
        quantity: 1,
        thumbnailUrl:
          item.itemType === "soundpack"
            ? (source as any).cover_art_url || ""
            : (source as any).cover_image_url || "",
        title: source.title || "Untitled Product",
        type: item.itemType,
      },
    ];
  });
}

export function buildSolanaCheckoutItems(
  cartItems: CartItemWithDetails[],
  currency: CheckoutCurrency,
): SolanaCheckoutDisplayItem[] {
  return buildCheckoutLineItems(cartItems, currency).map((item) => ({
    id: item.productId,
    license_type: item.licenseType,
    price: item.price,
    producer_id: item.producerId,
    producer_wallet: item.producerWallet,
    quantity: item.quantity,
    thumbnail_url: item.thumbnailUrl,
    title: item.title,
    type: item.type,
  }));
}

export function getCheckoutItemsMissingProducerWallet(
  items: CheckoutLineItem[],
) {
  return items.filter((item) => !item.producerWallet);
}

export function getSolanaAllocationSummary(
  items: SolanaCheckoutDisplayItem[],
  platformFeeBps: number,
): SolanaAllocationSummary {
  return items.reduce<SolanaAllocationSummary>(
    (summary, item) => {
      const itemTotal = roundCurrencyAmount(item.price * item.quantity);

      if (!item.producer_wallet) {
        summary.fallbackItemCount += 1;
        summary.platformAmount = roundCurrencyAmount(
          summary.platformAmount + itemTotal,
        );
        summary.subtotal = roundCurrencyAmount(summary.subtotal + itemTotal);
        return summary;
      }

      const platformAmount = roundCurrencyAmount(
        (itemTotal * platformFeeBps) / 10000,
      );
      const producerAmount = roundCurrencyAmount(itemTotal - platformAmount);

      summary.platformAmount = roundCurrencyAmount(
        summary.platformAmount + platformAmount,
      );
      summary.producerAmount = roundCurrencyAmount(
        summary.producerAmount + producerAmount,
      );
      summary.subtotal = roundCurrencyAmount(summary.subtotal + itemTotal);
      return summary;
    },
    {
      fallbackItemCount: 0,
      platformAmount: 0,
      producerAmount: 0,
      subtotal: 0,
    },
  );
}
