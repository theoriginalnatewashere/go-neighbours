import { Link } from "@tanstack/react-router";
import { Mail, MessageCircle, Apple, Lock } from "lucide-react";

export function AuthSignUp() {
  return (
    <main className="min-h-screen bg-background flex justify-center">
      <div className="w-full max-w-md px-6 pt-10 pb-8 flex flex-col">
        {/* Illustration */}
        <div className="mx-auto mt-2 mb-8 flex h-56 w-full max-w-xs items-center justify-center rounded-3xl bg-secondary/60">
          <div className="relative w-full px-6">
            <div className="rounded-2xl bg-card border border-border px-3 py-2.5 shadow-sm w-44">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-primary/20" />
                <div className="h-2 flex-1 rounded-full bg-muted" />
              </div>
            </div>
            <div className="ml-auto mt-3 rounded-2xl bg-primary/15 border border-primary/20 px-3 py-2.5 shadow-sm w-44">
              <div className="flex items-center gap-2 justify-end">
                <div className="h-2 flex-1 rounded-full bg-primary/40" />
                <div className="h-6 w-6 rounded-full bg-primary/30" />
              </div>
            </div>
            <div className="mt-4 mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-card border border-border">
              <Lock className="h-4 w-4 text-primary" strokeWidth={2.2} />
            </div>
          </div>
        </div>

        <h1 className="text-3xl font-semibold tracking-tight text-center text-foreground">
          Chat Directly with Neighbours
        </h1>
        <p className="mt-3 text-center text-muted-foreground leading-relaxed text-[15px]">
          Coordinate help, ask questions, and communicate safely through private
          messages.
        </p>

        <div className="mt-8 space-y-3">
          <Link
            to="/location"
            className="w-full h-12 rounded-2xl bg-foreground text-background font-medium text-[15px] flex items-center justify-center gap-2 active:scale-[0.99] transition shadow-sm"
          >
            <Mail className="h-4 w-4" strokeWidth={2.2} />
            Sign up with Email
          </Link>
          <Link
            to="/location"
            className="w-full h-12 rounded-2xl bg-card border border-border text-foreground font-medium text-[15px] flex items-center justify-center gap-2 active:scale-[0.99] transition"
          >
            <Apple className="h-4 w-4" strokeWidth={2.2} />
            Sign up with Apple
          </Link>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground inline-flex items-center justify-center gap-1.5">
          <MessageCircle className="h-3 w-3" />
          Conversations stay between you and your neighbours.
        </p>
      </div>
    </main>
  );
}
