import { Link, useParams } from "@tanstack/react-router";
import { MapPin, MessageCircle, Star } from "lucide-react";
import { NeighborAvatar, PostCard, TrustBadge, type Post } from "./patterns";
import { MobileShell, PrimaryButton, ScreenHeader } from "./patterns/shell";

const recent: Post[] = [
  {
    id: "n1",
    author: { name: "Hana Okafor", verified: true },
    category: "Help",
    timeAgo: "5 min ago",
    title: "Pick up groceries from corner shop?",
    body: "Sprained my ankle — bread, milk, eggs would be a lifesaver.",
    likes: 3,
    comments: 1,
  },
  {
    id: "n2",
    author: { name: "Hana Okafor", verified: true },
    category: "Offers",
    timeAgo: "Last week",
    title: "Spare jigsaw puzzles — kids' age",
    body: "A pile by the lobby table — first come first served.",
    likes: 11,
    comments: 3,
  },
];

export default function NeighborProfile() {
  const { id } = useParams({ from: "/neighbor/$id" });

  return (
    <MobileShell>
      <ScreenHeader title="Neighbour" backTo="/browse" />

      <main className="flex-1 space-y-4 px-4 pb-32">
        <section className="flex flex-col items-center rounded-2xl border border-border bg-card p-5 text-center shadow-sm">
          <NeighborAvatar name="Hana Okafor" size="lg" verified />
          <h2 className="mt-3 text-lg font-semibold">Hana Okafor</h2>
          <p className="text-xs text-muted-foreground">she/her · joined Apr 2024</p>
          <div className="mt-2 inline-flex items-center gap-2">
            <TrustBadge level="verified" />
            <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground">
              <Star className="h-3 w-3" /> 4.9 · 22 helps
            </span>
          </div>
          <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            Cluster D18 · Greenview Heights
          </p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-foreground/85">
            Mum of two, plant lover, slow runner. Happy to lend tools or watch
            a parcel — just shout.
          </p>
        </section>

        <section>
          <h3 className="mb-2 text-sm font-semibold">Skills & interests</h3>
          <div className="flex flex-wrap gap-2">
            {["Gardening", "Babysitting", "Bike repair", "Cooking", "Languages"].map(
              (s) => (
                <span
                  key={s}
                  className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground"
                >
                  {s}
                </span>
              ),
            )}
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold">Recent activity</h3>
          {recent.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </section>
      </main>

      <div className="sticky bottom-0 z-20 border-t border-border bg-background/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
        <Link to="/chat/$id" params={{ id }}>
          <PrimaryButton icon={MessageCircle}>Message</PrimaryButton>
        </Link>
      </div>
    </MobileShell>
  );
}
