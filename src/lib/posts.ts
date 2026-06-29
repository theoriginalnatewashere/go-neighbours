import { supabase } from "@/integrations/supabase/client";

export type PostRow = {
  id: string;
  author_id: string;
  cluster: string;
  building: string | null;
  category: string;
  urgency: "low" | "medium" | "high";
  title: string;
  body: string;
  created_at: string;
  author_name: string | null;
  author_avatar_url: string | null;
  author_verified: boolean;
};

export type FeedPost = PostRow;

export async function listClusterPosts(): Promise<FeedPost[]> {
  // RLS restricts results to posts in the caller's cluster.
  const { data, error } = await supabase
    .from("posts")
    .select(
      "id, author_id, cluster, building, category, urgency, title, body, created_at, author_name, author_avatar_url, author_verified",
    )
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []) as PostRow[];
}

export type NewPostInput = {
  title: string;
  body: string;
  category: string;
  urgency: "low" | "medium" | "high";
};

export async function createPost(input: NewPostInput): Promise<PostRow> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Not signed in");

  const { data: profile, error: pErr } = await supabase
    .from("profiles")
    .select("neighbourhood, building, display_name, full_name, avatar_url, verification_status")
    .eq("id", u.user.id)
    .maybeSingle();
  if (pErr) throw pErr;
  if (!profile?.neighbourhood) {
    throw new Error(
      "Set your neighbourhood in your profile before posting so neighbours can see it.",
    );
  }

  const { data, error } = await supabase
    .from("posts")
    .insert({
      author_id: u.user.id,
      cluster: profile.neighbourhood,
      building: profile.building,
      title: input.title.trim(),
      body: input.body.trim(),
      category: input.category,
      urgency: input.urgency,
      author_name: profile.display_name || profile.full_name || "Neighbour",
      author_avatar_url: profile.avatar_url,
      author_verified: profile.verification_status === "approved",
    })
    .select()
    .single();
  if (error) throw error;
  return data as PostRow;
}

export async function getPost(id: string): Promise<PostRow | null> {
  const { data, error } = await supabase
    .from("posts")
    .select(
      "id, author_id, cluster, building, category, urgency, title, body, created_at, author_name, author_avatar_url, author_verified",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as PostRow | null) ?? null;
}

export type UpdatePostInput = {
  id: string;
  title: string;
  body: string;
  category: string;
  urgency: "low" | "medium" | "high";
};

export async function updatePost(input: UpdatePostInput): Promise<PostRow> {
  const { data, error } = await supabase
    .from("posts")
    .update({
      title: input.title.trim(),
      body: input.body.trim(),
      category: input.category,
      urgency: input.urgency,
    })
    .eq("id", input.id)
    .select()
    .single();
  if (error) throw error;
  return data as PostRow;
}

export async function deletePost(id: string): Promise<void> {
  const { error } = await supabase.from("posts").delete().eq("id", id);
  if (error) throw error;
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.floor(h / 24);
  return `${d} d ago`;
}
