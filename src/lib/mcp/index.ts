import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listRecentPosts from "./tools/list-recent-posts";
import listMyPosts from "./tools/list-my-posts";
import getPost from "./tools/get-post";
import createPost from "./tools/create-post";
import getMyProfile from "./tools/get-my-profile";

// Use the direct Supabase host as the OAuth issuer; the .lovable.cloud proxy
// URL fails RFC 8414 issuer discovery.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "go-neighbours-mcp",
  title: "Go Neighbours",
  version: "0.1.0",
  instructions:
    "Tools for the Go Neighbours community app. Use these to read the signed-in neighbour's local feed, view their own posts and profile, fetch a specific post, or create a new post in their neighbourhood.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listRecentPosts, listMyPosts, getPost, createPost, getMyProfile],
});
