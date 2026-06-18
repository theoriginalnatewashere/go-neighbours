import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Building2,
  DoorOpen,
  MapPin,
  ShieldCheck,
  Clock,
  Lock,
  Users,
  Info,
  type LucideIcon,
} from "lucide-react";

interface FieldProps {
  label: string;
  optional?: boolean;
  icon: LucideIcon;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}

function Field({ label, optional, icon: Icon, placeholder, value, onChange }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-semibold text-foreground">
        {label}
        {optional && (
          <span className="ml-1 font-normal text-muted-foreground">(optional)</span>
        )}
      </label>
      <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-3.5 h-12 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition">
        <Icon className="h-4 w-4 text-muted-foreground shrink-0" strokeWidth={2} />
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-transparent outline-none text-[15px] text-foreground placeholder:text-muted-foreground"
        />
      </div>
    </div>
  );
}

interface InfoRowProps {
  icon: LucideIcon;
  title: string;
  desc: string;
}

function InfoRow({ icon: Icon, title, desc }: InfoRowProps) {
  return (
    <div className="flex gap-3 items-start py-3">
      <div className="h-10 w-10 shrink-0 rounded-full bg-secondary flex items-center justify-center">
        <Icon className="h-[18px] w-[18px] text-primary" strokeWidth={2.2} />
      </div>
      <div className="flex-1 pt-0.5">
        <h3 className="text-[14px] font-semibold text-foreground leading-snug">{title}</h3>
        <p className="mt-0.5 text-[13px] text-muted-foreground leading-snug">{desc}</p>
      </div>
    </div>
  );
}

export function AddressVerification() {
  const [building, setBuilding] = useState("");
  const [room, setRoom] = useState("");
  const [address, setAddress] = useState("");

  return (
    <main className="min-h-screen bg-background flex justify-center">
      <div className="w-full max-w-md px-5 pt-6 pb-8 flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link
            to="/"
            aria-label="Go back"
            className="h-10 w-10 -ml-2 flex items-center justify-center rounded-full hover:bg-secondary active:scale-95 transition"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" strokeWidth={2.2} />
          </Link>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Location Details
          </h1>
        </div>

        {/* Form fields */}
        <div className="space-y-4">
          <Field
            label="Building name"
            optional
            icon={Building2}
            placeholder="e.g. Greenview Heights"
            value={building}
            onChange={setBuilding}
          />
          <Field
            label="Room / apartment number"
            optional
            icon={DoorOpen}
            placeholder="e.g. 5B"
            value={room}
            onChange={setRoom}
          />
          <Field
            label="Address"
            icon={MapPin}
            placeholder="Start typing your street address"
            value={address}
            onChange={setAddress}
          />
        </div>

        {/* Verification info card */}
        <section className="mt-6 rounded-3xl bg-card border border-border p-4 divide-y divide-border">
          <InfoRow
            icon={ShieldCheck}
            title="Verify Your Address"
            desc="We'll verify your address with your local municipality to help build trust in the neighbourhood."
          />
          <InfoRow
            icon={Clock}
            title="Verification usually takes up to 24 hours."
            desc="We'll notify you as soon as it's complete."
          />
          <InfoRow
            icon={Lock}
            title="Your information is secure."
            desc="We only share the minimum required information for verification."
          />
          <InfoRow
            icon={Users}
            title="Once verified, you can get started!"
            desc="Enjoy full access to connect and contribute in your neighbourhood."
          />
        </section>

        {/* Helper note */}
        <div className="mt-4 flex items-center gap-2 rounded-2xl bg-secondary/60 px-3.5 py-2.5">
          <Info className="h-4 w-4 text-muted-foreground shrink-0" strokeWidth={2} />
          <p className="text-[12.5px] text-muted-foreground">
            All fields are optional but help speed up verification.
          </p>
        </div>

        {/* Submit */}
        <Link
          to="/verify-address/submitted"
          className="mt-5 w-full h-13 py-3.5 rounded-2xl bg-foreground text-background font-medium text-[15px] flex items-center justify-center gap-2 active:scale-[0.99] transition shadow-sm"
        >
          <ShieldCheck className="h-[18px] w-[18px]" strokeWidth={2.2} />
          Apply for Verification
        </Link>

        <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <Lock className="h-3 w-3" strokeWidth={2.2} />
          Secure &amp; private
        </p>
      </div>
    </main>
  );
}
