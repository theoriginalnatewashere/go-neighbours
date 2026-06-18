import { Link, useParams } from "@tanstack/react-router";
import { Clock, Flag, Heart, MapPin, MessageCircle, Share2 } from "lucide-react";
import {
  NeighborAvatar,
  SafetyCard,
  TrustBadge,
} from "./patterns";
import { MobileShell, PrimaryButton, ScreenHeader } from "./patterns/shell";

const mock = {
  author: { name: "Hana Okafor", verified: true, cluster: "D18 · Greenview" },
  category: "Asks for help",
  timeAgo: "5 min ago",
  title: "Pick up groceries from corner shop?",
  body: `I sprained my ankle yesterday and can't make it down the stairs comfortably. Just looking for someone heading to the corner shop today who could grab a few essentials for me — bread, milk, and eggs.\n\nHappy to send the money over right away or pay you back in cash. Thanks so much, neighbours 🙏`,
  location: "Greenview Heights, Block C",
  responses: 3,
};

export default function RequestDetail() {
  const { id } = useParams({ from: "/request/$id" });

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
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <NeighborAvatar
              name={mock.author.name}
              verified={mock.author.verified}
              size="lg"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">
                {mock.author.name}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {mock.author.cluster}
              </p>
            </div>
            <TrustBadge level="verified" />
          </div>

          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-accent/40 px-3 py-1 text-[11px] font-medium text-accent-foreground">
            {mock.category}
          </div>

          <h2 className="mt-3 text-lg font-semibold leading-snug">
            {mock.title}
          </h2>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-foreground/90">
            {mock.body}
          </p>

          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {mock.timeAgo}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              {mock.location}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MessageCircle className="h-3.5 w-3.5" />
              {mock.responses} responses
            </span>
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
      </main>

      <div className="sticky bottom-0 z-20 border-t border-border bg-background/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
        <Link to="/chat/$id" params={{ id }}>
          <PrimaryButton icon={MessageCircle}>I can help</PrimaryButton>
        </Link>
      </div>
    </MobileShell>
  );
}
