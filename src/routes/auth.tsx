import { createFileRoute, redirect } from "@tanstack/react-router";
import { AuthSignUp } from "@/app/components/AuthSignUp";
import { supabase } from "@/integrations/supabase/client";
import { getRedirectForUser } from "@/lib/profileRouting";

function safeNext(v: unknown): string | undefined {
  if (typeof v !== "string") return undefined;
  return v.startsWith("/") && !v.startsWith("//") ? v : undefined;
}

export const Route = createFileRoute("/auth")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({ next: safeNext(s.next) }),
  beforeLoad: async ({ search }) => {
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      const dest = search.next ?? (await getRedirectForUser(data.user.id));
      throw redirect({ href: dest });
    }
  },
  head: () => ({
    meta: [
      { title: "Sign up — Go Neighbours" },
      { name: "description", content: "Create your Go Neighbours account to chat directly with neighbours." },
    ],
  }),
  component: AuthSignUp,
});
