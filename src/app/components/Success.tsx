import { Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { MobileShell, PrimaryButton } from "./patterns/shell";

const copy: Record<string, { title: string; body: string }> = {
  request: {
    title: "Your request is live",
    body: "Neighbours in cluster D18 can now see it. We'll notify you the moment someone offers to help.",
  },
  offer: {
    title: "Offer shared!",
    body: "Thanks for spreading a little kindness. Neighbours can now reach out about it.",
  },
  default: {
    title: "All done",
    body: "Nice work — small acts add up.",
  },
};

export default function Success({ kind = "default" }: { kind?: string }) {
  const c = copy[kind] ?? copy.default;
  return (
    <MobileShell>
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/15 text-primary">
          <CheckCircle2 className="h-12 w-12" strokeWidth={1.5} />
        </div>
        <h1 className="mt-6 text-2xl font-semibold">{c.title}</h1>
        <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
          {c.body}
        </p>
      </main>

      <div className="px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="space-y-2">
          <Link to="/home">
            <PrimaryButton>Back to home</PrimaryButton>
          </Link>
          <Link to="/messages">
            <button
              type="button"
              className="inline-flex h-12 w-full items-center justify-center rounded-full border border-border bg-card text-sm font-semibold text-foreground hover:bg-secondary"
            >
              View messages
            </button>
          </Link>
        </div>
      </div>
    </MobileShell>
  );
}
