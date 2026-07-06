import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type OAuthAuthorization = {
  redirect_url?: string;
  redirect_to?: string;
  client?: { name?: string } | null;
};

type OAuthNs = {
  getAuthorizationDetails: (id: string) => Promise<{ data: OAuthAuthorization | null; error: { message: string } | null }>;
  approveAuthorization: (id: string) => Promise<{ data: OAuthAuthorization | null; error: { message: string } | null }>;
  denyAuthorization: (id: string) => Promise<{ data: OAuthAuthorization | null; error: { message: string } | null }>;
};

function oauth(): OAuthNs {
  return (supabase.auth as unknown as { oauth: OAuthNs }).oauth;
}

function safeNext(pathAndSearch: string): string {
  // Only accept same-origin relative paths.
  return pathAndSearch.startsWith("/") && !pathAndSearch.startsWith("//")
    ? pathAndSearch
    : "/";
}

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s.authorization_id === "string" ? s.authorization_id : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("Missing authorization_id");
    const { data } = await supabase.auth.getSession();
    const next = safeNext(location.pathname + location.searchStr);
    if (!data.session) throw redirect({ to: "/auth", search: { next } });
  },
  loader: async ({ location }) => {
    const authorizationId =
      new URLSearchParams(location.search).get("authorization_id") ?? "";
    const { data, error } = await oauth().getAuthorizationDetails(authorizationId);
    if (error) throw new Error(error.message);
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) throw redirect({ href: immediate });
    return data;
  },
  component: Consent,
  errorComponent: ({ error }) => (
    <main className="min-h-screen flex items-center justify-center p-6 text-center">
      <p className="text-sm text-muted-foreground">
        Could not load this authorization request: {String((error as Error)?.message ?? error)}
      </p>
    </main>
  ),
});

function Consent() {
  const details = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clientName = details?.client?.name ?? "an app";

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    const { data, error } = approve
      ? await oauth().approveAuthorization(authorization_id)
      : await oauth().denyAuthorization(authorization_id);
    if (error) {
      setBusy(false);
      setError(error.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("No redirect returned by the authorization server.");
      return;
    }
    window.location.href = target;
  }

  return (
    <main className="min-h-screen bg-background flex justify-center">
      <div className="w-full max-w-md px-6 pt-12 pb-8 flex flex-col">
        <h1 className="text-2xl font-semibold text-foreground text-center">
          Connect {clientName} to Go Neighbours
        </h1>
        <p className="mt-3 text-center text-muted-foreground text-[15px] leading-relaxed">
          {clientName} will be able to use Go Neighbours as you — browse your neighbourhood feed,
          view your posts and profile, and create posts on your behalf.
        </p>
        {error && (
          <p role="alert" className="mt-4 text-sm text-destructive text-center">
            {error}
          </p>
        )}
        <div className="mt-8 space-y-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => decide(true)}
            className="w-full h-12 rounded-2xl bg-foreground text-background font-medium disabled:opacity-60"
          >
            Approve
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => decide(false)}
            className="w-full h-12 rounded-2xl bg-card border border-border text-foreground font-medium disabled:opacity-60"
          >
            Deny
          </button>
        </div>
      </div>
    </main>
  );
}
