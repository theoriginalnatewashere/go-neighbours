import { createFileRoute } from "@tanstack/react-router";
import Messages from "@/app/components/Messages";

export const Route = createFileRoute("/_authenticated/messages")({
  head: () => ({
    meta: [
      { title: "Messages — Go Neighbours" },
      { name: "description", content: "Chat with neighbours you've connected with." },
    ],
  }),
  component: Messages,
});
