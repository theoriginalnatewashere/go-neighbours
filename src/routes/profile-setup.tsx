import { createFileRoute } from "@tanstack/react-router";
import { ProfileSetup } from "@/app/components/ProfileSetup";
import { guardSignedIn } from "@/lib/authGuard";

export const Route = createFileRoute("/profile-setup")({
  ssr: false,
  beforeLoad: guardSignedIn,
  head: () => ({
    meta: [
      { title: "Profile setup — Go Neighbours" },
      { name: "description", content: "Set up your neighbour profile, skills, and interests." },
    ],
  }),
  component: ProfileSetup,
});
