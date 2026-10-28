import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Heart,
  HandHeart,
  Users,
  MapPin,
  MessageCircle,
  CalendarDays,
  Share2,
  HelpCircle,
  ArrowRight,
  Menu,
  X,
  MessageSquare,
} from "lucide-react";
import logoAsset from "../assets/go-neighbours-logo.png.asset.json";
import heroScreenshotAsset from "../assets/hero-screenshot.png.asset.json";
import askingHelpAsset from "../assets/asking-help.png.asset.json";
import requestLiveAsset from "../assets/request-live.png.asset.json";
import { InstallAppModal } from "@/components/install-app-modal";

export const Route = createFileRoute("/")({
  staticData: { sitemap: true },
  component: Index,
  head: () => ({
    meta: [
      {
        title: "Go Neighbors — Connect with your local community",
      },
      {
        name: "description",
        content:
          "Go Neighbors is a local community platform that helps you connect with the people living around you.",
      },
      {
        property: "og:title",
        content: "Go Neighbors — Connect with your local community",
      },
      {
        property: "og:description",
        content:
          "Go Neighbors is a local community platform that helps you connect with the people living around you.",
      },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "https://goneighbors.lovable.app/og-share.jpg" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: "https://goneighbors.lovable.app/og-share.jpg" },
    ],
  }),
});

const NEIGHBOURHOODS = {
  Utrecht: [
    { name: "Keramus Building", whatsappLink: "https://chat.whatsapp.com/E8Y3oOyhzVr3YXyrtHYSib" },
  ],
  Delft: [
    { name: "TUDelft Campus", whatsappLink: "https://chat.whatsapp.com/KoTrWoLY88IIMJ4Li77G79?s=cl&p=i&mlu=4&ilr=4" },
  ],
} as const;

type City = keyof typeof NEIGHBOURHOODS;

function scrollToId(id: string) {
  const element = document.getElementById(id);
  if (element) {
    element.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function AppScreenshotPlaceholder({ label }: { label: string }) {
  return (
    <div className="relative mx-auto w-full max-w-[280px] overflow-hidden rounded-[2.25rem] border-4 border-border bg-muted p-2 shadow-sm sm:max-w-[320px]">
      <div className="relative aspect-[9/19] w-full overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-secondary to-accent">
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
          <div className="rounded-full bg-background/80 p-4 backdrop-blur-sm">
            <SmartphoneIcon className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
        </div>
        <div className="absolute left-1/2 top-4 h-1.5 w-16 -translate-x-1/2 rounded-full bg-foreground/10" />
      </div>
    </div>
  );
}

function SmartphoneIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
      <path d="M12 18h.01" />
    </svg>
  );
}

