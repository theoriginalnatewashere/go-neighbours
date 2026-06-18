import { useState } from "react";
import { Bell, MapPin, Search } from "lucide-react";
import {
  BottomNav,
  CategoryFilter,
  FloatingActionButton,
  PostCard,
  SafetyCard,
  TrustBadge,
  type Category,
  type Post,
} from "./patterns";

const categories: Category[] = [
  { id: "all", label: "All" },
  { id: "help", label: "Asks for help" },
  { id: "offer", label: "Offers" },
  { id: "events", label: "Events" },
  { id: "lost", label: "Lost & found" },
  { id: "share", label: "Share" },
];

const posts: Post[] = [
  {
    id: "1",
    author: { name: "Amina Yusuf", verified: true },
    category: "Asks for help",
    timeAgo: "12 min ago",
    title: "Anyone have a ladder I can borrow this weekend?",
    body: "Need to swap a lightbulb in the stairwell — would return it Sunday evening. Thanks neighbours!",
    likes: 8,
    comments: 4,
  },
  {
    id: "2",
    author: { name: "Diego Romero", verified: true },
    category: "Offers",
    timeAgo: "1 h ago",
    title: "Free sourdough starter — D18",
    body: "Made too much again. Drop me a message and I'll leave a jar by the mailboxes.",
    likes: 21,
    comments: 6,
  },
  {
    id: "3",
    author: { name: "Lin Park" },
    category: "Events",
    timeAgo: "3 h ago",
    title: "Rooftop coffee Saturday at 10",
    body: "Bringing a thermos and pastries. Come say hi if you're around — kids and dogs welcome.",
    likes: 34,
    comments: 12,
  },
  {
    id: "4",
    author: { name: "Maya Brouwer", verified: true },
    category: "Lost & found",
    timeAgo: "Yesterday",
    body: "Found a small grey cat near the bike racks. Friendly, no collar. Sheltering at #3B until owner shows up.",
    likes: 14,
    comments: 9,
  },
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

      <FloatingActionButton />
      <BottomNav activeId="home" />
    </div>
  );
}
