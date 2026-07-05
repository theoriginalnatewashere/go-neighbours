// Edge function: sends Web Push notifications to the recipients of a direct
// message. Called from the client after a message is successfully sent. Uses
// the service role client to bypass RLS so it can read participants,
// preferences and subscriptions for users other than the caller.

// deno-lint-ignore-file no-explicit-any
import webpush from "npm:web-push@3.6.7";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const VAPID_PUBLIC = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") ?? "mailto:support@goneighbours.app";

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    // Require an authenticated caller (the sender).
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }
    const userClient = createClient(SUPABASE_URL, SERVICE_ROLE, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return json({ error: "Unauthorized" }, 401);
    const senderId = userData.user.id;

    const body = await req.json().catch(() => ({}));
    const conversationId = String(body?.conversationId ?? "");
    if (!conversationId) return json({ error: "conversationId required" }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { persistSession: false },
    });

    // Confirm the sender participates in this conversation (authorization).
    const { data: senderPart } = await admin
      .from("conversation_participants")
      .select("user_id")
      .eq("conversation_id", conversationId)
      .eq("user_id", senderId)
      .maybeSingle();
    if (!senderPart) return json({ error: "Forbidden" }, 403);

    // Sender's display name for the notification body.
    const { data: senderProfile } = await admin
      .from("profiles")
      .select("full_name, display_name")
      .eq("id", senderId)
      .maybeSingle();
    const senderName =
      senderProfile?.full_name || senderProfile?.display_name || "A neighbour";

    // Recipients: other participants in the conversation.
    const { data: participants } = await admin
      .from("conversation_participants")
      .select("user_id")
      .eq("conversation_id", conversationId)
      .neq("user_id", senderId);
    const recipientIds = (participants ?? []).map((p) => p.user_id);
    if (recipientIds.length === 0) return json({ ok: true, sent: 0 });

    // Filter to recipients who opted in.
    const { data: prefs } = await admin
      .from("notification_preferences")
      .select("user_id, messages_about_posts")
      .in("user_id", recipientIds);
    const enabled = new Set(
      (prefs ?? []).filter((p) => p.messages_about_posts).map((p) => p.user_id),
    );
    const targets = recipientIds.filter((id) => enabled.has(id));
    if (targets.length === 0) return json({ ok: true, sent: 0 });

    const { data: subs } = await admin
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .in("user_id", targets);

    const payload = JSON.stringify({
      title: "New message about your post",
      body: `${senderName} sent you a message.`,
      url: `/chat/${senderId}`,
      conversationId,
      senderId,
    });

    let sent = 0;
    const removeIds: string[] = [];
    await Promise.all(
      (subs ?? []).map(async (s) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: s.endpoint,
              keys: { p256dh: s.p256dh, auth: s.auth },
            } as any,
            payload,
          );
          sent += 1;
        } catch (err: any) {
          const status = err?.statusCode ?? 0;
          if (status === 404 || status === 410) removeIds.push(s.id);
          else console.error("web-push error", status, err?.body ?? err?.message);
        }
      }),
    );

    if (removeIds.length > 0) {
      await admin.from("push_subscriptions").delete().in("id", removeIds);
    }

    return json({ ok: true, sent, pruned: removeIds.length });
  } catch (err) {
    console.error("send-message-push failed", err);
    return json({ error: "Internal error" }, 500);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
