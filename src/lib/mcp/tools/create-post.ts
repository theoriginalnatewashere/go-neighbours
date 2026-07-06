import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "create_post",
  title: "Create a neighbourhood post",
  description:
    "Create a new post in the signed-in neighbour's cluster. Requires a verified address; the user's profile must have a neighbourhood set and verification_status = approved.",
  inputSchema: {
    title: z.string().trim().min(1).max(120).describe("Short post title."),
    body: z.string().trim().min(1).max(4000).describe("Post body."),
    category: z
      .enum(["Helps", "Offers", "Events", "Lost & Found", "Share", "Other"])
      .describe("Post category."),
    urgency: z.enum(["low", "medium", "high"]).optional().describe("Urgency (default low)."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ title, body, category, urgency }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const userId = ctx.getUserId();
    if (!userId) return { content: [{ type: "text", text: "No user id" }], isError: true };
    const supabase = supabaseForUser(ctx);
    const { data: profile, error: pErr } = await supabase
      .from("profiles")
      .select("neighbourhood, building, display_name, full_name, avatar_url, verification_status")
      .eq("id", userId)
      .maybeSingle();
    if (pErr) return { content: [{ type: "text", text: pErr.message }], isError: true };
    if (!profile?.neighbourhood) {
      return {
        content: [{ type: "text", text: "Set your neighbourhood in your profile before posting." }],
        isError: true,
      };
    }
    if (profile.verification_status !== "approved") {
      return {
        content: [{ type: "text", text: "Your address must be verified before posting." }],
        isError: true,
      };
    }
    const { data, error } = await supabase
      .from("posts")
      .insert({
        author_id: userId,
        cluster: profile.neighbourhood,
        building: profile.building,
        title: title.trim(),
        body: body.trim(),
        category,
        urgency: urgency ?? "low",
        author_name: profile.display_name || profile.full_name || "Neighbour",
        author_avatar_url: profile.avatar_url,
        author_verified: true,
        image_urls: [],
      })
      .select()
      .single();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: `Post created: ${data.id}` }],
      structuredContent: { post: data },
    };
  },
});
