import { Link, useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  BottomNav,
  MessageThreadItem,
  type MessageThread,
} from "./patterns";
import { MobileShell } from "./patterns/shell";
import { fetchConversations, formatTimeAgo } from "@/lib/messaging";

export default function Messages() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (mounted) setUserId(data.user?.id ?? null);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const { data: conversations, isLoading } = useQuery({
    queryKey: ["conversations", userId],
    queryFn: () => fetchConversations(userId!),
    enabled: !!userId,
    staleTime: 0,
  });

  const threads: MessageThread[] = (conversations ?? []).map((c) => ({
    id: c.partnerId,
    name: c.partnerName,
    avatar: c.partnerAvatar ?? undefined,
    preview: c.lastMessage,
    timeAgo: formatTimeAgo(c.lastMessageAt),
    unread: c.unreadCount || undefined,
    postContext: c.postContext
      ? {
          available: c.postContext.available,
          categoryLabel: c.postContext.categoryLabel,
          title: c.postContext.title,
          imageUrl: c.postContext.imageUrl,
        }
      : null,
  }));

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
        {isLoading && (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Loading conversations…
          </p>
        )}
        {!isLoading &&
          filtered.map((t, idx) => {
            const source = (conversations ?? [])[idx];
            return (
              <MessageThreadItem
                key={source?.conversationId ?? t.id || t.preview}
                thread={t}
                onClick={(id) => {
                  if (!id || !source) return;
                  navigate({
                    to: "/chat/$id",
                    params: { id },
                    search: {
                      conv: source.conversationId,
                      ...(source.postContext?.available
                        ? { post: source.postContext.postId }
                        : {}),
                    },
                  });
                }}
              />
            );
          })}
        {!isLoading && filtered.length === 0 && (
          <div className="px-4 py-12 text-center">
            <p className="text-sm font-medium text-foreground">No conversations yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Open a neighbour's profile and tap{" "}
              <Link to="/browse" className="underline">
                Message
              </Link>{" "}
              to start chatting.
            </p>
          </div>
        )}
      </main>

      <BottomNav activeId="messages" />
    </MobileShell>
  );
}
