import { createFileRoute, redirect } from "@tanstack/react-router";
import EnhancedHome from "@/app/components/EnhancedHome";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/home")({
  beforeLoad: async ({ context }) => {
    const userId = (context as { user?: { id: string } }).user?.id;
    if (!userId) return;
    const { data } = await supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("id", userId)
      .maybeSingle();
    if (!data?.onboarding_completed) {
      throw redirect({ to: "/location" });
    }
  },
  head: () => ({
    meta: [
      { title: "Home feed — Go Neighbours" },
      { name: "description", content: "See requests, offers, and events from neighbours in your cluster." },
    ],
  }),
  component: EnhancedHome,
});
