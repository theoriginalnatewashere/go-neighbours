import { supabase } from "@/integrations/supabase/client";

export type PostContext = {
  postId: string;
  available: boolean;
  category: string | null;
  categoryLabel: string;
  title: string;
  imageUrl: string | null;
};

export type ConversationSummary = {
  conversationId: string;
  partnerId: string;
  partnerName: string;
  partnerAvatar: string | null;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  postContext: PostContext | null;
};

export type ChatMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;
};

export async function getOrCreateConversation(
  otherUserId: string,
  postId?: string | null,
): Promise<string> {
  const { data, error } = await supabase.rpc("get_or_create_direct_conversation", {
    _other: otherUserId,
    ...(postId ? { _post: postId } : {}),
  });
  if (error) throw error;
  return data as string;
}

export function normalizeCategoryLabel(category: string | null | undefined): string {
  if (!category) return "Post";
  const raw = category.toLowerCase().replace(/[\s_-]+/g, " ").trim();
  if (raw === "help" || raw === "helps" || raw === "request") return "Help";
  if (raw === "offer" || raw === "offers") return "Offer";
  if (raw === "event" || raw === "events") return "Event";
  if (raw === "lost found" || raw === "lost and found" || raw === "lostfound")
    return "Lost & Found";
  if (raw === "share" || raw === "shares") return "Share";
  if (raw === "other") return "Other";
  return category.charAt(0).toUpperCase() + category.slice(1);
}

function excerpt(text: string, max = 55): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return clean.slice(0, max - 1).trimEnd() + "…";
}

export async function fetchPostContext(postId: string): Promise<PostContext> {
  const { data } = await supabase
    .from("posts")
    .select("id, category, title, body, image_urls")
    .eq("id", postId)
    .maybeSingle();

  if (!data) {
    return {
      postId,
      available: false,
      category: null,
      categoryLabel: "",
      title: "Original post removed",
      imageUrl: null,
    };
  }

  const images = Array.isArray(data.image_urls) ? (data.image_urls as string[]) : [];
  const firstImage = images.find((u) => typeof u === "string" && u.length > 0) ?? null;
  const displayTitle = data.title?.trim()
    ? excerpt(data.title, 60)
    : excerpt(data.body ?? "", 55);

  return {
    postId,
    available: true,
    category: data.category,
    categoryLabel: normalizeCategoryLabel(data.category),
    title: displayTitle || "View post",
    imageUrl: firstImage,
  };
}

async function fetchPostContextsMap(
  postIds: string[],
): Promise<Map<string, PostContext>> {
  const map = new Map<string, PostContext>();
  if (postIds.length === 0) return map;
  const { data } = await supabase
    .from("posts")
    .select("id, category, title, body, image_urls")
    .in("id", postIds);

  const foundIds = new Set<string>();
  for (const row of data ?? []) {
    foundIds.add(row.id);
    const images = Array.isArray(row.image_urls) ? (row.image_urls as string[]) : [];
    const firstImage = images.find((u) => typeof u === "string" && u.length > 0) ?? null;
    const displayTitle = row.title?.trim()
      ? excerpt(row.title, 60)
      : excerpt(row.body ?? "", 55);
    map.set(row.id, {
      postId: row.id,
      available: true,
      category: row.category,
      categoryLabel: normalizeCategoryLabel(row.category),
      title: displayTitle || "View post",
      imageUrl: firstImage,
    });
  }
  // Fill in unavailable posts (deleted or hidden by RLS)
  for (const id of postIds) {
    if (!foundIds.has(id)) {
      map.set(id, {
        postId: id,
        available: false,
        category: null,
        categoryLabel: "",
        title: "Original post removed",
        imageUrl: null,
      });
    }
  }
  return map;
}

export async function getConversationPostContext(
  conversationId: string,
): Promise<PostContext | null> {
  const { data } = await supabase
    .from("conversations")
    .select("post_id")
    .eq("id", conversationId)
    .maybeSingle();
  if (!data?.post_id) return null;
  return fetchPostContext(data.post_id);
}

export async function fetchConversations(userId: string): Promise<ConversationSummary[]> {
  const { data: myParts, error: mpErr } = await supabase
    .from("conversation_participants")
    .select("conversation_id, last_read_at, conversations(last_message_at, post_id)")
    .eq("user_id", userId);
  if (mpErr) throw mpErr;
  if (!myParts || myParts.length === 0) return [];

  const conversationIds = myParts.map((p) => p.conversation_id);
  const postIdByConv = new Map<string, string | null>();
  for (const p of myParts) {
    postIdByConv.set(
      p.conversation_id,
      (p.conversations as { post_id: string | null } | null)?.post_id ?? null,
    );
  }

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

  // Batch post contexts
  const postIds = Array.from(
    new Set(
      Array.from(postIdByConv.values()).filter((v): v is string => typeof v === "string"),
    ),
  );
  const postCtxMap = await fetchPostContextsMap(postIds);

  const summaries: ConversationSummary[] = conversationIds.map((cid) => {
    const partner = partnerMap.get(cid);
    const last = lastByConv.get(cid);
    const postId = postIdByConv.get(cid) ?? null;
    return {
      conversationId: cid,
      partnerId: partner?.userId ?? "",
      partnerName: partner?.name ?? "Neighbour",
      partnerAvatar: partner?.avatar ?? null,
      lastMessage: last?.body ?? "Say hello 👋",
      lastMessageAt:
        last?.createdAt ??
        ((myParts.find((p) => p.conversation_id === cid)?.conversations as { last_message_at?: string } | null)
          ?.last_message_at ??
          new Date().toISOString()),
      unreadCount: unreadByConv.get(cid) ?? 0,
      postContext: postId ? postCtxMap.get(postId) ?? null : null,
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
