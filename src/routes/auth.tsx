import { createFileRoute, redirect } from "@tanstack/react-router";
import { AuthSignUp } from "@/app/components/AuthSignUp";
import { supabase } from "@/integrations/supabase/client";
import { getRedirectForUser } from "@/lib/profileRouting";

export const Route = createFileRoute("/auth")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      const dest = await getRedirectForUser(data.user.id);
      throw redirect({ to: dest });
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
