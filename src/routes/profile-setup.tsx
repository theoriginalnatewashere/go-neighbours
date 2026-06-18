import { createFileRoute } from "@tanstack/react-router";
import { ProfileSetup } from "@/app/components/ProfileSetup";

export const Route = createFileRoute("/profile-setup")({
  head: () => ({
    meta: [
      { title: "Profile setup — Go Neighbours" },
      { name: "description", content: "Set up your neighbour profile, skills, and interests." },
    ],
  }),
  component: ProfileSetup,
});
