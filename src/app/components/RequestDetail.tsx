import { Link, useParams } from "@tanstack/react-router";
import { Clock, Flag, Heart, MapPin, MessageCircle, Share2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  NeighborAvatar,
  SafetyCard,
  TrustBadge,
} from "./patterns";
import { MobileShell, PrimaryButton, ScreenHeader } from "./patterns/shell";
import { getPost, timeAgo } from "@/lib/posts";

export default function RequestDetail() {
  const { id } = useParams({ from: "/_authenticated/request/$id" });

  // RLS returns null when the post is in another cluster, so cross-cluster
  // URL access is blocked at the database, not in the UI.
  const { data: post, isLoading } = useQuery({
    queryKey: ["post", id],
    queryFn: () => getPost(id),
    staleTime: 0,
  });

  return (
    <MobileShell>
      <ScreenHeader
        title="Request"
        backTo="/browse"
        rightSlot={
          <button
            type="button"
            aria-label="Share"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-sm hover:bg-secondary"
          >
            <Share2 className="h-4 w-4" />
          </button>
        }
      />

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
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary"
              >
                <Heart className="h-4 w-4" />
                Save
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

      {post && (
        <div className="sticky bottom-0 z-20 border-t border-border bg-background/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
          <Link to="/chat/$id" params={{ id }}>
            <PrimaryButton icon={MessageCircle}>I can help</PrimaryButton>
          </Link>
        </div>
      )}
    </MobileShell>
  );
}
