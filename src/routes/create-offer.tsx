import { createFileRoute } from "@tanstack/react-router";
import CreateOffer from "@/app/components/CreateOffer";

export const Route = createFileRoute("/create-offer")({
  head: () => ({
    meta: [
      { title: "New offer — Go Neighbours" },
      { name: "description", content: "Share something kind with your cluster." },
    ],
  }),
  component: CreateOffer,
});
