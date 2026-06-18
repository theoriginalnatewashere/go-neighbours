import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Radar,
  Users,
  Inbox,
  Check,
  Loader2,
  type LucideIcon,
} from "lucide-react";

const steps = ["Scanning", "Matching", "Preparing"] as const;

function StepRow({
  icon: Icon,
  label,
  state,
}: {
  icon: LucideIcon;
  label: string;
  state: "done" | "active" | "pending";
}) {
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="h-9 w-9 shrink-0 rounded-full bg-secondary flex items-center justify-center">
        <Icon className="h-[18px] w-[18px] text-primary" strokeWidth={2.2} />
      </div>
      <p className="flex-1 text-[14px] font-medium text-foreground">{label}</p>
      {state === "done" && (
        <Check className="h-4 w-4 text-primary" strokeWidth={2.6} />
      )}
      {state === "active" && (
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
      )}
      {state === "pending" && (
        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
      )}
    </div>
  );
}

export function ClusterScanning() {
  const navigate = useNavigate();
  const [stepIdx, setStepIdx] = useState(0);

  useEffect(() => {
    if (stepIdx >= steps.length) {
      const t = setTimeout(() => navigate({ to: "/location/cluster" }), 600);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setStepIdx((s) => s + 1), 1100);
    return () => clearTimeout(t);
  }, [stepIdx, navigate]);

  const progressPct = Math.min(100, ((stepIdx + 0.5) / steps.length) * 100);

  return (
    <main className="min-h-screen bg-background flex justify-center">
      <div className="w-full max-w-md px-5 pt-6 pb-8 flex flex-col">
        <div className="flex items-center gap-3 mb-4">
          <Link
            to="/location"
            aria-label="Go back"
            className="h-10 w-10 -ml-2 flex items-center justify-center rounded-full hover:bg-secondary active:scale-95 transition"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" strokeWidth={2.2} />
          </Link>
        </div>

        {/* Illustration */}
        <div className="mx-auto mb-6 flex h-44 w-full max-w-xs items-center justify-center rounded-3xl bg-secondary/60">
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-card border border-border shadow-sm">
            <Radar className="h-9 w-9 text-primary animate-pulse" strokeWidth={2.2} />
          </div>
        </div>

        <h1 className="text-2xl font-semibold tracking-tight text-center text-foreground">
          Finding your neighbourhood cluster
        </h1>
        <p className="mt-3 text-center text-muted-foreground leading-relaxed text-[15px]">
          We're searching nearby areas to connect you with trusted neighbours,
          local requests, and support close to you.
        </p>

        {/* Progress card */}
        <section className="mt-6 rounded-3xl bg-card border border-border p-4">
          <div className="flex items-center justify-between">
            <p className="text-[14px] font-semibold text-foreground">
              Scanning nearby clusters…
            </p>
            <p className="text-[12px] text-muted-foreground">
              {steps[Math.min(stepIdx, steps.length - 1)]}
            </p>
          </div>
          <p className="mt-1 text-[12.5px] text-muted-foreground">
            This will only take a moment.
          </p>
          <div className="mt-3 h-2 w-full rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-all duration-700"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="mt-3 flex justify-between text-[11px] text-muted-foreground">
            {steps.map((s, i) => (
              <span
                key={s}
                className={i <= stepIdx ? "text-primary font-medium" : ""}
              >
                {s}
              </span>
            ))}
          </div>
        </section>

        <section className="mt-4 rounded-3xl bg-card border border-border p-4 divide-y divide-border">
          <StepRow
            icon={Radar}
            label="Scanning nearby areas"
            state={stepIdx > 0 ? "done" : "active"}
          />
          <StepRow
            icon={Users}
            label="Matching local communities"
            state={stepIdx > 1 ? "done" : stepIdx === 1 ? "active" : "pending"}
          />
          <StepRow
            icon={Inbox}
            label="Preparing nearby requests"
            state={stepIdx > 2 ? "done" : stepIdx === 2 ? "active" : "pending"}
          />
        </section>

        <Link
          to="/location/cluster"
          className="mt-6 w-full h-12 rounded-2xl bg-card border border-border text-foreground font-medium text-[15px] flex items-center justify-center active:scale-[0.99] transition"
        >
          Continue in background
        </Link>
        <Link
          to="/location"
          className="mt-2 w-full h-11 rounded-2xl text-muted-foreground font-medium text-[14px] flex items-center justify-center hover:bg-secondary transition"
        >
          Cancel
        </Link>
      </div>
    </main>
  );
}
