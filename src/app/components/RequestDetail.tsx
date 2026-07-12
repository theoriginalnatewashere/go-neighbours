import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { Clock, Flag, Heart, MapPin, MessageCircle, MoreHorizontal, Pencil, Share2, Trash2 } from "lucide-react";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  NeighborAvatar,
  SafetyCard,
  TrustBadge,
} from "./patterns";
import { MobileShell, PrimaryButton, ScreenHeader } from "./patterns/shell";
import { PostGallery } from "./PostGallery";
import { deletePost, getPost, timeAgo, type FeedPost } from "@/lib/posts";
import { likePost, unlikePost, listMyLikedPostIds } from "@/lib/likes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

export default function RequestDetail() {
  const { id } = useParams({ from: "/_authenticated/request/$id" });
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [confirmDelete, setConfirmDelete] = useState(false);

  // RLS returns null when the post is in another cluster, so cross-cluster
  // URL access is blocked at the database, not in the UI.
  const { data: post, isLoading } = useQuery({
    queryKey: ["post", id],
    queryFn: () => getPost(id),
    staleTime: 0,
  });

  const { data: currentUserId } = useQuery({
    queryKey: ["current-user-id"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user?.id ?? null;
    },
    staleTime: 5 * 60 * 1000,
  });

  const isAuthor = !!currentUserId && !!post && post.author_id === currentUserId;

  const { data: isAdmin = false } = useQuery({
    queryKey: ["is-admin", currentUserId],
    enabled: !!currentUserId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", currentUserId!)
        .eq("role", "admin")
        .maybeSingle();
      return !!data;
    },
  });

  const canManage = isAuthor || isAdmin;

  const { data: likedIds = new Set<string>() } = useQuery({
    queryKey: ["my-liked-ids"],
    queryFn: listMyLikedPostIds,
    staleTime: 0,
  });
  const liked = likedIds.has(id);

  const deleteMutation = useMutation({
    mutationFn: () => deletePost(id),
    onSuccess: () => {
      qc.setQueryData<FeedPost[]>(
        ["my-posts"],
        (prev) => (prev ?? []).filter((p) => p.id !== id),
      );
      qc.setQueryData<FeedPost[]>(
        ["cluster-posts"],
        (prev) => (prev ?? []).filter((p) => p.id !== id),
      );
      qc.setQueryData<FeedPost[]>(
        ["my-liked-posts"],
        (prev) => (prev ?? []).filter((p) => p.id !== id),
      );
      qc.invalidateQueries({ queryKey: ["my-posts"] });
      qc.invalidateQueries({ queryKey: ["cluster-posts"] });
      qc.invalidateQueries({ queryKey: ["my-liked-posts"] });
      toast.success("Post deleted successfully.");
      navigate({ to: "/home" });
    },
    onError: (e: Error) => {
      toast.error(e.message || "Could not delete post");
      setConfirmDelete(false);
    },
  });

  const toggleLike = useMutation({
    mutationFn: async (p: { liked: boolean }) => {
      if (p.liked) await unlikePost(id);
      else await likePost(id);
    },
    onMutate: async (p) => {
      await qc.cancelQueries({ queryKey: ["my-liked-ids"] });
      const prev = qc.getQueryData<Set<string>>(["my-liked-ids"]) ?? new Set();
      const next = new Set(prev);
      if (p.liked) next.delete(id);
      else next.add(id);
      qc.setQueryData(["my-liked-ids"], next);
      const prevPost = qc.getQueryData<FeedPost | null>(["post", id]);
      if (prevPost) {
        qc.setQueryData<FeedPost>(["post", id], {
          ...prevPost,
          likes_count: Math.max(0, prevPost.likes_count + (p.liked ? -1 : 1)),
        });
      }
      const feed = qc.getQueryData<FeedPost[]>(["cluster-posts"]);
      if (feed) {
        qc.setQueryData<FeedPost[]>(
          ["cluster-posts"],
          feed.map((x) =>
            x.id === id
              ? { ...x, likes_count: Math.max(0, x.likes_count + (p.liked ? -1 : 1)) }
              : x,
          ),
        );
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["my-liked-ids"], ctx.prev);
      toast.error("Could not update like");
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["my-liked-ids"] });
      qc.invalidateQueries({ queryKey: ["my-liked-posts"] });
      qc.invalidateQueries({ queryKey: ["cluster-posts"] });
      qc.invalidateQueries({ queryKey: ["post", id] });
    },
  });

  const rightSlot = isAuthor ? (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Post options"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-sm hover:bg-secondary"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            navigate({ to: "/create-request", search: { edit: id } });
          }}
        >
          <Pencil className="mr-2 h-4 w-4" /> Edit post
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onSelect={(e) => {
            e.preventDefault();
            setConfirmDelete(true);
          }}
        >
          <Trash2 className="mr-2 h-4 w-4" /> Delete post
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ) : (
    <button
      type="button"
      aria-label="Share"
      className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-sm hover:bg-secondary"
    >
      <Share2 className="h-4 w-4" />
    </button>
  );

  return (
    <MobileShell>
      <ScreenHeader title="Request" backTo="/browse" rightSlot={rightSlot} />

      <main className="flex-1 space-y-4 px-4 pb-32">
        {isLoading ? (
          <p className="py-12 text-center text-sm text-muted-foreground">Loading…</p>
        ) : !post ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/60 p-6 text-center shadow-sm">
            <h2 className="text-base font-semibold">Post not available</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              This post may have been removed, or it belongs to a different cluster.
            </p>
            <Link
              to="/browse"
              className="mt-4 inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              Back to Browse
            </Link>
          </div>
        ) : (
          <>
            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <NeighborAvatar
                  name={post.author_name || "Neighbour"}
                  verified={post.author_verified}
                  size="lg"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {post.author_name || "Neighbour"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {[post.building, post.cluster].filter(Boolean).join(" · ")}
                  </p>
                </div>
                {post.author_verified && <TrustBadge level="verified" />}
              </div>

              <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-accent/40 px-3 py-1 text-[11px] font-medium text-accent-foreground">
                {post.category}
              </div>

              <h2 className="mt-3 text-lg font-semibold leading-snug">
                {post.title}
              </h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-foreground/90">
                {post.body}
              </p>

              {Array.isArray(post.image_urls) && post.image_urls.length > 0 && (
                <div className="mt-4">
                  <PostGallery paths={post.image_urls} />
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  {timeAgo(post.created_at)}
                </span>
                {post.building && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    {post.building}
                  </span>
                )}
              </div>
            </div>

            <SafetyCard title="Meet in shared spaces">
              Hand-offs at the lobby or mailboxes are the safest. Never share keys
              or payment details over chat.
            </SafetyCard>

            <div className="flex items-center gap-3 px-1">
              <button
                type="button"
                onClick={() => toggleLike.mutate({ liked })}
                aria-pressed={liked}
                aria-label={liked ? "Unlike post" : "Like post"}
                className={`inline-flex items-center gap-1.5 text-sm transition-colors ${
                  liked ? "text-primary" : "text-muted-foreground hover:text-primary"
                }`}
              >
                <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
                {post.likes_count}
              </button>
              <button
                type="button"
                className="ml-auto inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive"
              >
                <Flag className="h-3.5 w-3.5" />
                Report
              </button>
            </div>
          </>
        )}
      </main>

      {post && post.author_id && !isAuthor && (
        <div className="sticky bottom-0 z-20 border-t border-border bg-background/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
          <Link to="/chat/$id" params={{ id: post.author_id }} search={{ post: post.id }}>
            <PrimaryButton icon={MessageCircle}>I can help</PrimaryButton>
          </Link>
        </div>
      )}

      <AlertDialog
        open={confirmDelete}
        onOpenChange={(open) => {
          if (!open && !deleteMutation.isPending) setConfirmDelete(false);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this post?</AlertDialogTitle>
            <AlertDialogDescription>
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
                deleteMutation.mutate();
              }}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MobileShell>
  );
}
