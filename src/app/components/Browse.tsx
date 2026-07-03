import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Plus, Search, SlidersHorizontal } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  BottomNav,
  CategoryFilter,
  PostCard,
  type Category,
} from "./patterns";
import { MobileShell } from "./patterns/shell";
import { listClusterPosts, timeAgo, type FeedPost } from "@/lib/posts";
import { likePost, unlikePost, listMyLikedPostIds } from "@/lib/likes";
import { signPostImageUrls } from "@/lib/postImages";

const categories: Category[] = [
  { id: "all", label: "All" },
  { id: "help", label: "Help" },
  { id: "offer", label: "Offers" },
  { id: "events", label: "Events" },
  { id: "lost", label: "Lost & found" },
  { id: "share", label: "Share" },
];

const urgencyTone: Record<string, string> = {
  high: "bg-destructive/10 text-destructive",
  medium: "bg-accent/50 text-accent-foreground",
  low: "bg-secondary text-secondary-foreground",
};

const categoryMap: Record<string, string[]> = {
  help: ["Help", "Borrow", "Ride", "Errand"],
  offer: ["Offer", "Offers"],
  events: ["Event", "Events"],
  lost: ["Lost", "Lost & found"],
  share: ["Share", "Other"],
};

export default function Browse() {
  const [active, setActive] = useState("all");
  const [query, setQuery] = useState("");
  const qc = useQueryClient();

  // RLS on `posts` restricts results to the signed-in user's cluster.
  const { data: posts = [], isLoading } = useQuery<FeedPost[]>({
    queryKey: ["cluster-posts"],
    queryFn: listClusterPosts,
    staleTime: 0,
  });

  const previewPaths = posts
    .map((p) => p.image_urls[0])
    .filter((x): x is string => !!x);
  const { data: previewUrls = [] } = useQuery({
    queryKey: ["cluster-preview-images", previewPaths.join("|")],
    queryFn: () => signPostImageUrls(previewPaths),
    enabled: previewPaths.length > 0,
    staleTime: 30 * 60 * 1000,
  });
  const previewByPath = new Map(previewPaths.map((p, i) => [p, previewUrls[i]]));

  const { data: likedIds = new Set<string>() } = useQuery({
    queryKey: ["my-liked-ids"],
    queryFn: listMyLikedPostIds,
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

  const handleLike = (id: string) => toggleLike.mutate({ id, liked: likedIds.has(id) });

  const filtered = useMemo(() => {
    const allowed = active === "all" ? null : categoryMap[active] ?? [];
    const q = query.trim().toLowerCase();
    return posts.filter((p) => {
      const matchCat = !allowed || allowed.includes(p.category);
      const matchQ =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.body.toLowerCase().includes(q) ||
        (p.author_name ?? "").toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  }, [posts, active, query]);

  return (
    <MobileShell>
      <header className="sticky top-0 z-20 bg-background/85 px-4 pt-4 pb-3 backdrop-blur">
        <div className="mb-3 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Browse</h1>
          <span className="text-xs text-muted-foreground">Your cluster</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-full bg-card px-3.5 py-2.5 shadow-sm">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search neighbours, requests…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <button
            type="button"
            aria-label="Filters"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-card text-foreground shadow-sm hover:bg-secondary"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="px-4 pt-3 pb-2">
        <CategoryFilter
          categories={categories}
          value={active}
          onChange={setActive}
        />
      </div>

      <main className="flex-1 space-y-3 px-4 pb-28">
        {filtered.map((p) => (
          <Link
            key={p.id}
            to="/request/$id"
            params={{ id: p.id }}
            className="block"
          >
            <div className="relative">
              {p.urgency && (
                <span
                  className={`absolute top-3 right-3 z-10 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${urgencyTone[p.urgency]}`}
                >
                  {p.urgency}
                </span>
              )}
              <PostCard
                onLike={handleLike}
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
            </div>
          </Link>
        ))}
        {!isLoading && filtered.length === 0 && (
          <p className="py-12 text-center text-sm text-muted-foreground">
            {posts.length === 0
              ? "No posts in your cluster yet — be the first to share."
              : "No matches — try a different category."}
          </p>
        )}
      </main>

      <Link
        to="/create-request"
        aria-label="Create request"
        className="fixed right-5 bottom-24 z-30 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform hover:scale-105 active:scale-95"
      >
        <Plus className="h-6 w-6" />
      </Link>
      <BottomNav activeId="explore" />
    </MobileShell>
  );
}
