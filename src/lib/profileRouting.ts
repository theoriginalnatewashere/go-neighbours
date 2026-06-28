import { supabase } from "@/integrations/supabase/client";

export async function getRedirectForUser(userId: string): Promise<"/home" | "/location"> {
  const { data } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", userId)
    .maybeSingle();
  return data?.onboarding_completed ? "/home" : "/location";
}

export async function requireSignedIn(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw new Error("unauthenticated");
  }
  return data.user.id;
}
