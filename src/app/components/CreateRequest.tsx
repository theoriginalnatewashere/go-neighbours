import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Camera, MapPin } from "lucide-react";
import { MobileShell, PrimaryButton, LabeledField, ScreenHeader } from "./patterns/shell";

const categories = ["Help", "Borrow", "Ride", "Errand", "Other"];
const urgencies = [
  { id: "low", label: "Whenever" },
  { id: "medium", label: "Today" },
  { id: "high", label: "ASAP" },
];

export default function CreateRequest() {
  const [cat, setCat] = useState("Help");
  const [urgency, setUrgency] = useState("medium");

  return (
    <MobileShell>
      <ScreenHeader title="New request" backTo="/home" />

      <main className="flex-1 space-y-5 px-4 pb-32">
        <LabeledField label="What do you need?">
          <input
            placeholder="e.g. Borrow a step ladder for an hour"
            className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm shadow-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </LabeledField>

        <LabeledField label="Details" hint="Be kind and specific. Aim for 1–2 short paragraphs.">
          <textarea
            rows={5}
            placeholder="Add timing, where to meet, anything that helps a neighbour say yes."
            className="w-full resize-none rounded-2xl border border-border bg-card px-4 py-3 text-sm shadow-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </LabeledField>

        <div>
          <span className="mb-1.5 block text-xs font-semibold">Category</span>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => {
              const active = c === cat;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCat(c)}
                  className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-foreground hover:bg-secondary"
                  }`}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <span className="mb-1.5 block text-xs font-semibold">When?</span>
          <div className="grid grid-cols-3 gap-2">
            {urgencies.map((u) => {
              const active = u.id === urgency;
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => setUrgency(u.id)}
                  className={`rounded-2xl border px-3 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-foreground hover:bg-secondary"
                  }`}
                >
                  {u.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3 shadow-sm">
          <div className="inline-flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-primary" />
            Cluster D18 · Greenview Heights
          </div>
          <span className="text-xs text-muted-foreground">Visible only here</span>
        </div>

        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-card/60 px-4 py-3 text-sm text-muted-foreground hover:bg-secondary"
        >
          <Camera className="h-4 w-4" /> Add a photo (optional)
        </button>
      </main>

      <div className="sticky bottom-0 z-20 border-t border-border bg-background/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
        <Link to="/success" search={{ kind: "request" }}>
          <PrimaryButton>Post request</PrimaryButton>
        </Link>
      </div>
    </MobileShell>
  );
}
