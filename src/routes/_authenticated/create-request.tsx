import { createFileRoute } from "@tanstack/react-router";
import CreateRequest from "@/app/components/CreateRequest";

type Search = { edit?: string };

export const Route = createFileRoute("/_authenticated/create-request")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    edit: typeof s.edit === "string" ? s.edit : undefined,
  }),
  head: () => ({
    meta: [
      { title: "New request — Go Neighbours" },
      { name: "description", content: "Ask your neighbours for a small act of help." },
    ],
  }),
  component: CreateRequest,
});
