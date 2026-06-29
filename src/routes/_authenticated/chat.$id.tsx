import { createFileRoute } from "@tanstack/react-router";
import Chat from "@/app/components/Chat";

export const Route = createFileRoute("/chat/$id")({
  head: () => ({
    meta: [
      { title: "Chat — Go Neighbours" },
      { name: "description", content: "A conversation with your neighbour." },
    ],
  }),
  component: Chat,
});
