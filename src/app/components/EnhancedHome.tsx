import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Bell, MapPin, MessageSquarePlus, Plus, Search } from "lucide-react";
import {
  BottomNav,
  CategoryFilter,
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


export default function EnhancedHome() {
  const [activeCategory, setActiveCategory] = useState("all");

  const filtered =
    activeCategory === "all"
      ? posts
      : posts.filter((p) =>
          p.category?.toLowerCase().startsWith(
            categories.find((c) => c.id === activeCategory)?.label.toLowerCase().slice(0, 4) ?? "",
          ),
        );

  return (
    <div className="relative mx-auto flex min-h-screen w-[393px] max-w-full flex-col bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-20 bg-background/85 px-4 pt-4 pb-3 backdrop-blur">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground">Good morning</p>
            <h1 className="truncate text-lg font-semibold">Hi, Sam 👋</h1>
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
          <div className="inline-flex items-center gap-2 text-sm font-medium text-accent-foreground">
            <MapPin className="h-4 w-4" />
            Cluster D18 · Greenview Heights
          </div>
          <TrustBadge level="verified" label="Verified" />
        </div>
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
      <main className="flex-1 space-y-3 px-4 pb-28">
        <SafetyCard title="Stay safe & kind">
          Meet new neighbours in shared spaces and never share keys or payment
          details over chat.
        </SafetyCard>

        {filtered.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}

        {filtered.length === 0 && (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Nothing here yet — be the first to post in this category.
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
      <BottomNav activeId="home" />
    </div>
  );
}
