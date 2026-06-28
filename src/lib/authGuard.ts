import { redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export async function guardSignedIn() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw redirect({ to: "/auth" });
  }
  return { userId: data.user.id };
}
