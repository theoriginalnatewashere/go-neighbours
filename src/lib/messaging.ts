import { supabase } from "@/integrations/supabase/client";

export type ConversationSummary = {
  conversationId: string;
  partnerId: string;
  partnerName: string;
  partnerAvatar: string | null;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
};

export type ChatMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;
};

export async function getOrCreateConversation(otherUserId: string): Promise<string> {
  const { data, error } = await supabase.rpc("get_or_create_direct_conversation", {
    _other: otherUserId,
  });
  if (error) throw error;
  return data as string;
}

export async function fetchConversations(userId: string): Promise<ConversationSummary[]> {
  // Get my participant rows (incl last_read_at) and conversation last_message_at
  const { data: myParts, error: mpErr } = await supabase
    .from("conversation_participants")
    .select("conversation_id, last_read_at, conversations(last_message_at)")
    .eq("user_id", userId);
  if (mpErr) throw mpErr;
  if (!myParts || myParts.length === 0) return [];

  const conversationIds = myParts.map((p) => p.conversation_id);

  // Partners
  const { data: partners, error: pErr } = await supabase.rpc("get_conversation_partners");
  if (pErr) throw pErr;
  const partnerMap = new Map<string, { userId: string; name: string; avatar: string | null }>();
  for (const row of (partners ?? []) as Array<{
    conversation_id: string;
    user_id: string;
    display_name: string | null;
    full_name: string | null;
    avatar_url: string | null;
  }>) {
    partnerMap.set(row.conversation_id, {
      userId: row.user_id,
      name: row.full_name || row.display_name || "Neighbour",
      avatar: row.avatar_url,
    });
  }

  // Latest message + counts per conversation
  const { data: msgs, error: mErr } = await supabase
    .from("messages")
    .select("id, conversation_id, sender_id, body, created_at")
    .in("conversation_id", conversationIds)
    .order("created_at", { ascending: false });
  if (mErr) throw mErr;

  const lastByConv = new Map<string, { body: string; createdAt: string }>();
  const unreadByConv = new Map<string, number>();
  const lastReadMap = new Map<string, string>(
    myParts.map((p) => [p.conversation_id, p.last_read_at]),
  );

  for (const m of msgs ?? []) {
    if (!lastByConv.has(m.conversation_id)) {
      lastByConv.set(m.conversation_id, { body: m.body, createdAt: m.created_at });
    }
    if (m.sender_id !== userId) {
      const lastRead = lastReadMap.get(m.conversation_id);
      if (!lastRead || new Date(m.created_at) > new Date(lastRead)) {
        unreadByConv.set(m.conversation_id, (unreadByConv.get(m.conversation_id) ?? 0) + 1);
      }
    }
  }

  const summaries: ConversationSummary[] = conversationIds.map((cid) => {
    const partner = partnerMap.get(cid);
    const last = lastByConv.get(cid);
    return {
      conversationId: cid,
      partnerId: partner?.userId ?? "",
      partnerName: partner?.name ?? "Neighbour",
      partnerAvatar: partner?.avatar ?? null,
      lastMessage: last?.body ?? "Say hello 👋",
      lastMessageAt:
        last?.createdAt ??
        (myParts.find((p) => p.conversation_id === cid)?.conversations?.last_message_at ??
          new Date().toISOString()),
      unreadCount: unreadByConv.get(cid) ?? 0,
    };
  });

  summaries.sort(
    (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime(),
  );
  return summaries;
}

export async function fetchMessages(conversationId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("id, conversation_id, sender_id, body, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((m) => ({
    id: m.id,
    conversationId: m.conversation_id,
    senderId: m.sender_id,
    body: m.body,
    createdAt: m.created_at,
  }));
}

export async function sendMessage(
  conversationId: string,
  senderId: string,
  body: string,
): Promise<ChatMessage> {
  const trimmed = body.trim();
  if (!trimmed) throw new Error("Message is empty");
  const { data, error } = await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, sender_id: senderId, body: trimmed })
    .select("id, conversation_id, sender_id, body, created_at")
    .single();
  if (error) throw error;
  return {
    id: data.id,
    conversationId: data.conversation_id,
    senderId: data.sender_id,
    body: data.body,
    createdAt: data.created_at,
  };
}

export async function markConversationRead(
  conversationId: string,
  userId: string,
): Promise<void> {
  await supabase
    .from("conversation_participants")
    .update({ last_read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .eq("user_id", userId);
}

export function formatTimeAgo(iso: string): string {
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "now";
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.floor(hr / 24);
  if (day === 1) return "Yesterday";
  if (day < 7) return `${day}d`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function formatClock(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}
