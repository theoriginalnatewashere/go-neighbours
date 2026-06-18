import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Camera, ShieldCheck } from "lucide-react";

const skills = [
  "Cooking",
  "Moving Help",
  "Tech Support",
  "Plant Care",
  "Repair",
  "Tutoring",
  "Pet Care",
  "Errands",
];
const tenures = ["New here", "0-6 months", "1-3 years", "3+ years"];
const interests = [
  "Local events",
  "Community clean-up",
  "Learning & tutoring",
  "Bike help",
  "Brunch",
  "Book swap",
];

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition " +
        (active
          ? "border-primary bg-primary/10 text-primary"
          : "border-border bg-card text-foreground hover:bg-secondary")
      }
    >
      {label}
    </button>
  );
}

export function ProfileSetup() {
  const [name, setName] = useState("");
  const [about, setAbout] = useState("");
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [tenure, setTenure] = useState(tenures[1]);
  const [tags, setTags] = useState<Set<string>>(new Set());

  const toggle = (set: Set<string>, val: string, setter: (s: Set<string>) => void) => {
    const next = new Set(set);
    if (next.has(val)) next.delete(val);
    else next.add(val);
    setter(next);
  };

  return (
    <main className="min-h-screen bg-background flex justify-center">
      <div className="w-full max-w-md px-5 pt-6 pb-8 flex flex-col">
        <div className="flex items-center gap-3 mb-5">
          <Link
            to="/location/cluster"
            aria-label="Go back"
            className="h-10 w-10 -ml-2 flex items-center justify-center rounded-full hover:bg-secondary active:scale-95 transition"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" strokeWidth={2.2} />
          </Link>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Profile Setup
          </h1>
        </div>

        {/* Avatar */}
        <div className="flex items-center gap-3 mb-5">
          <button
            type="button"
            className="relative h-16 w-16 rounded-full bg-secondary flex items-center justify-center"
          >
            <Camera className="h-5 w-5 text-muted-foreground" />
            <span className="absolute -bottom-0.5 -right-0.5 h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
              +
            </span>
          </button>
          <div>
            <p className="text-[14px] font-semibold text-foreground">Profile photo</p>
            <p className="text-[12.5px] text-muted-foreground">Tap to add</p>
          </div>
        </div>

        {/* Name */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-foreground">Name</label>
          <div className="flex items-center rounded-2xl border border-border bg-card px-3.5 h-12 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition">
            <input
              type="text"
              placeholder="Your display name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 bg-transparent outline-none text-[15px] text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* About */}
        <div className="mt-4 space-y-1.5">
          <label className="text-sm font-semibold text-foreground">About me</label>
          <textarea
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            placeholder="A short, friendly intro for neighbours"
            rows={3}
            className="w-full rounded-2xl border border-border bg-card px-3.5 py-2.5 text-[15px] text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition resize-none"
          />
          <p className="text-[12px] text-muted-foreground">
            Keep it minimal and safe.
          </p>
        </div>

        {/* Skills */}
        <div className="mt-5">
          <p className="text-sm font-semibold text-foreground">
            Skills I bring to the neighbourhood
          </p>
          <p className="text-[12.5px] text-muted-foreground">
            Select what you're comfortable helping with.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {skills.map((s) => (
              <Chip
                key={s}
                label={s}
                active={picked.has(s)}
                onClick={() => toggle(picked, s, setPicked)}
              />
            ))}
          </div>
        </div>

        {/* Tenure */}
        <div className="mt-5">
          <p className="text-sm font-semibold text-foreground">
            How long have you been in the neighbourhood?
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {tenures.map((t) => (
              <Chip
                key={t}
                label={t}
                active={tenure === t}
                onClick={() => setTenure(t)}
              />
            ))}
          </div>
        </div>

        {/* Interest tags */}
        <div className="mt-5">
          <p className="text-sm font-semibold text-foreground">Interest tags</p>
          <p className="text-[12.5px] text-muted-foreground">
            Optional — helps others find you.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {interests.map((t) => (
              <Chip
                key={t}
                label={t}
                active={tags.has(t)}
                onClick={() => toggle(tags, t, setTags)}
              />
            ))}
          </div>
        </div>

        <Link
          to="/verify-address"
          className="mt-7 w-full h-13 py-3.5 rounded-2xl bg-foreground text-background font-medium text-[15px] flex items-center justify-center gap-2 active:scale-[0.99] transition shadow-sm"
        >
          <ShieldCheck className="h-[18px] w-[18px]" strokeWidth={2.2} />
          Verify Location
        </Link>
        <p className="mt-3 text-center text-[12px] text-muted-foreground">
          We'll confirm your neighbourhood so you can connect locally.
        </p>
      </div>
    </main>
  );
}
