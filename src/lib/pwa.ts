// Guarded PWA service-worker registration.
// Only registers in production on real published origins; unregisters in every
// excluded context (dev, iframe/preview hosts, ?sw=off) to keep the Lovable
// preview and dev shells free of stale caches.

const SW_URL = "/sw.js";

function isExcludedContext(): boolean {
  if (typeof window === "undefined") return true;
  if (!import.meta.env.PROD) return true;
  if (window.self !== window.top) return true;
  const url = new URL(window.location.href);
  if (url.searchParams.get("sw") === "off") return true;
  const host = window.location.hostname;
  if (host.startsWith("id-preview--") || host.startsWith("preview--")) return true;
  if (host === "lovableproject.com" || host.endsWith(".lovableproject.com")) return true;
  if (host === "lovableproject-dev.com" || host.endsWith(".lovableproject-dev.com")) return true;
  if (host === "beta.lovable.dev" || host.endsWith(".beta.lovable.dev")) return true;
  return false;
}

async function unregisterOwnServiceWorkers(): Promise<void> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(
      regs
        .filter((r) => {
          const scriptURL = r.active?.scriptURL || r.installing?.scriptURL || r.waiting?.scriptURL || "";
          return scriptURL.endsWith("/sw.js");
        })
        .map((r) => r.unregister()),
    );
  } catch {
    // ignore
  }
}

function showUpdateToast(reload: () => void): void {
  // Lazy-import sonner to avoid pulling it into every route bundle here.
  void import("sonner").then(({ toast }) => {
    toast("A new version is available. Refresh to update.", {
      action: { label: "Refresh", onClick: reload },
      duration: Infinity,
      dismissible: true,
    });
  });
}

export function registerPwa(): void {
  if (typeof window === "undefined") return;
  if (isExcludedContext()) {
    void unregisterOwnServiceWorkers();
    return;
  }
  if (!("serviceWorker" in navigator)) return;

  // Dynamic import so dev/preview never pulls the virtual module.
  void import("virtual:pwa-register")
    .then(({ registerSW }) => {
      const updateSW = registerSW({
        immediate: true,
        onNeedRefresh() {
          showUpdateToast(() => updateSW(true));
        },
      });
    })
    .catch(() => {
      // virtual module unavailable — no-op
    });
}
