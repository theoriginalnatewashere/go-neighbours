import { useState } from "react";
import { Link, useParams } from "@tanstack/react-router";
import { Image as ImageIcon, Send } from "lucide-react";
import { NeighborAvatar } from "./patterns";
import { MobileShell, ScreenHeader } from "./patterns/shell";
import { cn } from "@/lib/utils";

type Msg = { id: string; text: string; mine: boolean; time: string };

const seed: Msg[] = [
  { id: "1", text: "Hi! Saw your request — I'm heading to the shop now.", mine: true, time: "14:02" },
  { id: "2", text: "Oh wow, thank you so much 🙏", mine: false, time: "14:03" },
  { id: "3", text: "What do you need exactly?", mine: true, time: "14:03" },
  { id: "4", text: "Bread, milk, and a half-dozen eggs. I'll send the money over.", mine: false, time: "14:05" },
  { id: "5", text: "No rush on the money — pay back whenever. Flat number?", mine: true, time: "14:06" },
];

export default function Chat() {
  const { id } = useParams({ from: "/chat/$id" });
  const [msgs, setMsgs] = useState<Msg[]>(seed);
  const [text, setText] = useState("");

  const send = () => {
    if (!text.trim()) return;
    setMsgs((m) => [
      ...m,
      {
        id: String(m.length + 1),
        text: text.trim(),
        mine: true,
        time: "now",
      },
    ]);
    setText("");
  };

  return (
    <MobileShell>
      <ScreenHeader
        backTo="/messages"
        rightSlot={
          <Link to="/neighbor/$id" params={{ id }}>
            <NeighborAvatar name="Hana Okafor" size="sm" verified />
          </Link>
        }
        title="Hana Okafor"
        subtitle="Verified neighbour · D18"
      />

      <main className="flex-1 space-y-2 overflow-y-auto px-4 pt-2 pb-4">
        {msgs.map((m) => (
          <div
            key={m.id}
            className={cn("flex", m.mine ? "justify-end" : "justify-start")}
          >
            <div
              className={cn(
                "max-w-[78%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed shadow-sm",
                m.mine
                  ? "rounded-br-md bg-primary text-primary-foreground"
                  : "rounded-bl-md bg-card text-foreground",
              )}
            >
              <p>{m.text}</p>
              <p
                className={cn(
                  "mt-0.5 text-[10px]",
                  m.mine ? "text-primary-foreground/70" : "text-muted-foreground",
                )}
              >
                {m.time}
              </p>
            </div>
          </div>
        ))}
      </main>

      <div className="sticky bottom-0 z-20 border-t border-border bg-background/95 px-3 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] backdrop-blur">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Attach"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-card text-muted-foreground hover:bg-secondary"
          >
            <ImageIcon className="h-4 w-4" />
          </button>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Message…"
            className="flex-1 rounded-full border border-border bg-card px-4 py-2.5 text-sm shadow-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            type="button"
            onClick={send}
            aria-label="Send"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md shadow-primary/25"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </MobileShell>
  );
}
