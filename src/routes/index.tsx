import { createFileRoute, redirect } from "@tanstack/react-router";
import { Onboarding } from "@/app/components/Onboarding";
import { supabase } from "@/integrations/supabase/client";
import { getRedirectForUser } from "@/lib/profileRouting";

export const Route = createFileRoute("/")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      const dest = await getRedirectForUser(data.user.id);
      throw redirect({ to: dest });
    }
  },
  component: Onboarding,
  head: () => ({
    meta: [
      { title: "Go Neighbours — Connect with your community" },
      { name: "description", content: "A local community app that helps neighbors connect, ask for help, share resources, and build trust." },
    ],
  }),
});
