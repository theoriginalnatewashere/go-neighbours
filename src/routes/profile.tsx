import { createFileRoute } from "@tanstack/react-router";
import UserProfile from "@/app/components/UserProfile";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Your profile — Go Neighbours" },
      { name: "description", content: "Manage your profile and verification." },
    ],
  }),
  component: UserProfile,
});
