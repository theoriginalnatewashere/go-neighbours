import { Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useState } from "react";
import {
  BottomNav,
  MessageThreadItem,
  type MessageThread,
} from "./patterns";
import { MobileShell } from "./patterns/shell";

const threads: MessageThread[] = [
  {
    id: "t1",
    name: "Hana Okafor",
    verified: true,
    preview: "Thank you so much! I'm in flat 4B 🙏",
    timeAgo: "2m",
    unread: 2,
  },
  {
    id: "t2",
    name: "Diego Romero",
    verified: true,
    preview: "Jar's by the mailboxes — enjoy!",
    timeAgo: "1h",
  },
  {
    id: "t3",
    name: "Lin Park",
    preview: "Coffee tomorrow then? ☕️",
    timeAgo: "Yesterday",
    unread: 1,
  },
  {
    id: "t4",
    name: "Tomás Reyes",
    preview: "Vet went well, thanks again for the lift.",
    timeAgo: "Mon",
  },
  {
    id: "t5",
    name: "Maya Brouwer",
    verified: true,
    preview: "Owner picked up the cat 🐈",
    timeAgo: "Sun",
  },
];

export default function Messages() {
  const [query, setQuery] = useState("");
  const filtered = threads.filter(
    (t) =>
      !query ||
      t.name.toLowerCase().includes(query.toLowerCase()) ||
      t.preview.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <MobileShell>
      <header className="sticky top-0 z-20 bg-background/85 px-4 pt-4 pb-3 backdrop-blur">
        <h1 className="mb-3 text-xl font-semibold">Messages</h1>
        <div className="flex items-center gap-2 rounded-full bg-card px-3.5 py-2.5 shadow-sm">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search conversations"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
      </header>

      <main className="flex-1 px-2 pt-2 pb-28">
        {filtered.map((t) => (
          <Link key={t.id} to="/chat/$id" params={{ id: t.id }} className="block">
            <MessageThreadItem thread={t} />
          </Link>
        ))}
        {filtered.length === 0 && (
          <p className="py-12 text-center text-sm text-muted-foreground">
            No conversations yet.
          </p>
        )}
      </main>

      <BottomNav activeId="messages" />
    </MobileShell>
  );
}
