import { Link } from "@tanstack/react-router";
import { ShieldCheck, Clock, Bell } from "lucide-react";

export function VerificationSubmitted() {
  return (
    <main className="min-h-screen bg-background flex justify-center">
      <div className="w-full max-w-md px-5 pt-10 pb-8 flex flex-col">
        {/* Shield illustration */}
        <div className="mx-auto mb-6 flex h-40 w-40 items-center justify-center rounded-full bg-secondary/60">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-card border border-border shadow-sm">
            <ShieldCheck className="h-11 w-11 text-primary" strokeWidth={2.2} />
          </div>
        </div>

        <h1 className="text-2xl font-semibold tracking-tight text-center text-foreground">
          Verification submitted
        </h1>
        <p className="mt-3 text-center text-muted-foreground leading-relaxed text-[15px]">
          While we review your address, you can explore your community, browse
          posts, and complete your profile.
        </p>

        <section className="mt-6 space-y-3">
          <div className="flex items-center gap-3 rounded-2xl bg-card border border-border px-4 py-3">
            <div className="h-9 w-9 shrink-0 rounded-full bg-secondary flex items-center justify-center">
              <Clock className="h-[18px] w-[18px] text-primary" strokeWidth={2.2} />
            </div>
            <p className="text-[14px] font-medium text-foreground">
              Review usually takes up to 24 hours
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-card border border-border px-4 py-3">
            <div className="h-9 w-9 shrink-0 rounded-full bg-secondary flex items-center justify-center">
              <Bell className="h-[18px] w-[18px] text-primary" strokeWidth={2.2} />
            </div>
            <p className="text-[14px] font-medium text-foreground">
              You'll be notified when it's approved
            </p>
          </div>
        </section>

        <Link
          to="/home"
          className="mt-8 w-full h-13 py-3.5 rounded-2xl bg-foreground text-background font-medium text-[15px] flex items-center justify-center active:scale-[0.99] transition shadow-sm"
        >
          Go to home
        </Link>
      </div>
    </main>
  );
}
