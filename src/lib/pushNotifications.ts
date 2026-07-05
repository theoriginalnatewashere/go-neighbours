// Client-side helpers for Web Push notification enrolment.
import { supabase } from "@/integrations/supabase/client";

// Public VAPID key (safe to expose). Keep in sync with the VAPID_PUBLIC_KEY
// edge-function secret.
export const VAPID_PUBLIC_KEY =
  "BBMiDGHN4B5H6T5AcPrARSgWNiShNeH0uwptS5PA4oJNZW-Hjzu2hJ3tani-56d3u6en_CJD1vWXFHHboNS3mdE";

export type PushSupport =
  | { supported: true }
  | { supported: false; reason: string };

export function checkPushSupport(): PushSupport {
  if (typeof window === "undefined") return { supported: false, reason: "Not in a browser" };
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

async function getReadyRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;
  try {
    return await navigator.serviceWorker.ready;
  } catch {
    return null;
  }
}

export async function enablePushNotifications(userId: string): Promise<void> {
  const support = checkPushSupport();
  if (!support.supported) throw new Error(support.reason);

  const registration = await getReadyRegistration();
  if (!registration) {
    throw new Error(
      "Notifications only work in the installed or published app, not in the editor preview.",
    );
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error(
      "Notifications are blocked. Enable them for this site in your browser or device settings.",
    );
  }

  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY).buffer as ArrayBuffer,
    });
  }

  const endpoint = subscription.endpoint;
  const p256dh = bufToB64Url(subscription.getKey("p256dh"));
  const auth = bufToB64Url(subscription.getKey("auth"));

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
  if (error) throw error;
}

export async function disablePushNotificationsThisDevice(userId: string): Promise<void> {
  const registration = await getReadyRegistration();
  if (registration) {
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      const endpoint = subscription.endpoint;
      try {
        await subscription.unsubscribe();
      } catch {
        // ignore
      }
      await supabase
        .from("push_subscriptions")
        .delete()
        .eq("user_id", userId)
        .eq("endpoint", endpoint);
    }
  }
}

export async function getNotificationPreference(
  userId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("notification_preferences")
    .select("messages_about_posts")
    .eq("user_id", userId)
    .maybeSingle();
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
  if (error) throw error;
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
