import { createFileRoute } from "@tanstack/react-router";
import CreateRequest from "@/app/components/CreateRequest";

export const Route = createFileRoute("/_authenticated/create-request")({
  head: () => ({
    meta: [
      { title: "New request — Go Neighbours" },
      { name: "description", content: "Ask your neighbours for a small act of help." },
    ],
  }),
  component: CreateRequest,
});
