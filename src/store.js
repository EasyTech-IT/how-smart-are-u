import { Capacitor } from "@capacitor/core";
import { Purchases } from "@revenuecat/purchases-capacitor";

const entitlementId = import.meta.env.VITE_REVENUECAT_PASS_ENTITLEMENT || "moss_letters_pass";
const passPackageId = import.meta.env.VITE_REVENUECAT_PASS_PACKAGE_ID || "$rc_lifetime";
const hintsPackageId = import.meta.env.VITE_REVENUECAT_HINTS_PACKAGE_ID || "hint_pack_20";
let configured = false;

function apiKeyForPlatform() {
  if (Capacitor.getPlatform() === "android") {
    return import.meta.env.VITE_REVENUECAT_ANDROID_API_KEY;
  }
  if (Capacitor.getPlatform() === "ios") {
    return import.meta.env.VITE_REVENUECAT_IOS_API_KEY;
  }
  return "";
}

export function hasPassEntitlement(customerInfo) {
  return Boolean(customerInfo?.entitlements?.active?.[entitlementId]);
}

export async function initializeStore() {
  if (!Capacitor.isNativePlatform()) {
    return { ready: false, reason: "Purchases are available in the Android and iOS apps." };
  }

  const apiKey = apiKeyForPlatform();
  if (!apiKey) {
    return { ready: false, reason: "Add the RevenueCat public SDK key for this platform." };
  }

  await Purchases.configure({ apiKey });
  configured = true;
  const [{ customerInfo }, offerings] = await Promise.all([
    Purchases.getCustomerInfo(),
    Purchases.getOfferings()
  ]);
  const packages = offerings.current?.availablePackages || [];
  const passPackage = packages.find((item) => item.identifier === passPackageId) || null;
  const hintsPackage = packages.find((item) => item.identifier === hintsPackageId) || null;

  return {
    ready: true,
    reason: offerings.current ? "" : "No current RevenueCat offering is configured.",
    hasPass: hasPassEntitlement(customerInfo),
    passPackage,
    hintsPackage
  };
}

export async function purchaseStorePackage(aPackage) {
  if (!configured) throw new Error("Store purchases are not configured.");
  if (!aPackage) throw new Error("This store product is not available.");
  const result = await Purchases.purchasePackage({ aPackage });
  return result.customerInfo;
}

export async function restoreStorePurchases() {
  if (!configured) throw new Error("Store purchases are not configured.");
  const result = await Purchases.restorePurchases();
  return result.customerInfo;
}
