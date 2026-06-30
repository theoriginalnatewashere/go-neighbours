import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Loader2, ShieldCheck, ShieldX, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Request = {
  id: string;
  user_id: string;
  status: "pending" | "approved" | "rejected" | "unverified";
  neighbourhood: string;
  address: string;
  building: string | null;
  room: string | null;
  reviewer_note: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
};

export function AdminVerifications() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [requests, setRequests] = useState<Request[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [filter, setFilter] = useState<"pending" | "all">("pending");

  async function load() {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) {
      navigate({ to: "/auth" });
      return;
    }
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", u.user.id);
    const admin = (roles ?? []).some((r) => r.role === "admin");
    setIsAdmin(admin);
    if (!admin) {
      setLoading(false);
      return;
    }
    let query = supabase
      .from("verification_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (filter === "pending") query = query.eq("status", "pending");
    const { data, error } = await query;
    if (error) toast.error(error.message);
    setRequests((data ?? []) as Request[]);
    setLoading(false);
  }

  useEffect(() => {
    setLoading(true);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  async function review(id: string, status: "approved" | "rejected") {
    setBusy(id);
    const { error } = await supabase
      .from("verification_requests")
      .update({
        status,
        reviewer_note: notes[id]?.trim() || null,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id);
    setBusy(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(status === "approved" ? "Approved" : "Rejected");
    setNotes((n) => ({ ...n, [id]: "" }));
    load();
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background px-6 text-center">
        <div>
          <ShieldX className="h-10 w-10 mx-auto text-muted-foreground" />
          <h1 className="mt-3 text-lg font-semibold">Admins only</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            You don't have permission to review verifications.
          </p>
          <Link to="/home" className="mt-4 inline-block text-sm text-primary underline">
            Back to home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background flex justify-center">
      <div className="w-full max-w-2xl px-5 pt-6 pb-12">
        <div className="flex items-center gap-3 mb-4">
          <Link to="/profile" aria-label="Back" className="h-10 w-10 -ml-2 flex items-center justify-center rounded-full hover:bg-secondary">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-semibold tracking-tight">Verification review</h1>
        </div>

        <div className="flex gap-2 mb-4">
          {(["pending", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                filter === f ? "bg-foreground text-background border-foreground" : "border-border text-foreground"
              }`}
            >
              {f === "pending" ? "Pending" : "All"}
            </button>
          ))}
        </div>

        {requests.length === 0 ? (
          <p className="text-sm text-muted-foreground py-12 text-center">
            No requests to review.
          </p>
        ) : (
          <ul className="space-y-3">
            {requests.map((r) => (
              <li key={r.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{r.neighbourhood}</p>
                    <p className="text-xs text-muted-foreground truncate">{r.address}</p>
                    {(r.building || r.room) && (
                      <p className="text-xs text-muted-foreground truncate">
                        {[r.building, r.room].filter(Boolean).join(" · ")}
                      </p>
                    )}
                    <p className="mt-1 text-[11px] text-muted-foreground font-mono truncate">
                      user: {r.user_id}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 text-[11px] font-semibold px-2 py-1 rounded-full ${
                      r.status === "approved"
                        ? "bg-primary/15 text-primary"
                        : r.status === "rejected"
                          ? "bg-destructive/15 text-destructive"
                          : "bg-secondary text-foreground"
                    }`}
                  >
                    {r.status}
                  </span>
                </div>

                {r.status === "pending" ? (
                  <>
                    <textarea
                      value={notes[r.id] ?? ""}
                      onChange={(e) => setNotes((n) => ({ ...n, [r.id]: e.target.value }))}
                      placeholder="Optional reviewer note (shown to user if rejected)"
                      rows={2}
                      className="mt-3 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                    <div className="mt-3 flex gap-2">
                      <button
                        disabled={busy === r.id}
                        onClick={() => review(r.id, "approved")}
                        className="flex-1 h-10 rounded-xl bg-foreground text-background text-sm font-medium flex items-center justify-center gap-1.5 disabled:opacity-60"
                      >
                        <ShieldCheck className="h-4 w-4" /> Approve
                      </button>
                      <button
                        disabled={busy === r.id}
                        onClick={() => review(r.id, "rejected")}
                        className="flex-1 h-10 rounded-xl border border-destructive text-destructive text-sm font-medium flex items-center justify-center gap-1.5 disabled:opacity-60"
                      >
                        <ShieldX className="h-4 w-4" /> Reject
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="mt-3 text-xs text-muted-foreground space-y-1">
                    {r.reviewer_note && <p>Note: {r.reviewer_note}</p>}
                    {r.reviewed_at && (
                      <p className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Reviewed {new Date(r.reviewed_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
