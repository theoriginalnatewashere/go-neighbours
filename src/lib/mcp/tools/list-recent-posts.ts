import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

const SELECT =
  "id, author_id, cluster, category, urgency, title, body, created_at, author_name, likes_count";

export default defineTool({
  name: "list_recent_posts",
  title: "List recent neighbourhood posts",
  description:
    "List the most recent posts visible to the signed-in neighbour, newest first. Use to browse the local feed.",
  inputSchema: {
    limit: z.number().int().min(1).max(50).optional().describe("Max posts to return (default 20)."),
    category: z
      .string()
      .optional()
      .describe("Optional category filter, e.g. Helps, Offers, Events, Lost & Found, Share, Other."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit, category }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let q = supabase
      .from("posts")
      .select(SELECT)
      .order("created_at", { ascending: false })
      .limit(limit ?? 20);
    if (category) q = q.eq("category", category);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { posts: data ?? [] },
    };
  },
});
