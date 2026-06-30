import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ChevronRight, Loader2, LogOut, MapPin, Settings, Shield, ShieldCheck } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BottomNav, NeighborAvatar, TrustBadge } from "./patterns";
import { MobileShell } from "./patterns/shell";

interface ProfileData {
  full_name: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  neighbourhood: string | null;
  building: string | null;
  skills: string[] | null;
  interests: string[] | null;
  tenure: string | null;
  onboarding_completed: boolean | null;
  verification_status: "unverified" | "pending" | "approved" | "rejected" | null;
}


const rows = [
  { id: "edit", label: "Edit profile", icon: Settings, to: "/profile-setup" as const },
  { id: "address", label: "Verification & address", icon: Shield, to: "/verify-address" as const },
  { id: "cluster", label: "Cluster settings", icon: MapPin, to: "/location/cluster" as const },
];

export default function UserProfile() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [rejectedNote, setRejectedNote] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const [{ data }, { data: roles }, { data: latestReq }] = await Promise.all([
        supabase
          .from("profiles")
          .select("full_name, display_name, avatar_url, bio, neighbourhood, building, skills, interests, tenure, onboarding_completed, verification_status")
          .eq("id", u.user.id)
          .maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", u.user.id),
        supabase
          .from("verification_requests")
          .select("status, reviewer_note")
          .eq("user_id", u.user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      setProfile(data as ProfileData | null);
      setIsAdmin((roles ?? []).some((r) => r.role === "admin"));
      if (latestReq?.status === "rejected") setRejectedNote(latestReq.reviewer_note ?? null);
      setLoading(false);
    })();
  }, []);

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/auth", replace: true });
  }

  if (loading) {
    return (
      <MobileShell>
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </MobileShell>
    );
  }

  const name = profile?.display_name || profile?.full_name || "Neighbour";
  const location = [profile?.building, profile?.neighbourhood].filter(Boolean).join(" · ") || "Set your location";
  const skills = profile?.skills ?? [];
  const interests = profile?.interests ?? [];

  return (
    <MobileShell>
      <header className="sticky top-0 z-20 bg-background/85 px-4 pt-4 pb-3 backdrop-blur">
        <h1 className="text-xl font-semibold">Profile</h1>
      </header>

      <main className="flex-1 space-y-4 px-4 pb-28">
        <section className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
          <NeighborAvatar name={name} src={profile?.avatar_url ?? undefined} size="lg" verified={profile?.verification_status === "approved"} />
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-base font-semibold">{name}</h2>
            <p className="truncate text-xs text-muted-foreground">{location}</p>
            <div className="mt-1.5 flex items-center gap-2">
              {profile?.verification_status === "approved" ? (
                <TrustBadge level="verified" />
              ) : profile?.verification_status === "pending" ? (
                <TrustBadge level="new" label="Verification pending" />
              ) : profile?.verification_status === "rejected" ? (
                <TrustBadge level="new" label="Verification rejected" />
              ) : (
                <TrustBadge level="new" label="Not verified" />
              )}
              {profile?.tenure && (
                <span className="text-[11px] text-muted-foreground">{profile.tenure}</span>
              )}
            </div>
          </div>
        </section>

        {profile?.verification_status === "rejected" && (
          <section className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
            <p className="font-semibold text-destructive">Verification was rejected</p>
            {rejectedNote && (
              <p className="mt-1 text-foreground/80">Reviewer note: {rejectedNote}</p>
            )}
            <Link to="/verify-address" className="mt-2 inline-block text-sm font-medium text-primary underline">
              Update details and resubmit
            </Link>
          </section>
        )}




        {profile?.bio && (
          <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{profile.bio}</p>
          </section>
        )}

        {(skills.length > 0 || interests.length > 0) && (
          <section className="rounded-2xl border border-border bg-card p-4 shadow-sm space-y-3">
            {skills.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Skills</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {skills.map((s) => (
                    <span key={s} className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-foreground">{s}</span>
                  ))}
                </div>
              </div>
            )}
            {interests.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Interests</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {interests.map((s) => (
                    <span key={s} className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-foreground">{s}</span>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          {rows.map((r, i) => {
            const Icon = r.icon;
            return (
              <Link
                key={r.id}
                to={r.to}
                className={`flex items-center gap-3 px-4 py-3.5 hover:bg-secondary ${i > 0 ? "border-t border-border" : ""}`}
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

        {isAdmin && (
          <Link
            to="/admin/verifications"
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm font-medium text-foreground shadow-sm hover:bg-secondary"
          >
            <ShieldCheck className="h-4 w-4" /> Review verifications
          </Link>
        )}



        <button
          type="button"
          onClick={handleSignOut}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm font-medium text-destructive shadow-sm hover:bg-secondary"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </main>

      <BottomNav activeId="profile" />
    </MobileShell>
  );
}
