import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Plus, Search, SlidersHorizontal } from "lucide-react";
import {
  BottomNav,
  CategoryFilter,
  PostCard,
  type Category,
  type Post,
} from "./patterns";
import { MobileShell } from "./patterns/shell";

const categories: Category[] = [
  { id: "all", label: "All" },
  { id: "help", label: "Help" },
  { id: "offer", label: "Offers" },
  { id: "events", label: "Events" },
  { id: "lost", label: "Lost & found" },
];

const requests: (Post & { urgency?: "low" | "medium" | "high" })[] = [
  {
    id: "r1",
    author: { name: "Hana Okafor", verified: true },
    category: "Help",
    timeAgo: "5 min ago",
    title: "Pick up groceries from corner shop?",
    body: "Sprained my ankle yesterday. Just need bread, milk, and eggs — happy to pay back via card.",
    likes: 3,
    comments: 1,
    urgency: "high",
  },
  {
    id: "r2",
    author: { name: "Tomás Reyes" },
    category: "Help",
    timeAgo: "30 min ago",
    title: "Ride to vet at 4pm?",
    body: "Cat needs a check-up. Vet is 10 min away. Will cover fuel + a coffee.",
    likes: 5,
    comments: 2,
    urgency: "medium",
  },
  {
    id: "r3",
    author: { name: "Priya Singh", verified: true },
    category: "Offers",
    timeAgo: "1 h ago",
    title: "Free piano lessons for kids — Saturdays",
    body: "Music teacher here, offering 30-min sessions. First come first served, age 6+.",
    likes: 18,
    comments: 7,
    urgency: "low",
  },
  {
    id: "r4",
    author: { name: "Noah Klein" },
    category: "Help",
    timeAgo: "2 h ago",
    title: "Borrow a drill for an hour?",
    body: "Hanging a shelf in the living room. Returning it the same evening.",
    likes: 2,
    comments: 0,
    urgency: "low",
  },
];

const urgencyTone: Record<string, string> = {
  high: "bg-destructive/10 text-destructive",
  medium: "bg-accent/50 text-accent-foreground",
  low: "bg-secondary text-secondary-foreground",
};

export default function Browse() {
  const [active, setActive] = useState("all");
  const [query, setQuery] = useState("");

  const filtered = requests.filter((r) => {
    const matchCat =
      active === "all" ||
      r.category?.toLowerCase().startsWith(
        categories.find((c) => c.id === active)?.label.toLowerCase().slice(0, 3) ?? "",
      );
    const q = query.trim().toLowerCase();
    const matchQ =
      !q ||
      r.title?.toLowerCase().includes(q) ||
      r.body.toLowerCase().includes(q) ||
      r.author.name.toLowerCase().includes(q);
    return matchCat && matchQ;
  });

  return (
    <MobileShell>
      <header className="sticky top-0 z-20 bg-background/85 px-4 pt-4 pb-3 backdrop-blur">
        <div className="mb-3 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Browse</h1>
          <span className="text-xs text-muted-foreground">Cluster D18</span>
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
        {filtered.map((r) => (
          <Link
            key={r.id}
            to="/request/$id"
            params={{ id: r.id }}
            className="block"
          >
            <div className="relative">
              {r.urgency && (
                <span
                  className={`absolute top-3 right-3 z-10 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${urgencyTone[r.urgency]}`}
                >
                  {r.urgency}
                </span>
              )}
              <PostCard post={r} />
            </div>
          </Link>
        ))}
        {filtered.length === 0 && (
          <p className="py-12 text-center text-sm text-muted-foreground">
            No matches — try a different category.
          </p>
        )}
      </main>

      <FloatingActionButton />
      <BottomNav activeId="explore" />
    </MobileShell>
  );
}
