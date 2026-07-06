import { useState, type FormEvent } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { Mail, Lock, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";
import { getRedirectForUser } from "@/lib/profileRouting";
import authIllustration from "@/assets/auth-neighbours-illustration.png.asset.json";

type Mode = "signup" | "login";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.66 4.1-5.5 4.1-3.31 0-6-2.74-6-6.1s2.69-6.1 6-6.1c1.88 0 3.14.8 3.86 1.48l2.63-2.54C16.85 3.4 14.66 2.5 12 2.5 6.76 2.5 2.5 6.76 2.5 12S6.76 21.5 12 21.5c6.92 0 9.5-4.86 9.5-7.4 0-.5-.05-.88-.13-1.26H12z"/>
    </svg>
  );
}

export function AuthSignUp() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/auth" }) as { next?: string };
  const next = search.next;
  const [mode, setMode] = useState<Mode>("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      if (mode === "signup") {
        const emailRedirectTo = next
          ? `${window.location.origin}${next}`
          : `${window.location.origin}/location`;
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo },
        });
        if (error) throw error;
        if (data.session && data.user) {
          toast.success("Account created. Let's set up your profile.");
          if (next) window.location.href = next;
          else navigate({ to: "/location" });
        } else {
          toast.success("Check your email to confirm your account.");
          setMode("login");
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Signed in");
        if (next) {
          window.location.href = next;
        } else {
          const dest = data.user ? await getRedirectForUser(data.user.id) : "/home";
          navigate({ to: dest });
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    if (googleLoading) return;
    setGoogleLoading(true);
    try {
      const redirect_uri = next
        ? `${window.location.origin}${next}`
        : window.location.origin;
      const result = await lovable.auth.signInWithOAuth("google", { redirect_uri });
      if (result.error) {
        toast.error(result.error.message ?? "Google sign-in failed");
        setGoogleLoading(false);
        return;
      }
      if (result.redirected) return;
      if (next) {
        window.location.href = next;
      } else {
        const { data: userData } = await supabase.auth.getUser();
        const dest = userData.user ? await getRedirectForUser(userData.user.id) : "/location";
        navigate({ to: dest });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Google sign-in failed");
    } finally {
      setGoogleLoading(false);
    }
  }

  const isSignup = mode === "signup";

  return (
    <main className="min-h-screen bg-background flex justify-center">
      <div className="w-full max-w-md px-6 pt-10 pb-8 flex flex-col">
        <div className="mx-auto mt-2 mb-8 w-full overflow-hidden rounded-3xl bg-secondary/60">
          <img
            src={authIllustration.url}
            alt="Neighbours chatting and biking around a friendly community"
            className="block w-full h-auto"
          />
        </div>

        <h1 className="text-3xl font-semibold tracking-tight text-center text-foreground">
          {isSignup ? "Join Go Neighbours" : "Welcome back"}
        </h1>
        <p className="mt-3 text-center text-muted-foreground leading-relaxed text-[15px]">
          {isSignup
            ? "Create your account to connect with neighbours nearby."
            : "Sign in to keep helping the people next door."}
        </p>

        <div className="mt-6 grid grid-cols-2 gap-1 rounded-2xl bg-secondary p-1 text-sm font-medium">
          {(["signup", "login"] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`h-9 rounded-xl transition ${
                mode === m
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground"
              }`}
            >
              {m === "signup" ? "Sign up" : "Log in"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          <label className="block">
            <span className="sr-only">Email</span>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full h-12 pl-10 pr-3 rounded-2xl bg-card border border-border text-[15px] outline-none focus:border-primary"
              />
            </div>
          </label>
          <label className="block">
            <span className="sr-only">Password</span>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="password"
                required
                minLength={6}
                autoComplete={isSignup ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full h-12 pl-10 pr-3 rounded-2xl bg-card border border-border text-[15px] outline-none focus:border-primary"
              />
            </div>
          </label>
          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-2xl bg-foreground text-background font-medium text-[15px] flex items-center justify-center gap-2 active:scale-[0.99] transition shadow-sm disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSignup ? "Create account" : "Sign in"}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" />
          or
          <div className="h-px flex-1 bg-border" />
        </div>

        <button
          type="button"
          onClick={handleGoogle}
          disabled={googleLoading}
          className="w-full h-12 rounded-2xl bg-card border border-border text-foreground font-medium text-[15px] flex items-center justify-center gap-2 active:scale-[0.99] transition disabled:opacity-60"
        >
          {googleLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <GoogleIcon className="h-4 w-4" />
          )}
          Continue with Google
        </button>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          By continuing you agree to keep neighbour conversations respectful.
        </p>
      </div>
    </main>
  );
}
