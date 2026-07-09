import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import Chat from "@/app/components/Chat";

const chatSearchSchema = z.object({
  post: z.string().uuid().optional(),
  conv: z.string().uuid().optional(),
});

export const Route = createFileRoute("/_authenticated/chat/$id")({
  validateSearch: chatSearchSchema,
  head: () => ({
    meta: [
      { title: "Chat — Go Neighbours" },
      { name: "description", content: "A conversation with your neighbour." },
    ],
  }),
  component: Chat,
});
