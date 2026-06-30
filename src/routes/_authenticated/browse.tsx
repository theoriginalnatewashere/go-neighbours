import { createFileRoute } from "@tanstack/react-router";
import Browse from "@/app/components/Browse";

export const Route = createFileRoute("/_authenticated/browse")({
  head: () => ({
    meta: [
      { title: "Browse — Go Neighbours" },
      { name: "description", content: "Find help requests and offers from neighbours in your cluster." },
    ],
  }),
  component: Browse,
});
