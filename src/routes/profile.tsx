import { createFileRoute } from "@tanstack/react-router";
import UserProfile from "@/app/components/UserProfile";
import { guardSignedIn } from "@/lib/authGuard";

export const Route = createFileRoute("/profile")({
  ssr: false,
  beforeLoad: guardSignedIn,
  head: () => ({
    meta: [
      { title: "Your profile — Go Neighbours" },
      { name: "description", content: "Manage your profile and verification." },
    ],
  }),
  component: UserProfile,
});
