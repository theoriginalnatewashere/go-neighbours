// Client-side helpers for Web Push notification enrolment.
import { supabase } from "@/integrations/supabase/client";

// Public VAPID key (safe to expose). Keep in sync with the VAPID_PUBLIC_KEY
// edge-function secret.
export const VAPID_PUBLIC_KEY =
  "BBMiDGHN4B5H6T5AcPrARSgWNiShNeH0uwptS5PA4oJNZW-Hjzu2hJ3tani-56d3u6en_CJD1vWXFHHboNS3mdE";

export type PushSupport =
  | { supported: true }
  | { supported: false; reason: string };

// TEMP: verbose diagnostics for the iOS Home Screen push enrolment audit.
// Remove once the flow is confirmed working end-to-end on iOS.
const DEBUG = true;
function log(step: string, data?: unknown) {
  if (!DEBUG) return;
  // eslint-disable-next-line no-console
  console.info(`[push] ${step}`, data ?? "");
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (window.matchMedia?.("(display-mode: standalone)").matches) return true;
  } catch {
    // ignore
  }
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return nav.standalone === true;
}

function isInEditorPreviewIframe(): boolean {
  if (typeof window === "undefined") return false;
  // Installed home-screen apps are never iframed — never block them.
  if (isStandalone()) return false;
  try {
    return window.self !== window.top;
  } catch {
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

async function waitForActiveRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return null;

  // Try to find (or create) a registration under our scope.
  let reg =
    (await navigator.serviceWorker.getRegistration("/")) ??
    (await navigator.serviceWorker.getRegistration());
  log("sw.getRegistration initial", {
    found: !!reg,
    scope: reg?.scope,
    hasActive: !!reg?.active,
  });

  if (!reg) {
    try {
      reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      log("sw.register done", { scope: reg.scope });
    } catch (err) {
      log("sw.register failed", err);
      return null;
    }
  }

  // Wait for it to become active (up to 30s — iOS can be slow on first install).
  const start = Date.now();
  const deadline = start + 30000;
  while (Date.now() < deadline) {
    if (reg.active) return reg;
    const ready = await Promise.race([
      navigator.serviceWorker.ready,
      new Promise<ServiceWorkerRegistration | null>((resolve) =>
        setTimeout(() => resolve(null), 1500),
      ),
    ]);
    if (ready?.active) {
      log("sw.ready active", { scope: ready.scope });
      return ready;
    }
    // Re-fetch registration in case it changed
    reg = (await navigator.serviceWorker.getRegistration("/")) ?? reg;
  }
  log("sw.wait timed out", { elapsedMs: Date.now() - start, hasActive: !!reg.active });
  return reg.active ? reg : null;
}

/**
 * Enable push on this device. Must be invoked from a user gesture.
 * Throws with a step-specific, user-facing message so the caller can toast it.
 */
export async function enablePushNotifications(userId: string): Promise<void> {
  log("enable:start", {
    href: typeof window !== "undefined" ? window.location.href : null,
    standalone: isStandalone(),
    hasNotification: typeof window !== "undefined" && "Notification" in window,
    hasSW: typeof navigator !== "undefined" && "serviceWorker" in navigator,
    hasPushManager: typeof window !== "undefined" && "PushManager" in window,
    permission:
      typeof window !== "undefined" && "Notification" in window ? Notification.permission : "n/a",
    vapidKeyPresent: !!VAPID_PUBLIC_KEY && VAPID_PUBLIC_KEY.length > 20,
  });

  const support = checkPushSupport();
  if (!support.supported) throw new Error(support.reason);

  // 1) Permission — only ask if not already granted (avoid redundant prompt on iOS).
  let permission = Notification.permission;
  if (permission === "default") {
    try {
      permission = await Notification.requestPermission();
    } catch (err) {
      log("permission.request threw", err);
      throw new Error("Could not request notification permission on this device.");
    }
  }
  log("permission.result", permission);
  if (permission !== "granted") {
    throw new Error(
      permission === "denied"
        ? "Notifications are blocked. Enable them for Go Neighbours in your device settings."
        : "Notification permission wasn't granted.",
    );
  }

  // 2) Service worker
  const registration = await waitForActiveRegistration();
  log("sw.final", {
    hasReg: !!registration,
    scope: registration?.scope,
    activeState: registration?.active?.state,
    controller: navigator.serviceWorker.controller?.scriptURL ?? null,
  });
  if (!registration || !registration.active) {
    throw new Error(
      "Notifications are allowed, but the app could not activate its background service. Close and reopen the app, then try again.",
    );
  }

  // 3) Push subscription — reuse existing if present.
  let subscription: PushSubscription | null = null;
  try {
    subscription = await registration.pushManager.getSubscription();
    log("push.getSubscription", { existing: !!subscription });
  } catch (err) {
    log("push.getSubscription threw", err);
  }

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
      log("push.subscribe ok", { endpoint: subscription.endpoint.slice(0, 40) + "…" });
    } catch (err) {
      const name = err instanceof Error ? err.name : "Error";
      const msg = err instanceof Error ? err.message : String(err);
      log("push.subscribe failed", { name, msg });
      throw new Error(
        `Notifications are allowed, but this device could not create a push subscription (${name}).`,
      );
    }
  }

  const endpoint = subscription.endpoint;
  const p256dh = bufToB64Url(subscription.getKey("p256dh"));
  const auth = bufToB64Url(subscription.getKey("auth"));
  if (!endpoint || !p256dh || !auth) {
    throw new Error("Push subscription is missing required keys.");
  }

  // 4) Persist to Supabase.
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
  if (error) {
    log("supabase.upsert push_subscriptions failed", error);
    throw new Error(
      `Notifications are enabled, but the subscription could not be saved (${error.message}).`,
    );
  }
  log("supabase.upsert push_subscriptions ok");
}

/**
 * Unsubscribes this device's push subscription and removes it from the DB.
 */
export async function disablePushNotificationsThisDevice(userId: string): Promise<void> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  const registration =
    (await navigator.serviceWorker.getRegistration("/")) ??
    (await navigator.serviceWorker.getRegistration());
  if (!registration) return;
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return;
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

export async function getNotificationPreference(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("notification_preferences")
    .select("messages_about_posts")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    log("supabase.select notification_preferences failed", error);
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
  if (error) {
    log("supabase.upsert notification_preferences failed", error);
    throw new Error(`Couldn't save preference: ${error.message}`);
  }
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
    // eslint-disable-next-line no-console
    console.warn("triggerMessagePush failed", err);
  }
}
