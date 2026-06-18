import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Camera, Gift } from "lucide-react";
import { MobileShell, PrimaryButton, LabeledField, ScreenHeader } from "./patterns/shell";

const types = ["Free item", "Lend", "Skill", "Time", "Food"];

export default function CreateOffer() {
  const [type, setType] = useState("Free item");

  return (
    <MobileShell>
      <ScreenHeader title="New offer" backTo="/home" />

      <main className="flex-1 space-y-5 px-4 pb-32">
        <div className="flex items-start gap-3 rounded-2xl bg-accent/30 p-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
            <Gift className="h-5 w-5" />
          </span>
          <p className="text-sm leading-relaxed text-foreground/85">
            Share something with your cluster — a skill, an extra loaf, a tool
            to borrow. Small acts make this place feel like home.
          </p>
        </div>

        <LabeledField label="What are you offering?">
          <input
            placeholder="e.g. Sourdough starter, free piano lessons"
            className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm shadow-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </LabeledField>

        <LabeledField label="Description">
          <textarea
            rows={4}
            placeholder="Describe what's on offer, when, and how to claim it."
            className="w-full resize-none rounded-2xl border border-border bg-card px-4 py-3 text-sm shadow-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </LabeledField>

        <div>
          <span className="mb-1.5 block text-xs font-semibold">Type</span>
          <div className="flex flex-wrap gap-2">
            {types.map((t) => {
              const active = t === type;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-foreground hover:bg-secondary"
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-card/60 px-4 py-3 text-sm text-muted-foreground hover:bg-secondary"
        >
          <Camera className="h-4 w-4" /> Add a photo (optional)
        </button>
      </main>

      <div className="sticky bottom-0 z-20 border-t border-border bg-background/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
        <Link to="/success" search={{ kind: "offer" }}>
          <PrimaryButton>Share offer</PrimaryButton>
        </Link>
      </div>
    </MobileShell>
  );
}
