import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { BadgeCheck, Clock, Megaphone, ShieldAlert, ShieldX } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { MobileShell, ScreenHeader } from "./patterns/shell";
import { Switch } from "@/components/ui/switch";
import {
  checkPushSupport,
  disablePushNotificationsThisDevice,
  enablePushNotifications,
  getNotificationPreference,
  setNotificationPreference,
} from "@/lib/pushNotifications";

type VerificationStatus = "unverified" | "pending" | "approved" | "rejected";

type ProfileRow = { verification_status: VerificationStatus | null };
type LatestRequest = { status: VerificationStatus; reviewer_note: string | null } | null;

async function fetchVerification(userId: string): Promise<{
  status: VerificationStatus;
  reviewerNote: string | null;
}> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("verification_status")
    .eq("id", userId)
    .maybeSingle<ProfileRow>();
  const { data: latest } = await supabase
    .from("verification_requests")
    .select("status, reviewer_note")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<NonNullable<LatestRequest>>();
  return {
    status: (profile?.verification_status ?? "unverified") as VerificationStatus,
    reviewerNote: latest?.reviewer_note ?? null,
  };
}

export default function Notifications() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [prefLoading, setPrefLoading] = useState(true);
  const support = checkPushSupport();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      setPrefLoading(true);
      try {
        const pref = await getNotificationPreference(userId);
        if (!cancelled) setEnabled(pref);
      } finally {
        if (!cancelled) setPrefLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const { data: verification } = useQuery({
    queryKey: ["verification-status", userId],
    queryFn: () => fetchVerification(userId!),
    enabled: !!userId,
  });

  const { data: isAdmin = false } = useQuery({
    queryKey: ["is-admin", userId],
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId!)
        .eq("role", "admin")
        .maybeSingle();
      return !!data;
    },
  });

  const handleToggle = async (next: boolean) => {
    if (!userId || saving) return;
    setSaving(true);
    try {
      if (next) {
        if (!support.supported) {
          toast.error(support.reason);
          setEnabled(false);
          return;
        }
        // Enable push first (permission + subscription + DB row). If any
        // step fails, throw and revert. Only persist the preference once
        // the subscription is successfully stored.
        await enablePushNotifications(userId);
        await setNotificationPreference(userId, true);
        setEnabled(true);
        toast.success("Notifications enabled on this device.");
      } else {
        await setNotificationPreference(userId, false);
        // Best-effort teardown — do not fail the toggle if this errors.
        try {
          await disablePushNotificationsThisDevice(userId);
        } catch (err) {
          console.warn("disablePushNotificationsThisDevice failed", err);
        }
        setEnabled(false);
        toast.success("Notifications turned off.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Couldn't update notifications.";
      toast.error(message);
      // Revert to the last known-good state.
      setEnabled((prev) => (next ? false : prev));
    } finally {
      setSaving(false);
    }
  };

  return (
    <MobileShell>
      <ScreenHeader title="Notifications" backTo="/home" />

      <main className="flex-1 space-y-4 px-4 pt-2 pb-24">
        <VerificationCard
          status={verification?.status ?? "unverified"}
          reviewerNote={verification?.reviewerNote ?? null}
          onResubmit={() => navigate({ to: "/verify-address" })}
        />

        <section className="rounded-2xl bg-card p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-foreground">
                Messages about my posts
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Get notified when someone messages you about one of your posts.
              </p>
              {!support.supported && (
                <p className="mt-2 text-xs text-muted-foreground">{support.reason}</p>
              )}
            </div>
            <Switch
              checked={enabled}
              disabled={saving || prefLoading || !support.supported}
              onCheckedChange={handleToggle}
              aria-label="Toggle message notifications"
            />
          </div>
          {enabled && (
            <p className="mt-3 text-xs text-muted-foreground">
              You can turn this off any time.
            </p>
          )}
        </section>
      </main>
    </MobileShell>
  );
}

function VerificationCard({
  status,
  reviewerNote,
  onResubmit,
}: {
  status: VerificationStatus;
  reviewerNote: string | null;
  onResubmit: () => void;
}) {
  const meta = statusMeta(status);
  const Icon = meta.icon;
  return (
    <section className="rounded-2xl bg-card p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div
          className={`inline-flex h-10 w-10 items-center justify-center rounded-full ${meta.iconBg}`}
        >
          <Icon className={`h-5 w-5 ${meta.iconColor}`} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Address verification
          </p>
          <h3 className="mt-0.5 text-base font-semibold text-foreground">{meta.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{meta.description}</p>
          {reviewerNote && status !== "approved" && (
            <p className="mt-2 rounded-lg bg-muted/60 p-2 text-sm text-foreground">
              <span className="font-medium">Reviewer note:</span> {reviewerNote}
            </p>
          )}
          {(status === "unverified" || status === "rejected") && (
            <button
              type="button"
              onClick={onResubmit}
              className="mt-3 inline-flex items-center justify-center rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              {status === "rejected" ? "Resubmit verification" : "Verify address"}
            </button>
          )}
          {status === "pending" && (
            <Link
              to="/verify-address/submitted"
              className="mt-3 inline-flex items-center text-sm font-medium text-primary hover:underline"
            >
              View submitted details
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

function statusMeta(status: VerificationStatus) {
  switch (status) {
    case "approved":
      return {
        title: "Verified",
        description: "Your address has been verified.",
        icon: BadgeCheck,
        iconBg: "bg-emerald-100",
        iconColor: "text-emerald-700",
      };
    case "pending":
      return {
        title: "Pending",
        description: "Your address verification is under review.",
        icon: Clock,
        iconBg: "bg-amber-100",
        iconColor: "text-amber-700",
      };
    case "rejected":
      return {
        title: "Not approved",
        description: "Your last verification wasn't approved. You can resubmit below.",
        icon: ShieldX,
        iconBg: "bg-red-100",
        iconColor: "text-red-700",
      };
    default:
      return {
        title: "Unverified",
        description: "Verify your address to build trust with your neighbours.",
        icon: ShieldAlert,
        iconBg: "bg-muted",
        iconColor: "text-muted-foreground",
      };
  }
}
