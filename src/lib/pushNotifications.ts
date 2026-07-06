// Client-side helpers for Web Push notification enrolment.
import { supabase } from "@/integrations/supabase/client";

// Public VAPID key (safe to expose). Keep in sync with the VAPID_PUBLIC_KEY
// edge-function secret.
export const VAPID_PUBLIC_KEY =
  "BBMiDGHN4B5H6T5AcPrARSgWNiShNeH0uwptS5PA4oJNZW-Hjzu2hJ3tani-56d3u6en_CJD1vWXFHHboNS3mdE";

export type PushSupport =
  | { supported: true }
  | { supported: false; reason: string };

function isInEditorPreviewIframe(): boolean {
  if (typeof window === "undefined") return false;
  // Only treat as editor preview when actually embedded in an iframe.
  // The published hostname (e.g. go-neighbours.lovable.app) must NOT trigger this.
  try {
    return window.self !== window.top;
  } catch {
    // Cross-origin frame access throws — that itself means we're iframed.
    return true;
  }
}

export function checkPushSupport(): PushSupport {
  if (typeof window === "undefined") return { supported: false, reason: "Not in a browser" };
  if (isInEditorPreviewIframe()) {
    return {
      supported: false,
      reason:
        "Notifications only work in the installed or published app, not in the editor preview.",
    };
  }
  if (!("serviceWorker" in navigator)) {
    return { supported: false, reason: "This browser doesn't support service workers." };
  }
  if (!("PushManager" in window)) {
    return {
      supported: false,
      reason:
        "Push notifications aren't supported in this browser. On iPhone, install the app to your home screen first.",
    };
  }
  if (!("Notification" in window)) {
    return { supported: false, reason: "Notifications aren't supported here." };
  }
  return { supported: true };
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

function bufToB64Url(buf: ArrayBuffer | null): string {
  if (!buf) return "";
  const bytes = new Uint8Array(buf);
  let str = "";
  for (let i = 0; i < bytes.length; i += 1) str += String.fromCharCode(bytes[i]);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function diag(): Record<string, unknown> {
  if (typeof window === "undefined") return { env: "server" };
  let iframed = false;
  try {
    iframed = window.self !== window.top;
  } catch {
    iframed = true;
  }
  return {
    url: window.location.href,
    hostname: window.location.hostname,
    iframed,
    serviceWorker: "serviceWorker" in navigator,
    pushManager: "PushManager" in window,
    notification: "Notification" in window,
    permission: "Notification" in window ? Notification.permission : "n/a",
    prod: import.meta.env.PROD,
  };
}

async function getReadyRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return null;
  try {
    // If no registration exists yet (e.g. SW hasn't been installed on this
    // origin), try to register /sw.js explicitly so push can enrol on the
    // very first visit without requiring a full reload.
    const existing = await navigator.serviceWorker.getRegistration();
    if (!existing) {
      try {
        await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      } catch (err) {
        console.warn("[push] sw.js registration failed", err);
      }
    }
    return await Promise.race([
      navigator.serviceWorker.ready,
      new Promise<ServiceWorkerRegistration | null>((resolve) =>
        setTimeout(() => resolve(null), 10000),
      ),
    ]);
  } catch (err) {
    console.warn("[push] getReadyRegistration failed", err);
    return null;
  }
}

/**
 * Enable push on this device. Must be invoked from a user gesture so the
 * browser accepts Notification.requestPermission() and pushManager.subscribe().
 * Throws with a user-facing message on any failure so the caller can toast it
 * and revert the toggle.
 */
export async function enablePushNotifications(userId: string): Promise<void> {
  if (!import.meta.env.PROD) console.info("[push] enable start", diag());

  const support = checkPushSupport();
  if (!support.supported) throw new Error(support.reason);

  // Ask for permission FIRST, still inside the user gesture chain.
  const permission = await Notification.requestPermission();
  if (!import.meta.env.PROD) console.info("[push] permission", permission);
  if (permission !== "granted") {
    throw new Error(
      permission === "denied"
        ? "Notifications are blocked. Enable them for this site in your browser or device settings."
        : "Notification permission wasn't granted.",
    );
  }

  const registration = await getReadyRegistration();
  if (!registration) {
    throw new Error(
      "Couldn't activate the notifications service worker on this device. Reload the app and try again.",
    );
  }


  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    try {
      const key = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: key.buffer.slice(
          key.byteOffset,
          key.byteOffset + key.byteLength,
        ) as ArrayBuffer,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Couldn't subscribe to push.";
      throw new Error(`Push subscription failed: ${msg}`);
    }
  }

  const endpoint = subscription.endpoint;
  const p256dh = bufToB64Url(subscription.getKey("p256dh"));
  const auth = bufToB64Url(subscription.getKey("auth"));
  if (!endpoint || !p256dh || !auth) {
    throw new Error("Push subscription is missing required keys.");
  }

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: userId,
      endpoint,
      p256dh,
      auth,
      user_agent: navigator.userAgent,
    },
    { onConflict: "endpoint" },
  );
  if (error) throw new Error(`Couldn't save subscription: ${error.message}`);
}

/**
 * Unsubscribes this device's push subscription and removes it from the DB.
 * Safe to call even if no subscription exists.
 */
export async function disablePushNotificationsThisDevice(userId: string): Promise<void> {
  const registration = await getReadyRegistration();
  if (!registration) return;
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return;
  const endpoint = subscription.endpoint;
  try {
    await subscription.unsubscribe();
  } catch {
    // ignore — best effort
  }
  await supabase
    .from("push_subscriptions")
    .delete()
    .eq("user_id", userId)
    .eq("endpoint", endpoint);
}

export async function getNotificationPreference(
  userId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("notification_preferences")
    .select("messages_about_posts")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    console.warn("getNotificationPreference failed", error);
    return false;
  }
  return !!data?.messages_about_posts;
}

export async function setNotificationPreference(
  userId: string,
  enabled: boolean,
): Promise<void> {
  const { error } = await supabase.from("notification_preferences").upsert(
    { user_id: userId, messages_about_posts: enabled },
    { onConflict: "user_id" },
  );
  if (error) throw new Error(`Couldn't save preference: ${error.message}`);
}

/**
 * Fire-and-forget: ask the edge function to send push notifications for a
 * newly sent message. Never throws — push failure must not block messaging.
 */
export function triggerMessagePush(conversationId: string): void {
  try {
    void supabase.functions.invoke("send-message-push", {
      body: { conversationId },
    });
  } catch (err) {
    console.warn("triggerMessagePush failed", err);
  }
}
