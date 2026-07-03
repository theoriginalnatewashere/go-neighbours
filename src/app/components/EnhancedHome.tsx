import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Bell, Clock, FileText, Heart, MapPin, Plus, Search } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { deletePost, listMyPosts, timeAgo, type FeedPost } from "@/lib/posts";
import { likePost, unlikePost, listMyLikedPostIds, listMyLikedPosts } from "@/lib/likes";
import { signPostImageUrls } from "@/lib/postImages";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  BottomNav,
  PostCard,
  SafetyCard,
  TrustBadge,
} from "./patterns";

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function firstName(full: string | null | undefined, display: string | null | undefined): string {
  const base = (display ?? full ?? "").trim();
  if (!base) return "neighbour";
  return base.split(/\s+/)[0];
}

export default function EnhancedHome() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [showAllMine, setShowAllMine] = useState(false);
  const [showAllLiked, setShowAllLiked] = useState(false);
  const toggleExpanded = (id: string) =>
    setExpandedId((cur) => (cur === id ? null : id));

  const { data: currentUserId } = useQuery({
    queryKey: ["current-user-id"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user?.id ?? null;
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: profile } = useQuery({
    queryKey: ["home-profile"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("full_name, display_name, neighbourhood, building, verification_status")
        .eq("id", u.user.id)
        .maybeSingle();
      return data;
    },
    staleTime: 0,
  });

  const { data: myPosts = [] } = useQuery<FeedPost[]>({
    queryKey: ["my-posts"],
    queryFn: () => listMyPosts(50),
    staleTime: 0,
  });

  const { data: likedIds = new Set<string>() } = useQuery({
    queryKey: ["my-liked-ids"],
    queryFn: listMyLikedPostIds,
    staleTime: 0,
  });

  const { data: likedPosts = [] } = useQuery<FeedPost[]>({
    queryKey: ["my-liked-posts"],
    queryFn: () => listMyLikedPosts(50),
    staleTime: 0,
  });

  const previewPaths = Array.from(
    new Set(
      [...myPosts, ...likedPosts]
        .map((p) => p.image_urls[0])
        .filter((x): x is string => !!x),
    ),
  );
  const { data: previewUrls = [] } = useQuery({
    queryKey: ["home-preview-images", previewPaths.join("|")],
    queryFn: () => signPostImageUrls(previewPaths),
    enabled: previewPaths.length > 0,
    staleTime: 30 * 60 * 1000,
  });
  const previewByPath = new Map(previewPaths.map((p, i) => [p, previewUrls[i]]));

  const toggleLike = useMutation({
    mutationFn: async (p: { id: string; liked: boolean }) => {
      if (p.liked) await unlikePost(p.id);
      else await likePost(p.id);
    },
    onMutate: async (p) => {
      await qc.cancelQueries({ queryKey: ["my-liked-ids"] });
      const prev = qc.getQueryData<Set<string>>(["my-liked-ids"]) ?? new Set();
      const next = new Set(prev);
      if (p.liked) next.delete(p.id);
      else next.add(p.id);
      qc.setQueryData(["my-liked-ids"], next);
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["my-liked-ids"], ctx.prev);
      toast.error("Could not update like");
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["my-liked-ids"] });
      qc.invalidateQueries({ queryKey: ["my-liked-posts"] });
      qc.invalidateQueries({ queryKey: ["my-posts"] });
      qc.invalidateQueries({ queryKey: ["cluster-posts"] });
    },
  });

  const handleLike = (id: string) => {
    toggleLike.mutate({ id, liked: likedIds.has(id) });
  };

  const deleteMutation = useMutation({
    mutationFn: deletePost,
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: ["my-posts"] });
      const prev = qc.getQueryData<FeedPost[]>(["my-posts"]) ?? [];
      qc.setQueryData<FeedPost[]>(["my-posts"], prev.filter((p) => p.id !== id));
      return { prev };
    },
    onError: (e: Error, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(["my-posts"], ctx.prev);
      toast.error(e.message || "Could not delete post");
    },
    onSuccess: () => {
      toast.success("Post deleted");
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["my-posts"] });
      qc.invalidateQueries({ queryKey: ["my-liked-posts"] });
      qc.invalidateQueries({ queryKey: ["cluster-posts"] });
      setPendingDeleteId(null);
    },
  });

  const name = firstName(profile?.full_name, profile?.display_name);
  const locationParts = [profile?.building, profile?.neighbourhood].filter(Boolean) as string[];
  const locationLabel = locationParts.length > 0 ? locationParts.join(" · ") : "Set your location";
  const isVerified = profile?.verification_status === "approved";
  const isPending = profile?.verification_status === "pending";

  const handleEdit = (id: string) => {
    navigate({ to: "/create-request", search: { edit: id } });
  };

  const renderPost = (p: FeedPost, keyPrefix = "") => {
    const isAuthor = !!currentUserId && p.author_id === currentUserId;
    return (
      <PostCard
        key={`${keyPrefix}${p.id}`}
        expandable
        expanded={expandedId === `${keyPrefix}${p.id}`}
        onToggle={() => toggleExpanded(`${keyPrefix}${p.id}`)}
        canManage={isAuthor}
        onEdit={handleEdit}
        onDelete={(id) => setPendingDeleteId(id)}
        onLike={handleLike}
        onComment={(id) => navigate({ to: "/request/$id", params: { id } })}
        post={{
          id: p.id,
          author: {
            name: p.author_name || "Neighbour",
            avatar: p.author_avatar_url ?? undefined,
            verified: p.author_verified,
          },
          category: p.category,
          timeAgo: timeAgo(p.created_at),
          title: p.title,
          body: p.body,
          likes: p.likes_count,
          liked: likedIds.has(p.id),
          comments: 0,
          urgency: p.urgency,
        }}
      />
    );
  };

  return (
    <div className="relative mx-auto flex min-h-screen w-[393px] max-w-full flex-col bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-20 bg-background/85 px-4 pt-4 pb-3 backdrop-blur">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground">{getGreeting()}</p>
            <h1 className="truncate text-lg font-semibold">Hi, {name} 👋</h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Search"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-card text-foreground shadow-sm hover:bg-secondary"
            >
              <Search className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Notifications"
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-card text-foreground shadow-sm hover:bg-secondary"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary" />
            </button>
          </div>
        </div>

        {/* Cluster pill */}
        <div className="mt-3 flex items-center justify-between rounded-full bg-accent/40 px-3 py-1.5">
          <div className="inline-flex min-w-0 items-center gap-2 text-sm font-medium text-accent-foreground">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="truncate">{locationLabel}</span>
          </div>
          {isVerified ? (
            <TrustBadge level="verified" label="Verified" />
          ) : (
            <TrustBadge level="new" label="Not verified" />
          )}
        </div>

        {isPending && (
          <div className="mt-3 flex items-center gap-2 rounded-2xl bg-primary/10 px-3.5 py-2.5 text-primary">
            <Clock className="h-4 w-4 shrink-0" strokeWidth={2} />
            <p className="text-[13px] font-medium">
              Address verification in progress. Posting will be available once approved.
            </p>
          </div>
        )}
      </header>

      <main className="flex flex-1 flex-col gap-6 px-4 pt-4 pb-28">
        <SafetyCard title="Stay safe & kind">
          Meet new neighbours in shared spaces and never share keys or payment
          details over chat.
        </SafetyCard>

        {/* My posts */}
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="inline-flex items-center gap-2 text-base font-semibold">
              <FileText className="h-4 w-4 text-primary" /> My posts
            </h2>
            {myPosts.length > 5 && (
              <button
                type="button"
                onClick={() => setShowAllMine((v) => !v)}
                className="text-xs font-medium text-primary hover:underline"
              >
                {showAllMine ? "Show less" : "See all"}
              </button>
            )}
          </div>
          {myPosts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card/60 p-5 text-center text-sm text-muted-foreground">
              Your posts will appear here.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {(showAllMine ? myPosts : myPosts.slice(0, 5)).map((p) => renderPost(p, "mine-"))}
            </div>
          )}
        </section>

        {/* Liked posts */}
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="inline-flex items-center gap-2 text-base font-semibold">
              <Heart className="h-4 w-4 text-primary" /> Liked posts
            </h2>
            {likedPosts.length > 5 && (
              <button
                type="button"
                onClick={() => setShowAllLiked((v) => !v)}
                className="text-xs font-medium text-primary hover:underline"
              >
                {showAllLiked ? "Show less" : "See all"}
              </button>
            )}
          </div>
          {likedPosts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card/60 p-5 text-center text-sm text-muted-foreground">
              Posts you like will appear here.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {(showAllLiked ? likedPosts : likedPosts.slice(0, 5)).map((p) => renderPost(p, "liked-"))}
            </div>
          )}
        </section>
      </main>

      {isVerified ? (
        <Link
          to="/create-request"
          aria-label="Create request"
          className="fixed right-5 bottom-24 z-30 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform hover:scale-105 active:scale-95"
        >
          <Plus className="h-6 w-6" />
        </Link>
      ) : (
        <button
          type="button"
          aria-label="Posting locked until verified"
          onClick={() =>
            toast.info("Posting is available once your address is verified.")
          }
          className="fixed right-5 bottom-24 z-30 inline-flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground shadow-lg"
        >
          <Plus className="h-6 w-6" />
        </button>
      )}

      <BottomNav activeId="home" />

      <AlertDialog
        open={!!pendingDeleteId}
        onOpenChange={(open) => {
          if (!open && !deleteMutation.isPending) setPendingDeleteId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this post?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove your post from your neighbourhood feed.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (pendingDeleteId) deleteMutation.mutate(pendingDeleteId);
              }}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete post"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
