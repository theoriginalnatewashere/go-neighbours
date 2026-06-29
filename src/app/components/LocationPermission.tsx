import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  MapPin,
  HelpCircle,
  Users,
  Lock,
  type LucideIcon,
} from "lucide-react";

export const LOCATION_SKIPPED_KEY = "goneighbours.locationSkipped";


function InfoRow({
  icon: Icon,
  title,
  desc,
}: {
  icon: LucideIcon;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex gap-3 items-start py-3">
      <div className="h-10 w-10 shrink-0 rounded-full bg-secondary flex items-center justify-center">
        <Icon className="h-[18px] w-[18px] text-primary" strokeWidth={2.2} />
      </div>
      <div className="flex-1 pt-0.5">
        <h3 className="text-[14px] font-semibold text-foreground leading-snug">
          {title}
        </h3>
        <p className="mt-0.5 text-[13px] text-muted-foreground leading-snug">
          {desc}
        </p>
      </div>
    </div>
  );
}

export function LocationPermission() {
  const navigate = useNavigate();

  function handleSkip() {
    try {
      sessionStorage.setItem(LOCATION_SKIPPED_KEY, "1");
    } catch {
      // sessionStorage may be unavailable (private mode); skip silently
    }
    navigate({ to: "/profile-setup", replace: true });
  }

  return (
    <main className="min-h-screen bg-background flex justify-center">
      <div className="w-full max-w-md px-5 pt-6 pb-8 flex flex-col">
        <div className="flex items-center gap-3 mb-4">

          <Link
            to="/auth"
            aria-label="Go back"
            className="h-10 w-10 -ml-2 flex items-center justify-center rounded-full hover:bg-secondary active:scale-95 transition"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" strokeWidth={2.2} />
          </Link>
        </div>

        {/* Illustration */}
        <div className="mx-auto mb-6 flex h-44 w-full max-w-xs items-center justify-center rounded-3xl bg-secondary/60">
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-card border border-border shadow-sm">
            <MapPin className="h-9 w-9 text-primary" strokeWidth={2.2} />
            <span className="absolute inset-0 -m-3 rounded-full border border-dashed border-primary/30" />
          </div>
        </div>

        <h1 className="text-2xl font-semibold tracking-tight text-center text-foreground">
          Let's find neighbours around you
        </h1>
        <p className="mt-3 text-center text-muted-foreground leading-relaxed text-[15px]">
          Allow location access to see help requests and offers near you and
          connect with neighbours in your area.
        </p>

        <section className="mt-6 rounded-3xl bg-card border border-border p-4 divide-y divide-border">
          <InfoRow
            icon={HelpCircle}
            title="See local help requests and offers"
            desc="Discover relevant requests and offers nearby."
          />
          <InfoRow
            icon={Users}
            title="Connect with nearby neighbours"
            desc="Build trusted connections with people around you."
          />
          <InfoRow
            icon={Lock}
            title="Your location stays private"
            desc="We never share your exact address with anyone."
          />
        </section>

        <Link
          to="/location/scanning"
          className="mt-6 w-full h-13 py-3.5 rounded-2xl bg-foreground text-background font-medium text-[15px] flex items-center justify-center gap-2 active:scale-[0.99] transition shadow-sm"
        >
          <MapPin className="h-[18px] w-[18px]" strokeWidth={2.2} />
          Allow Location Access
        </Link>

        <button
          type="button"
          onClick={handleSkip}
          className="mt-3 w-full h-12 rounded-2xl text-foreground font-medium text-[15px] flex items-center justify-center hover:bg-secondary transition"
        >
          Not now
        </button>

      </div>
    </main>
  );
}
