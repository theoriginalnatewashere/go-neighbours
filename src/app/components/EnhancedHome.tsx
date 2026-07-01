import { useState, useMemo } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Bell, Clock, Heart, MapPin, MessageSquarePlus, Plus, Search } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { deletePost, listClusterPosts, timeAgo, type FeedPost } from "@/lib/posts";
import { likePost, unlikePost, listMyLikedPostIds, listMyLikedPosts } from "@/lib/likes";
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
  CategoryFilter,
  PostCard,
  SafetyCard,
  TrustBadge,
  type Category,
} from "./patterns";

const categories: Category[] = [
  { id: "all", label: "All" },
  { id: "help", label: "Asks for help" },
  { id: "offer", label: "Offers" },
  { id: "events", label: "Events" },
  { id: "lost", label: "Lost & found" },
  { id: "share", label: "Share" },
];

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
  const [activeCategory, setActiveCategory] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
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

  const { data: posts = [] } = useQuery<FeedPost[]>({
    queryKey: ["cluster-posts"],
    queryFn: listClusterPosts,
    staleTime: 0,
  });

  const [showAllLiked, setShowAllLiked] = useState(false);

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
      const feed = qc.getQueryData<FeedPost[]>(["cluster-posts"]);
      if (feed) {
        qc.setQueryData<FeedPost[]>(
          ["cluster-posts"],
          feed.map((x) =>
            x.id === p.id
              ? { ...x, likes_count: Math.max(0, x.likes_count + (p.liked ? -1 : 1)) }
              : x,
          ),
        );
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["my-liked-ids"], ctx.prev);
      qc.invalidateQueries({ queryKey: ["cluster-posts"] });
      toast.error("Could not update like");
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["my-liked-ids"] });
      qc.invalidateQueries({ queryKey: ["my-liked-posts"] });
      qc.invalidateQueries({ queryKey: ["cluster-posts"] });
    },
  });

  const handleLike = (id: string) => {
    toggleLike.mutate({ id, liked: likedIds.has(id) });
  };

  const deleteMutation = useMutation({
    mutationFn: deletePost,
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: ["cluster-posts"] });
      const prev = qc.getQueryData<FeedPost[]>(["cluster-posts"]) ?? [];
      qc.setQueryData<FeedPost[]>(["cluster-posts"], prev.filter((p) => p.id !== id));
      return { prev };
    },
    onError: (e: Error, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(["cluster-posts"], ctx.prev);
      toast.error(e.message || "Could not delete post");
    },
    onSuccess: () => {
      toast.success("Post deleted");
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["cluster-posts"] });
      setPendingDeleteId(null);
    },
  });

  const name = firstName(profile?.full_name, profile?.display_name);
  const locationParts = [profile?.building, profile?.neighbourhood].filter(Boolean) as string[];
  const locationLabel = locationParts.length > 0 ? locationParts.join(" · ") : "Set your location";
  const isVerified = profile?.verification_status === "approved";
  const isPending = profile?.verification_status === "pending";

  const filteredPosts = useMemo(() => {
    if (activeCategory === "all") return posts;
    const map: Record<string, string[]> = {
      help: ["Help", "Borrow", "Ride", "Errand"],
      offer: ["Offer", "Offers"],
      events: ["Event", "Events"],
      lost: ["Lost", "Lost & found"],
      share: ["Share", "Other"],
    };
    const allowed = map[activeCategory] ?? [];
    return posts.filter((p) => allowed.includes(p.category));
  }, [posts, activeCategory]);

  const handleEdit = (id: string) => {
    navigate({ to: "/create-request", search: { edit: id } });
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

      {/* Filters */}
      <div className="px-4 pt-3 pb-2">
        <CategoryFilter
          categories={categories}
          value={activeCategory}
          onChange={setActiveCategory}
        />
      </div>

      {/* Feed */}
      <main className="flex flex-1 flex-col gap-3 px-4 pb-28">
        <SafetyCard title="Stay safe & kind">
          Meet new neighbours in shared spaces and never share keys or payment
          details over chat.
        </SafetyCard>

        {filteredPosts.length === 0 ? (
          <div className="flex flex-1 items-center justify-center py-10">
            <div className="flex w-full max-w-sm flex-col items-center rounded-3xl border border-dashed border-border bg-card/60 px-6 py-10 text-center shadow-sm">
              <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                <MessageSquarePlus className="h-7 w-7" />
              </span>
              <h2 className="text-base font-semibold text-foreground">
                Nothing here yet
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {isVerified
                  ? "Be the first to share an update, ask a question, or connect with your neighbours."
                  : "You can post once your address is verified. In the meantime, browse and message neighbours."}
              </p>
              {isVerified ? (
                <Link
                  to="/create-request"
                  className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Plus className="h-4 w-4" />
                  Create a post
                </Link>
              ) : (
                <Link
                  to="/verify-address"
                  className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  Verify your address
                </Link>
              )}
            </div>
          </div>
        ) : (
          filteredPosts.map((p) => {
            const isAuthor = !!currentUserId && p.author_id === currentUserId;
            return (
              <PostCard
                key={p.id}
                expandable
                expanded={expandedId === p.id}
                onToggle={toggleExpanded}
                canManage={isAuthor}
                onEdit={handleEdit}
                onDelete={(id) => setPendingDeleteId(id)}
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
                  likes: 0,
                  comments: 0,
                  urgency: p.urgency,
                }}
              />
            );
          })
        )}
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
