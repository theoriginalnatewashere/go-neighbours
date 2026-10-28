import { useEffect, useState } from "react";
import {
  Check,
  ExternalLink,
  MoreVertical,
  Plus,
  Share,
  Smartphone,
  X,
  type LucideIcon,
} from "lucide-react";

export const APP_URL = "https://go-neighbours.lovable.app";
export const APP_URL_LABEL = "go-neighbours.lovable.app";

type Platform = "ios" | "android";

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "ios";
  const ua = navigator.userAgent.toLowerCase();
  return /android/.test(ua) ? "android" : "ios";
}

const STEPS: Record<Platform, { icon: LucideIcon; text: string }[]> = {
  ios: [
    { icon: ExternalLink, text: "Open the app link in Safari." },
    { icon: Share, text: "Tap Share." },
    { icon: Plus, text: "Scroll down and tap “Add to Home Screen.”" },
    {
      icon: Check,
      text: "Keep “Open as Web App” on, if shown, then tap Add.",
    },
  ],
  android: [
    { icon: ExternalLink, text: "Open the app link in Chrome." },
    { icon: MoreVertical, text: "Tap the three-dot menu." },
    { icon: Plus, text: "Tap “Add to Home screen” or “Install app.”" },
    { icon: Check, text: "Follow the prompts to confirm." },
  ],
};

const TABS: { id: Platform; label: string }[] = [
  { id: "ios", label: "iPhone · Safari" },
  { id: "android", label: "Android · Chrome" },
];

export function InstallAppModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [platform, setPlatform] = useState<Platform>("ios");

  useEffect(() => {
    if (open) setPlatform(detectPlatform());
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const steps = STEPS[platform];

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-foreground/40 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Install Go Neighbors"
        className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-border bg-card p-6 shadow-lg sm:rounded-3xl sm:p-8"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-medium tracking-tight text-foreground">
              Install Go Neighbors
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Add the app to your phone’s home screen.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground transition-colors hover:bg-secondary/80"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <a
          href={APP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3 transition-colors hover:border-primary/40"
        >
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
            <Smartphone className="h-4.5 w-4.5" />
          </span>
          <span className="min-w-0">
            <span className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Open the app at
            </span>
            <span className="block truncate text-sm font-semibold text-primary">
              {APP_URL_LABEL}
            </span>
          </span>
          <ExternalLink className="ml-auto h-4 w-4 shrink-0 text-muted-foreground" />
        </a>

        <div
          className="mt-5 grid grid-cols-2 gap-1 rounded-xl bg-secondary p-1"
          role="tablist"
          aria-label="Choose your phone"
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={platform === tab.id}
              onClick={() => setPlatform(tab.id)}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition-all ${
                platform === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <ol className="mt-5 space-y-2.5">
          {steps.map((step, index) => (
            <li
              key={step.text}
              className="flex items-start gap-3 rounded-xl border border-border bg-background/60 p-3"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                {index + 1}
              </span>
              <span className="flex items-start gap-2 text-sm leading-relaxed text-foreground">
                <step.icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{step.text}</span>
              </span>
            </li>
          ))}
        </ol>

        <div className="mt-5 flex items-start gap-3 rounded-xl bg-primary/10 p-4">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Check className="h-4 w-4" />
          </span>
          <p className="text-sm leading-relaxed text-foreground">
            <span className="font-semibold">You’re ready.</span> Tap Go
            Neighbors on your home screen to open the app and sign in or create
            an account.
          </p>
        </div>

        <p className="mt-4 text-center text-xs leading-relaxed text-muted-foreground">
          Opened the link in WhatsApp? Switch to Safari or Chrome first.
          <br />
          Menu wording may vary by phone.
        </p>
      </div>
    </div>
  );
}
