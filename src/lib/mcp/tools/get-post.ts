import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

const SELECT =
  "id, author_id, cluster, building, category, urgency, title, body, created_at, author_name, author_verified, likes_count, image_urls";

export default defineTool({
  name: "get_post",
  title: "Get a post by id",
  description: "Fetch full details of a single neighbourhood post by its id.",
  inputSchema: { id: z.string().uuid().describe("Post id (UUID).") },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ id }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase.from("posts").select(SELECT).eq("id", id).maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data) return { content: [{ type: "text", text: "Post not found" }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { post: data },
    };
  },
});
