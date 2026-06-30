import { createFileRoute } from "@tanstack/react-router";
import RequestDetail from "@/app/components/RequestDetail";

export const Route = createFileRoute("/_authenticated/request/$id")({
  head: () => ({
    meta: [
      { title: "Request — Go Neighbours" },
      { name: "description", content: "Help a neighbour with their request." },
    ],
  }),
  component: RequestDetail,
});
