import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Image as ImageIcon, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { NeighborAvatar } from "./patterns";
import { MobileShell, ScreenHeader } from "./patterns/shell";
import { cn } from "@/lib/utils";
import {
  fetchMessages,
  formatClock,
  getOrCreateConversation,
  markConversationRead,
  sendMessage,
  type ChatMessage,
} from "@/lib/messaging";
import { triggerMessagePush } from "@/lib/pushNotifications";

export default function Chat() {
  const { id: otherUserId } = useParams({ from: "/_authenticated/chat/$id" });
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [resolving, setResolving] = useState(true);
  const [partnerName, setPartnerName] = useState("Neighbour");
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Resolve current user + conversation
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!mounted) return;
      if (!u.user) {
        setResolving(false);
        return;
      }
      setUserId(u.user.id);
      try {
        const convId = await getOrCreateConversation(otherUserId);
        if (!mounted) return;
        setConversationId(convId);
        // Fetch partner display name via the security-definer RPC
        const { data: partners } = await supabase.rpc("get_conversation_partners");
        const partner = (partners ?? []).find(
          (p: { conversation_id: string; user_id: string; display_name: string | null; full_name: string | null }) =>
            p.conversation_id === convId,
        );
        if (partner) {
          setPartnerName(partner.full_name || partner.display_name || "Neighbour");
        }
      } catch (err) {
        console.error(err);
        toast.error("Couldn't open this conversation");
      } finally {
        if (mounted) setResolving(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [otherUserId]);

  const { data: messages = [] } = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: () => fetchMessages(conversationId!),
    enabled: !!conversationId,
    staleTime: 0,
  });

  // Realtime subscription
  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const m = payload.new as {
            id: string;
            conversation_id: string;
            sender_id: string;
            body: string;
            created_at: string;
          };
          queryClient.setQueryData<ChatMessage[]>(
            ["messages", conversationId],
            (prev = []) => {
              if (prev.some((x) => x.id === m.id)) return prev;
              return [
                ...prev,
                {
                  id: m.id,
                  conversationId: m.conversation_id,
                  senderId: m.sender_id,
                  body: m.body,
                  createdAt: m.created_at,
                },
              ];
            },
          );
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [conversationId, queryClient]);

  // Mark read whenever messages change
  useEffect(() => {
    if (conversationId && userId && messages.length) {
      void markConversationRead(conversationId, userId).then(() => {
        queryClient.invalidateQueries({ queryKey: ["conversations", userId] });
      });
    }
  }, [conversationId, userId, messages.length, queryClient]);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages.length]);

  const send = async () => {
    if (!text.trim() || !conversationId || !userId || sending) return;
    setSending(true);
    const body = text.trim();
    setText("");
    try {
      const msg = await sendMessage(conversationId, userId, body);
      queryClient.setQueryData<ChatMessage[]>(
        ["messages", conversationId],
        (prev = []) => (prev.some((x) => x.id === msg.id) ? prev : [...prev, msg]),
      );
      queryClient.invalidateQueries({ queryKey: ["conversations", userId] });
    } catch (err) {
      console.error(err);
      toast.error("Couldn't send message");
      setText(body);
    } finally {
      setSending(false);
    }
  };

  return (
    <MobileShell>
      <ScreenHeader
        backTo="/messages"
        rightSlot={
          <Link to="/neighbor/$id" params={{ id: otherUserId }}>
            <NeighborAvatar name={partnerName} size="sm" />
          </Link>
        }
        title={partnerName}
        subtitle="Direct message"
      />

      <main
        ref={scrollRef}
        className="flex-1 space-y-2 overflow-y-auto px-4 pt-2 pb-4"
      >
        {resolving && (
          <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading conversation…
          </div>
        )}
        {!resolving && !conversationId && (
          <div className="py-12 text-center text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Conversation unavailable</p>
            <p className="mt-1">
              This chat may have been removed or you don't have access to it.
            </p>
            <Link to="/messages" className="mt-3 inline-block text-primary underline">
              Back to Messages
            </Link>
          </div>
        )}
        {!resolving && conversationId && messages.length === 0 && (
          <p className="py-12 text-center text-sm text-muted-foreground">
            No messages yet. Say hello 👋
          </p>
        )}
        {messages.map((m) => {
          const mine = m.senderId === userId;
          return (
            <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[78%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed shadow-sm",
                  mine
                    ? "rounded-br-md bg-primary text-primary-foreground"
                    : "rounded-bl-md bg-card text-foreground",
                )}
              >
                <p className="whitespace-pre-wrap break-words">{m.body}</p>
                <p
                  className={cn(
                    "mt-0.5 text-[10px]",
                    mine ? "text-primary-foreground/70" : "text-muted-foreground",
                  )}
                >
                  {formatClock(m.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
      </main>

      <div className="sticky bottom-0 z-20 border-t border-border bg-background/95 px-3 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] backdrop-blur">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Attach"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-card text-muted-foreground hover:bg-secondary"
            disabled
          >
            <ImageIcon className="h-4 w-4" />
          </button>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Message…"
            disabled={!conversationId || sending}
            className="flex-1 rounded-full border border-border bg-card px-4 py-2.5 text-sm shadow-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
          />
          <button
            type="button"
            onClick={send}
            aria-label="Send"
            disabled={!conversationId || sending || !text.trim()}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md shadow-primary/25 disabled:opacity-60"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </MobileShell>
  );
}
