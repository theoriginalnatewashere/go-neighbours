import { createFileRoute } from "@tanstack/react-router";
import { AuthSignUp } from "@/app/components/AuthSignUp";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign up — Go Neighbours" },
      { name: "description", content: "Create your Go Neighbours account to chat directly with neighbours." },
    ],
  }),
  component: AuthSignUp,
});