function Header({ onInstallClick }: { onInstallClick: () => void }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-border bg-background/85 backdrop-blur-md"
          : "bg-background"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-6 lg:px-8">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="flex items-center"
        >
          <img
            src={logoAsset.url}
            alt="Go Neighbours"
            className="h-[108px] w-auto"
          />
        </a>

        <nav className="hidden items-center gap-8 md:flex">
          <button
            onClick={() => scrollToId("why")}
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Why
          </button>
          <button
            onClick={() => scrollToId("how")}
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            How it works
          </button>
          <button
            onClick={onInstallClick}
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Install App
          </button>
          <button
            onClick={() => scrollToId("join")}
            className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98]"
          >
            Join your neighbourhood
          </button>
        </nav>

        <button
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-secondary-foreground md:hidden"
          onClick={() => setMobileOpen((open) => !open)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-border bg-background px-5 pb-5 pt-4 md:hidden">
          <nav className="flex flex-col gap-3">
            <button
              onClick={() => {
                scrollToId("why");
                setMobileOpen(false);
              }}
              className="rounded-lg px-3 py-2 text-left text-base font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              Why
            </button>
            <button
              onClick={() => {
                scrollToId("how");
                setMobileOpen(false);
              }}
              className="rounded-lg px-3 py-2 text-left text-base font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              How it works
            </button>
            <button
              onClick={() => {
                onInstallClick();
                setMobileOpen(false);
              }}
              className="rounded-lg px-3 py-2 text-left text-base font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              Install App
            </button>
            <button
              onClick={() => {
                scrollToId("join");
                setMobileOpen(false);
              }}
              className="mt-1 inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-base font-semibold text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98]"
            >
              Join your neighbourhood
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden px-5 pb-16 pt-12 sm:px-6 sm:pb-20 sm:pt-16 lg:px-8 lg:pb-24 lg:pt-20">
      <div className="mx-auto max-w-6xl">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="max-w-xl">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              Local community platform
            </p>
            <h1 className="font-display text-4xl font-medium leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Your neighbourhood, a little closer.
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground sm:text-xl">
              Go Neighbors is a local community platform that helps you connect with the people
              living around you, whether you want to ask for help, share something, discover what's
              happening nearby, or simply get to know your neighbours.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
              <button
                onClick={() => scrollToId("join")}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-7 py-3.5 text-base font-semibold text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98]"
              >
                Join your neighbourhood
                <ArrowRight className="h-4 w-4" />
              </button>
              <p className="text-sm font-medium text-muted-foreground sm:pl-2">
                Connect with your local community.
              </p>
            </div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <div className="relative mx-auto w-full max-w-[280px] overflow-hidden rounded-[2.25rem] border-4 border-border bg-muted p-2 shadow-sm sm:max-w-[320px]">
              <img
                src={heroScreenshotAsset.url}
                alt="Go Neighbours app welcome screen"
                className="aspect-[9/19] w-full rounded-[1.75rem] object-cover object-top"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Why() {
  const ideas = [
    {
      icon: Users,
      title: "Know the people around you",
      text: "Turn neighbours into familiar faces.",
    },
    {
      icon: HandHeart,
      title: "Help each other",
      text: "Make everyday sharing and small acts of help easier.",
    },
    {
      icon: Heart,
      title: "Build stronger communities",
      text: "Create neighbourhoods where people feel more connected and involved.",
    },
  ];

  return (
    <section id="why" className="px-5 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-3xl font-medium tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            We live close. But we're not always connected.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
            Our neighbourhoods are full of people, skills, knowledge and things we can share. Yet
            many of us barely know the people living a few doors away.
          </p>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            Go Neighbors is about changing that by making it easier to create stronger, more
            helpful and more connected local communities.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {ideas.map((idea) => (
            <div
              key={idea.title}
              className="group rounded-2xl border border-border bg-card p-6 transition-all hover:border-primary/30 hover:bg-card/80 sm:p-8"
            >
              <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <idea.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">{idea.title}</h3>
              <p className="mt-2 text-base leading-relaxed text-muted-foreground">{idea.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const features = [
    {
      icon: HelpCircle,
      title: "Ask for a hand",
      text: "Need a tool, recommendation or small favour? Ask the people nearby.",
    },
    {
      icon: Share2,
      title: "Share what you have",
      text: "Lend, give away or share things with neighbours instead of letting them go unused.",
    },
    {
      icon: CalendarDays,
      title: "Know what’s happening",
      text: "Discover events, activities and useful updates around your neighbourhood.",
    },
    {
      icon: MessageSquare,
      title: "Start a conversation",
      text: "Meet and talk to people who actually live around you.",
    },
  ];

  return (
    <section id="how" className="bg-secondary/40 px-5 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-medium tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            A simple way to connect locally
          </h2>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-border bg-background p-6 transition-all hover:border-primary/30 hover:shadow-sm sm:p-7"
            >
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary">
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-foreground">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 grid gap-8 sm:grid-cols-2">
          <div className="relative mx-auto w-full max-w-[280px] overflow-hidden rounded-[2.25rem] border-4 border-border bg-muted p-2 shadow-sm sm:max-w-[320px]">
            <img
              src={askingHelpAsset.url}
              alt="Asking neighbours for help in the Go Neighbours app"
              className="aspect-[9/19] w-full rounded-[1.75rem] object-cover object-top"
            />
          </div>
          <div className="relative mx-auto w-full max-w-[280px] overflow-hidden rounded-[2.25rem] border-4 border-border bg-muted p-2 shadow-sm sm:max-w-[320px]">
            <img
              src={requestLiveAsset.url}
              alt="A request going live to nearby neighbours in the Go Neighbours app"
              className="aspect-[9/19] w-full rounded-[1.75rem] object-cover object-top"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function WhatMakesDifferent() {
  const points = [
    {
      title: "Actually local",
      text: "Your community is based around where you live, not a huge anonymous social network.",
    },
    {
      title: "Useful by design",
      text: "Built around everyday reasons neighbours might actually want to connect.",
    },
    {
      title: "People first",
      text: "The goal isn’t more scrolling. It’s helping people interact in the real world.",
    },
  ];

  return (
    <section className="px-5 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-3xl border border-border bg-card px-6 py-10 sm:px-10 sm:py-12 lg:px-14 lg:py-16">
          <div className="mb-10 max-w-xl">
            <h2 className="font-display text-2xl font-medium tracking-tight text-foreground sm:text-3xl lg:text-4xl">
              Built around real neighbourhoods
            </h2>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {points.map((point) => (
              <div key={point.title}>
                <h3 className="text-base font-semibold text-foreground">{point.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{point.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Join() {
  const cities = Object.keys(NEIGHBOURHOODS) as City[];
  const [city, setCity] = useState<City>(cities[0] ?? "Utrecht");
  const cityNeighbourhoods = NEIGHBOURHOODS[city];
  const [neighbourhood, setNeighbourhood] = useState<string>(cityNeighbourhoods[0].name);

  const currentNeighbourhood = cityNeighbourhoods.find((n) => n.name === neighbourhood);
  const whatsappLink = currentNeighbourhood?.whatsappLink || "#";

  useEffect(() => {
    setNeighbourhood(NEIGHBOURHOODS[city][0].name);
  }, [city]);

  return (
    <section id="join" className="px-5 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <MessageCircle className="h-7 w-7" />
        </div>
        <h2 className="mt-6 font-display text-3xl font-medium tracking-tight text-foreground sm:text-4xl lg:text-5xl">
          Find your neighbours
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">Choose where you live and join the conversation.</p>

        <div className="mt-10 rounded-3xl border border-border bg-card p-6 text-left shadow-sm sm:p-8">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="city" className="text-sm font-semibold text-foreground">
                City
              </label>
              <div className="relative">
                <select
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value as City)}
                  className="w-full appearance-none rounded-xl border border-input bg-background px-4 py-3 text-base text-foreground outline-none ring-ring transition-all focus:border-primary focus:ring-2 focus:ring-ring"
                >
                  {cities.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="neighbourhood" className="text-sm font-semibold text-foreground">
                Neighbourhood / Building
              </label>
              <div className="relative">
                <select
                  id="neighbourhood"
                  value={neighbourhood}
                  onChange={(e) => setNeighbourhood(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-input bg-background px-4 py-3 text-base text-foreground outline-none ring-ring transition-all focus:border-primary focus:ring-2 focus:ring-ring"
                >
                  {cityNeighbourhoods.map((n) => (
                    <option key={n.name} value={n.name}>
                      {n.name}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>
          </div>

          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 py-4 text-base font-bold text-white shadow-sm transition-all hover:bg-[#128C7E] hover:shadow-md active:scale-[0.98]"
          >
            <WhatsAppIcon className="h-5 w-5" />
            Join {neighbourhood} neighbours on WhatsApp
          </a>

          <div className="mt-5 text-center">
            <p className="text-sm text-muted-foreground">
              Don't see your neighbourhood?{" "}
              <button
                onClick={() => scrollToId("final-cta")}
                className="font-semibold text-primary underline-offset-2 hover:underline"
              >
                Help us start one.
              </button>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.203-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.999-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

function FinalCTA() {
  return (
    <section id="final-cta" className="px-5 pb-16 pt-8 sm:px-6 sm:pb-20 sm:pt-12 lg:px-8 lg:pb-24">
      <div className="mx-auto max-w-3xl rounded-3xl bg-primary px-6 py-14 text-center sm:px-10 sm:py-18 lg:py-20">
        <h2 className="font-display text-3xl font-medium tracking-tight text-primary-foreground sm:text-4xl lg:text-5xl">
          Good neighbours make good neighbourhoods.
        </h2>
        <p className="mt-4 text-lg text-primary-foreground/80">Meet yours.</p>
        <button
          onClick={() => scrollToId("join")}
          className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-background px-8 py-4 text-base font-semibold text-primary shadow-sm transition-all hover:bg-background/90 active:scale-[0.98]"
        >
          Join your neighbourhood
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      <footer className="mt-16 text-center">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Go Neighbors. Built for local communities.
        </p>
      </footer>
    </section>
  );
}

function Index() {
  const [installOpen, setInstallOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <Header onInstallClick={() => setInstallOpen(true)} />
      <main>
        <Hero />
        <Why />
        <HowItWorks />
        <WhatMakesDifferent />
        <Join />
        <FinalCTA />
      </main>
      <InstallAppModal
        open={installOpen}
        onClose={() => setInstallOpen(false)}
      />
    </div>
  );
}
