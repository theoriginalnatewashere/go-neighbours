import { Link } from "@tanstack/react-router";
import { Home, Check } from "lucide-react";

export function ClusterAssigned() {
  return (
    <main className="min-h-screen bg-background flex justify-center">
      <div className="w-full max-w-md px-5 pt-10 pb-8 flex flex-col">
        {/* Illustration */}
        <div className="mx-auto mb-8 flex h-48 w-full max-w-xs items-center justify-center rounded-3xl bg-secondary/60">
          <div className="relative">
            {[
              "top-2 left-6",
              "top-2 right-6",
              "bottom-4 left-2",
              "bottom-4 right-2",
            ].map((pos) => (
              <span
                key={pos}
                className={`absolute ${pos} h-7 w-7 rounded-xl bg-card border border-border flex items-center justify-center`}
              >
                <Home className="h-3.5 w-3.5 text-muted-foreground" />
              </span>
            ))}
            <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-primary/15 border border-primary/30">
              <span className="text-xl font-bold tracking-tight text-primary">
                D18
              </span>
              <span className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
                <Check className="h-4 w-4" strokeWidth={2.6} />
              </span>
            </div>
          </div>
        </div>

        <h1 className="text-2xl font-semibold tracking-tight text-center text-foreground">
          You're in cluster D18
        </h1>
        <p className="mt-3 text-center text-muted-foreground leading-relaxed text-[15px]">
          We found your nearby neighbourhood cluster. This helps you connect
          with relevant neighbours, requests, and local support around you.
        </p>

        <section className="mt-6 rounded-3xl bg-card border border-border p-5 text-center">
          <p className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
            Assigned cluster
          </p>
          <p className="mt-2 text-5xl font-bold tracking-tight text-foreground">
            D18
          </p>
          <p className="mt-2 text-[13px] text-muted-foreground">
            Based on your current location
          </p>
        </section>

        <Link
          to="/profile-setup"
          className="mt-8 w-full h-13 py-3.5 rounded-2xl bg-foreground text-background font-medium text-[15px] flex items-center justify-center active:scale-[0.99] transition shadow-sm"
        >
          Continue
        </Link>
      </div>
    </main>
  );
}
