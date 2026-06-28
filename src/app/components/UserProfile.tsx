import { Link, useNavigate } from "@tanstack/react-router";
import { ChevronRight, LogOut, MapPin, Settings, Shield, Star } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BottomNav, NeighborAvatar, TrustBadge } from "./patterns";
import { MobileShell } from "./patterns/shell";

const stats = [
  { label: "Helps given", value: 12 },
  { label: "Helps received", value: 5 },
  { label: "Kindness score", value: "4.9" },
];

const rows = [
  { id: "edit", label: "Edit profile", icon: Settings, to: "/profile-setup" },
  { id: "address", label: "Verification & address", icon: Shield, to: "/verify-address" },
  { id: "cluster", label: "Cluster settings", icon: MapPin, to: "/location/cluster" },
];

export default function UserProfile() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/auth", replace: true });
  }
  return (
    <MobileShell>
      <header className="sticky top-0 z-20 bg-background/85 px-4 pt-4 pb-3 backdrop-blur">
        <h1 className="text-xl font-semibold">Profile</h1>
      </header>

      <main className="flex-1 space-y-4 px-4 pb-28">
        <section className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
          <NeighborAvatar name="Sam Rivera" size="lg" verified />
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-base font-semibold">Sam Rivera</h2>
            <p className="truncate text-xs text-muted-foreground">
              Greenview Heights · D18
            </p>
            <div className="mt-1.5 flex items-center gap-2">
              <TrustBadge level="verified" />
              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                <Star className="h-3 w-3" /> 4.9
              </span>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-3 gap-2">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-border bg-card p-3 text-center shadow-sm"
            >
              <p className="text-lg font-semibold">{s.value}</p>
              <p className="text-[11px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </section>

        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          {rows.map((r, i) => {
            const Icon = r.icon;
            return (
              <Link
                key={r.id}
                to={r.to}
                className={`flex items-center gap-3 px-4 py-3.5 hover:bg-secondary ${
                  i > 0 ? "border-t border-border" : ""
                }`}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="flex-1 text-sm font-medium">{r.label}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            );
          })}
        </section>

        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm font-medium text-destructive shadow-sm hover:bg-secondary"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </main>

      <BottomNav activeId="profile" />
    </MobileShell>
  );
}
