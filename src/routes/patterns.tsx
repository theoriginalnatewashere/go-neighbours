import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  BottomNav,
  CategoryFilter,
  FloatingActionButton,
  MessageThreadItem,
  NotificationItem,
  PostCard,
  SafetyCard,
  TrustBadge,
} from "@/app/components/patterns";

export const Route = createFileRoute("/patterns")({
  head: () => ({
    meta: [
      { title: "UI Patterns · Go Neighbours" },
      {
        name: "description",
        content: "Reusable UI patterns for the Go Neighbours community app.",
      },
    ],
  }),
  component: PatternsPage,
});

const categories = [
  { id: "all", label: "All" },
  { id: "help", label: "Help" },
  { id: "share", label: "Share" },
  { id: "events", label: "Events" },
  { id: "lost", label: "Lost & Found" },
];

function PatternsPage() {
  const [cat, setCat] = useState("all");

  return (
    <div className="mx-auto flex min-h-svh max-w-md flex-col bg-background">
      <header className="px-4 pt-6 pb-3">
        <h1 className="text-2xl font-bold tracking-tight">UI Patterns</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Reusable building blocks for Go Neighbours.
        </p>
      </header>

      <main className="flex-1 space-y-6 px-4 pb-28">
        <Section title="CategoryFilter">
          <CategoryFilter
            categories={categories}
            value={cat}
            onChange={setCat}
          />
        </Section>

        <Section title="PostCard">
          <PostCard
            post={{
              id: "1",
              author: { name: "Maya Chen", verified: true },
              category: "Help",
              timeAgo: "2h ago",
              title: "Borrowing a ladder this weekend?",
              body: "Hi neighbors! Anyone has a 6ft ladder I could borrow Saturday morning to fix a curtain rod? Happy to return with cookies.",
              likes: 12,
              comments: 4,
            }}
          />
        </Section>

        <Section title="TrustBadge">
          <div className="flex flex-wrap gap-2">
            <TrustBadge level="verified" />
            <TrustBadge level="trusted" />
            <TrustBadge level="new" />
          </div>
        </Section>

        <Section title="MessageThreadItem">
          <div className="rounded-2xl border border-border bg-card p-1.5">
            <MessageThreadItem
              thread={{
                id: "t1",
                name: "Alex Park",
                verified: true,
                preview: "Sounds great, see you at 5!",
                timeAgo: "12m",
                unread: 2,
              }}
            />
            <MessageThreadItem
              thread={{
                id: "t2",
                name: "Building 4B Group",
                preview: "Reminder: hallway cleaning tomorrow.",
                timeAgo: "1h",
              }}
            />
          </div>
        </Section>

        <Section title="NotificationItem">
          <div className="rounded-2xl border border-border bg-card p-1.5">
            <NotificationItem
              notification={{
                id: "n1",
                kind: "like",
                title: "Sara liked your post",
                description: "“Borrowing a ladder this weekend?”",
                timeAgo: "5m ago",
              }}
            />
            <NotificationItem
              notification={{
                id: "n2",
                kind: "system",
                title: "Your profile is now verified",
                description: "You can now post in trusted neighbor channels.",
                timeAgo: "Yesterday",
                read: true,
              }}
            />
          </div>
        </Section>

        <Section title="SafetyCard">
          <SafetyCard title="Stay safe when meeting up">
            Meet in shared spaces like the lobby or courtyard. Never share keys
            or financial info with neighbors you just met.
          </SafetyCard>
        </Section>
      </main>

      <FloatingActionButton onClick={() => {}} />
      <BottomNav activeId="home" />
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {title}
      </h2>
      {children}
    </section>
  );
}
