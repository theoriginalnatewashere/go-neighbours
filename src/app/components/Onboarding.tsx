import { Link } from "@tanstack/react-router";
import { Users, ShieldCheck, MessageCircle, type LucideIcon } from "lucide-react";

export const features = [
  {
    icon: Users,
    title: "Community Posts",
    desc: "Ask for help, share requests, or support neighbors nearby.",
  },
  {
    icon: ShieldCheck,
    title: "Trusted Profiles",
    desc: "Build trust through verified profiles, skills, and community badges.",
  },
  {
    icon: MessageCircle,
    title: "Direct Messaging",
    desc: "Chat safely and directly with neighbors.",
  },
];

export function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35.5 24 35.5c-6.4 0-11.5-5.1-11.5-11.5S17.6 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.6 6.3 29 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5 43.5 34.8 43.5 24c0-1.2-.1-2.4-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.6 16 19 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.6 6.3 29 4.5 24 4.5 16.3 4.5 9.6 8.9 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 43.5c5 0 9.5-1.7 13-4.7l-6-5c-2 1.4-4.4 2.2-7 2.2-5.3 0-9.7-3.1-11.3-7.5l-6.5 5C9.5 39.1 16.2 43.5 24 43.5z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.7l6 5c-.4.4 6.5-4.7 6.5-14.7 0-1.2-.1-2.4-.4-3.5z"
      />
    </svg>
  );
}

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  desc: string;
}

export function FeatureCard({ icon: Icon, title, desc }: FeatureCardProps) {
  return (
    <li className="rounded-2xl bg-card border border-border p-4 flex gap-3 items-start shadow-sm">
      <div className="h-10 w-10 shrink-0 rounded-xl bg-secondary flex items-center justify-center">
        <Icon className="h-5 w-5 text-primary" strokeWidth={2.2} />
      </div>
      <div>
        <h2 className="text-[15px] font-semibold text-foreground">{title}</h2>
        <p className="mt-0.5 text-sm text-muted-foreground leading-snug">{desc}</p>
      </div>
    </li>
  );
}

export function Onboarding() {
  return (
    <main className="min-h-screen bg-background flex justify-center">
      <div className="w-full max-w-md px-6 pt-12 pb-8 flex flex-col">
        <div className="flex justify-center mb-8">
          <div className="relative h-32 w-32 rounded-full bg-secondary flex items-center justify-center">
            <div className="absolute inset-3 rounded-full bg-primary/15" />
            <div className="absolute inset-7 rounded-full bg-primary/30" />
            <Users className="relative h-10 w-10 text-primary" strokeWidth={2.2} />
          </div>
        </div>

        <h1 className="text-3xl font-semibold tracking-tight text-center text-foreground">
          Welcome to Go Neighbours
        </h1>
        <p className="mt-3 text-center text-muted-foreground leading-relaxed text-[15px]">
          A local community app that helps neighbors connect, ask for help, share
          resources, and build trust within their building or neighborhood.
        </p>

        <ul className="mt-8 space-y-3">
          {features.map((f) => (
            <FeatureCard key={f.title} icon={f.icon} title={f.title} desc={f.desc} />
          ))}
        </ul>

        <div className="mt-8 space-y-3">
          <Link
            to="/auth"
            className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-medium text-[15px] flex items-center justify-center active:scale-[0.99] transition shadow-sm"
          >
            Get Started
          </Link>
          <Link
            to="/auth"
            className="w-full h-12 rounded-2xl bg-card border border-border text-foreground font-medium text-[15px] flex items-center justify-center gap-2 active:scale-[0.99] transition"
          >
            <GoogleIcon />
            Continue with Google
          </Link>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Designed for apartment buildings and local communities.
        </p>
      </div>
    </main>
  );
}
