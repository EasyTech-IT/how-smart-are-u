import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";
import { Capacitor } from "@capacitor/core";

export function playHaptic(kind) {
  if (!Capacitor.isNativePlatform() &&
      (typeof navigator === "undefined" || typeof navigator.vibrate !== "function")) {
    return Promise.resolve();
  }

  if (kind === "error") {
    return Haptics.notification({ type: NotificationType.Error });
  }
  if (kind === "success" || kind === "complete") {
    return Haptics.notification({ type: NotificationType.Success });
  }
  return Haptics.impact({
    style: kind === "tap" || kind === "select" ? ImpactStyle.Light : ImpactStyle.Medium
  });
}
