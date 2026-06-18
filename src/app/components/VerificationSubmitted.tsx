import { Link } from "@tanstack/react-router";
import { ArrowLeft, ShieldCheck, Clock, Bell } from "lucide-react";

export function VerificationSubmitted() {
  return (
    <main className="min-h-screen bg-background flex justify-center">
      <div className="w-full max-w-md px-5 pt-6 pb-8 flex flex-col">
        <div className="flex items-center gap-3 mb-4">
          <Link
            to="/verify-address"
            aria-label="Go back"
            className="h-10 w-10 -ml-2 flex items-center justify-center rounded-full hover:bg-secondary active:scale-95 transition"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" strokeWidth={2.2} />
          </Link>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Verification Submitted
          </h1>
        </div>

        {/* Shield illustration */}
        <div className="mx-auto mb-6 mt-2 flex h-40 w-40 items-center justify-center rounded-full bg-secondary/60">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-card border border-border shadow-sm">
            <ShieldCheck className="h-11 w-11 text-primary" strokeWidth={2.2} />
          </div>
        </div>

        <h2 className="text-2xl font-semibold tracking-tight text-center text-foreground">
          Thank you for applying for verification
        </h2>
        <p className="mt-3 text-center text-muted-foreground leading-relaxed text-[15px]">
          To help ensure that only trusted, reliable, and verified neighbours
          join the community, your account and address will be verified.
        </p>
        <p className="mt-3 text-center text-muted-foreground leading-relaxed text-[14px]">
          This process may take up to 24 working hours. We'll notify you once
          your verification is complete.
        </p>

        <section className="mt-6 space-y-3">
          <div className="flex items-center gap-3 rounded-2xl bg-card border border-border px-4 py-3">
            <div className="h-9 w-9 shrink-0 rounded-full bg-secondary flex items-center justify-center">
              <Clock className="h-[18px] w-[18px] text-primary" strokeWidth={2.2} />
            </div>
            <p className="text-[14px] font-medium text-foreground">
              Estimated time: up to 24 working hours
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-card border border-border px-4 py-3">
            <div className="h-9 w-9 shrink-0 rounded-full bg-secondary flex items-center justify-center">
              <Bell className="h-[18px] w-[18px] text-primary" strokeWidth={2.2} />
            </div>
            <p className="text-[14px] font-medium text-foreground">
              You'll be notified when it's done
            </p>
          </div>
        </section>

        <p className="mt-8 text-center text-[14px] text-muted-foreground">
          You can now close the app.
        </p>
        <p className="mt-1 text-center text-[15px] font-semibold text-foreground">
          See you soon!
        </p>

        <Link
          to="/home"
          className="mt-6 w-full h-12 rounded-2xl bg-card border border-border text-foreground font-medium text-[15px] flex items-center justify-center active:scale-[0.99] transition"
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}
