import { Capacitor } from "@capacitor/core";
import {
  AdMob,
  AdmobConsentStatus,
  BannerAdPosition,
  BannerAdSize
} from "@capacitor-community/admob";

let initialized = false;

function configurationForPlatform() {
  if (Capacitor.getPlatform() === "android") {
    return {
      appId: import.meta.env.VITE_ADMOB_ANDROID_APP_ID,
      bannerId: import.meta.env.VITE_ADMOB_ANDROID_BANNER_ID
    };
  }
  if (Capacitor.getPlatform() === "ios") {
    return {
      appId: import.meta.env.VITE_ADMOB_IOS_APP_ID,
      bannerId: import.meta.env.VITE_ADMOB_IOS_BANNER_ID
    };
  }
  return { appId: "", bannerId: "" };
}

export async function initializeAds() {
  if (!Capacitor.isNativePlatform()) {
    return { ready: false, reason: "Ads are available only in the native app." };
  }

  const configuration = configurationForPlatform();
  if (!configuration.appId || !configuration.bannerId) {
    return { ready: false, reason: "AdMob app and banner IDs are not configured." };
  }

  let consent = await AdMob.requestConsentInfo();
  if (consent.isConsentFormAvailable && consent.status === AdmobConsentStatus.REQUIRED) {
    consent = await AdMob.showConsentForm();
  }
  if (!consent.canRequestAds) {
    return { ready: false, reason: "Ads are paused until the required consent is available." };
  }

  await AdMob.initialize();
  initialized = true;
  return { ready: true, bannerId: configuration.bannerId };
}

export async function showAdBanner(bannerId, margin) {
  if (!initialized) return false;
  await AdMob.showBanner({
    adId: bannerId,
    adSize: BannerAdSize.ADAPTIVE_BANNER,
    position: BannerAdPosition.BOTTOM_CENTER,
    margin
  });
  return true;
}

export async function hideAdBanner() {
  if (initialized) await AdMob.hideBanner();
}
