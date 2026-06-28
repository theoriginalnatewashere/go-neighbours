import { createFileRoute } from "@tanstack/react-router";
import EnhancedHome from "@/app/components/EnhancedHome";

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [
      { title: "Home feed — Go Neighbours" },
      {
        name: "description",
        content:
          "See requests, offers, and events from neighbours in your cluster.",
      },
      { property: "og:title", content: "Home feed — Go Neighbours" },
      {
        property: "og:description",
        content:
          "See requests, offers, and events from neighbours in your cluster.",
      },
    ],
  }),
  component: EnhancedHome,
});
