import { supabase } from "@/integrations/supabase/client";
import type { PostRow } from "./posts";

export async function listMyLikedPostIds(): Promise<Set<string>> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return new Set();
  const { data, error } = await supabase
    .from("post_likes")
    .select("post_id")
    .eq("user_id", u.user.id);
  if (error) throw error;
  return new Set((data ?? []).map((r) => r.post_id as string));
}

export async function likePost(postId: string): Promise<void> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Not signed in");
  const { error } = await supabase
    .from("post_likes")
    .insert({ post_id: postId, user_id: u.user.id });
  // Ignore duplicate-key errors (already liked)
  if (error && error.code !== "23505") throw error;
}

export async function unlikePost(postId: string): Promise<void> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Not signed in");
  const { error } = await supabase
    .from("post_likes")
    .delete()
    .eq("post_id", postId)
    .eq("user_id", u.user.id);
  if (error) throw error;
}

export async function listMyLikedPosts(limit = 50): Promise<PostRow[]> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return [];
  const { data, error } = await supabase
    .from("post_likes")
    .select(
      "created_at, post:posts!inner(id, author_id, cluster, building, category, urgency, title, body, created_at, author_name, author_avatar_url, author_verified, likes_count)",
    )
    .eq("user_id", u.user.id)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  type Row = { post: PostRow | null };
  return ((data ?? []) as unknown as Row[])
    .map((r) => r.post)
    .filter((p): p is PostRow => !!p);
}
