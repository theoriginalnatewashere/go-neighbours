import { createFileRoute } from "@tanstack/react-router";
import { Onboarding } from "@/app/components/Onboarding";

export const Route = createFileRoute("/")({
  component: Onboarding,
  head: () => ({
    meta: [
      { title: "Go Neighbours — Connect with your community" },
      {
        name: "description",
        content:
          "A local community app that helps neighbors connect, ask for help, share resources, and build trust.",
      },
    ],
  }),
});
