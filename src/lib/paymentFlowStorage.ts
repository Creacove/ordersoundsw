const PAYMENT_STORAGE_KEYS = {
  orderItems: "orderItems",
  paymentInProgress: "paymentInProgress",
  paystackAmount: "paystackAmount",
  paystackReference: "paystackReference",
  pendingOrderId: "pendingOrderId",
  purchaseSuccess: "purchaseSuccess",
  purchaseTime: "purchaseTime",
  redirectToLibrary: "redirectToLibrary",
} as const;

type PaymentStorageKey = (typeof PAYMENT_STORAGE_KEYS)[keyof typeof PAYMENT_STORAGE_KEYS];

interface PersistPaymentSessionInput<TOrderItem> {
  orderId: string;
  orderItems: TOrderItem[];
  reference?: string;
}

interface StoredPaymentSession<TOrderItem> {
  orderId: string | null;
  orderItems: TOrderItem[];
  reference: string | null;
}

function isBrowser() {
  return typeof window !== "undefined";
}

function getStorageValue(key: PaymentStorageKey) {
  if (!isBrowser()) {
    return null;
  }

  return window.localStorage.getItem(key);
}

function setStorageValue(key: PaymentStorageKey, value: string) {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(key, value);
}

function removeStorageValue(key: PaymentStorageKey) {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(key);
}

function parseStoredBoolean(value: string | null) {
  return value === "true";
}

function parseStoredTimestamp(value: string | null) {
  if (!value) {
    return null;
  }

  const timestamp = Number.parseInt(value, 10);
  return Number.isNaN(timestamp) ? null : timestamp;
}

export function markPaymentInProgress() {
  setStorageValue(PAYMENT_STORAGE_KEYS.paymentInProgress, "true");
}

export function isPaymentInProgress() {
  return parseStoredBoolean(getStorageValue(PAYMENT_STORAGE_KEYS.paymentInProgress));
}

export function persistPaymentSession<TOrderItem>({
  orderId,
  orderItems,
  reference,
}: PersistPaymentSessionInput<TOrderItem>) {
  setStorageValue(PAYMENT_STORAGE_KEYS.pendingOrderId, orderId);
  setStorageValue(PAYMENT_STORAGE_KEYS.orderItems, JSON.stringify(orderItems));
  markPaymentInProgress();

  if (reference) {
    setStorageValue(PAYMENT_STORAGE_KEYS.paystackReference, reference);
  } else {
    removeStorageValue(PAYMENT_STORAGE_KEYS.paystackReference);
  }
}

export function getStoredPaymentSession<TOrderItem>(): StoredPaymentSession<TOrderItem> {
  const orderItemsValue = getStorageValue(PAYMENT_STORAGE_KEYS.orderItems);
  let orderItems: TOrderItem[] = [];

  if (orderItemsValue) {
    try {
      orderItems = JSON.parse(orderItemsValue) as TOrderItem[];
    } catch {
      removeStorageValue(PAYMENT_STORAGE_KEYS.orderItems);
    }
  }

  return {
    orderId: getStorageValue(PAYMENT_STORAGE_KEYS.pendingOrderId),
    orderItems,
    reference: getStorageValue(PAYMENT_STORAGE_KEYS.paystackReference),
  };
}

export function clearPaymentSession() {
  removeStorageValue(PAYMENT_STORAGE_KEYS.pendingOrderId);
  removeStorageValue(PAYMENT_STORAGE_KEYS.orderItems);
  removeStorageValue(PAYMENT_STORAGE_KEYS.paystackAmount);
  removeStorageValue(PAYMENT_STORAGE_KEYS.paystackReference);
  removeStorageValue(PAYMENT_STORAGE_KEYS.paymentInProgress);
}

export function markPurchaseSuccess(timestamp = Date.now()) {
  setStorageValue(PAYMENT_STORAGE_KEYS.purchaseSuccess, "true");
  setStorageValue(PAYMENT_STORAGE_KEYS.purchaseTime, timestamp.toString());
}

export function clearPurchaseSuccess() {
  removeStorageValue(PAYMENT_STORAGE_KEYS.purchaseSuccess);
  removeStorageValue(PAYMENT_STORAGE_KEYS.purchaseTime);
}

export function hasRecentPurchaseSuccess(maxAgeMs = 5 * 60 * 1000) {
  if (!parseStoredBoolean(getStorageValue(PAYMENT_STORAGE_KEYS.purchaseSuccess))) {
    return false;
  }

  const purchaseTime = parseStoredTimestamp(getStorageValue(PAYMENT_STORAGE_KEYS.purchaseTime));
  if (!purchaseTime) {
    return false;
  }

  return Date.now() - purchaseTime < maxAgeMs;
}

export function setRedirectToLibrary() {
  setStorageValue(PAYMENT_STORAGE_KEYS.redirectToLibrary, "true");
}

export function shouldRedirectToLibrary() {
  return parseStoredBoolean(getStorageValue(PAYMENT_STORAGE_KEYS.redirectToLibrary));
}

export function clearRedirectToLibrary() {
  removeStorageValue(PAYMENT_STORAGE_KEYS.redirectToLibrary);
}

export function clearPaymentFlowState() {
  clearPurchaseSuccess();
  clearPaymentSession();
  clearRedirectToLibrary();
}
