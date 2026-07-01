import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Camera, MapPin } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { createPost, getPost, updatePost } from "@/lib/posts";
import { Route } from "@/routes/_authenticated/create-request";
import { MobileShell, PrimaryButton, LabeledField, ScreenHeader } from "./patterns/shell";

const categories = ["Help", "Borrow", "Ride", "Errand", "Other"];
const urgencies = [
  { id: "low" as const, label: "Whenever" },
  { id: "medium" as const, label: "Today" },
  { id: "high" as const, label: "ASAP" },
];

export default function CreateRequest() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { edit: editId } = Route.useSearch();
  const isEdit = !!editId;

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [cat, setCat] = useState("Help");
  const [urgency, setUrgency] = useState<"low" | "medium" | "high">("medium");

  const { data: profile } = useQuery({
    queryKey: ["create-post-profile"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("neighbourhood, building, verification_status")
        .eq("id", u.user.id)
        .maybeSingle();
      return data;
    },
  });

  const isVerified = profile?.verification_status === "approved";

  useEffect(() => {
    if (profile && !isVerified) {
      toast.info("Posting is available once your address is verified.");
      navigate({ to: "/verify-address" });
    }
  }, [profile, isVerified, navigate]);


  const { data: existing, isLoading: loadingExisting } = useQuery({
    queryKey: ["edit-post", editId],
    queryFn: () => (editId ? getPost(editId) : Promise.resolve(null)),
    enabled: isEdit,
  });

  useEffect(() => {
    if (existing) {
      setTitle(existing.title);
      setBody(existing.body);
      setCat(existing.category);
      setUrgency(existing.urgency);
    }
  }, [existing]);

  const createMutation = useMutation({
    mutationFn: createPost,
    onSuccess: () => {
      toast.success("Post shared with your neighbours");
      qc.invalidateQueries({ queryKey: ["cluster-posts"] });
      qc.invalidateQueries({ queryKey: ["my-posts"] });
      navigate({ to: "/success", search: { kind: "request" } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: updatePost,
    onSuccess: () => {
      toast.success("Post updated");
      qc.invalidateQueries({ queryKey: ["cluster-posts"] });
      qc.invalidateQueries({ queryKey: ["my-posts"] });
      qc.invalidateQueries({ queryKey: ["edit-post", editId] });
      navigate({ to: "/home" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const pending = createMutation.isPending || updateMutation.isPending;
  const canSubmit = title.trim().length > 0 && !pending && (!isEdit || !loadingExisting);

  const clusterLabel = profile?.neighbourhood
    ? `${profile.building ? profile.building + " · " : ""}${profile.neighbourhood}`
    : "Set your location to post";

  const handleSubmit = () => {
    if (isEdit && editId) {
      updateMutation.mutate({ id: editId, title, body, category: cat, urgency });
    } else {
      createMutation.mutate({ title, body, category: cat, urgency });
    }
  };

  return (
    <MobileShell>
      <ScreenHeader title={isEdit ? "Edit post" : "New request"} backTo="/home" />

      <main className="flex-1 space-y-5 px-4 pb-32">
        {isEdit && loadingExisting ? (
          <p className="text-sm text-muted-foreground">Loading post…</p>
        ) : null}

        <LabeledField label="What do you need?">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Borrow a step ladder for an hour"
            className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm shadow-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </LabeledField>

        <LabeledField label="Details" hint="Be kind and specific. Aim for 1–2 short paragraphs.">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={5}
            placeholder="Add timing, where to meet, anything that helps a neighbour say yes."
            className="w-full resize-none rounded-2xl border border-border bg-card px-4 py-3 text-sm shadow-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </LabeledField>

        <div>
          <span className="mb-1.5 block text-xs font-semibold">Category</span>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => {
              const active = c === cat;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCat(c)}
                  className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-foreground hover:bg-secondary"
                  }`}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <span className="mb-1.5 block text-xs font-semibold">When?</span>
          <div className="grid grid-cols-3 gap-2">
            {urgencies.map((u) => {
              const active = u.id === urgency;
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => setUrgency(u.id)}
                  className={`rounded-2xl border px-3 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-foreground hover:bg-secondary"
                  }`}
                >
                  {u.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3 shadow-sm">
          <div className="inline-flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-primary" />
            {clusterLabel}
          </div>
          <span className="text-xs text-muted-foreground">Visible only here</span>
        </div>

        <button
          type="button"
          disabled
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-card/60 px-4 py-3 text-sm text-muted-foreground"
        >
          <Camera className="h-4 w-4" /> Add a photo (coming soon)
        </button>
      </main>

      <div className="sticky bottom-0 z-20 border-t border-border bg-background/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
        <PrimaryButton disabled={!canSubmit} onClick={handleSubmit}>
          {pending
            ? isEdit
              ? "Saving…"
              : "Posting…"
            : isEdit
              ? "Save changes"
              : "Post request"}
        </PrimaryButton>
      </div>
    </MobileShell>
  );
}
