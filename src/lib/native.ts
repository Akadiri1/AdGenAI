/**
 * Native platform utilities — works on web, iOS, and Android.
 * Uses Capacitor APIs when running as a native app, falls back to web APIs otherwise.
 */

import { Capacitor } from "@capacitor/core";

export function isNative(): boolean {
  return Capacitor.isNativePlatform();
}

export function getPlatform(): "ios" | "android" | "web" {
  return Capacitor.getPlatform() as "ios" | "android" | "web";
}

export async function hapticFeedback() {
  if (!isNative()) return;
  const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
  await Haptics.impact({ style: ImpactStyle.Light });
}

export async function shareContent(params: { title: string; text: string; url: string }) {
  if (isNative()) {
    const { Share } = await import("@capacitor/share");
    await Share.share(params);
  } else if (navigator.share) {
    await navigator.share(params);
  } else {
    await navigator.clipboard.writeText(params.url);
  }
}

export async function openExternalUrl(url: string) {
  if (isNative()) {
    const { Browser } = await import("@capacitor/browser");
    await Browser.open({ url });
  } else {
    window.open(url, "_blank");
  }
}

export async function initStatusBar() {
  if (!isNative()) return;
  try {
    const { StatusBar, Style } = await import("@capacitor/status-bar");
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: "#FF6B35" });
  } catch { /* not available */ }
}

export async function registerPushNotifications() {
  if (!isNative()) return null;
  try {
    const { PushNotifications } = await import("@capacitor/push-notifications");
    const permission = await PushNotifications.requestPermissions();
    if (permission.receive === "granted") {
      await PushNotifications.register();
      return new Promise<string>((resolve) => {
        PushNotifications.addListener("registration", (token) => {
          resolve(token.value);
        });
      });
    }
  } catch { /* not available */ }
  return null;
}
