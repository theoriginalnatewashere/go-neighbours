import { Link } from "@tanstack/react-router";
import { ArrowLeft, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/* ---------------- MobileShell ---------------- */
export function MobileShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative mx-auto flex min-h-screen w-[393px] max-w-full flex-col bg-background",
        className,
      )}
    >
      {children}
    </div>
  );
}

/* ---------------- ScreenHeader ---------------- */
export function ScreenHeader({
  title,
  subtitle,
  backTo,
  rightSlot,
  sticky = true,
}: {
  title?: string;
  subtitle?: string;
  backTo?: string;
  rightSlot?: ReactNode;
  sticky?: boolean;
}) {
  return (
    <header
      className={cn(
        "z-20 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 bg-background/85 px-4 pt-4 pb-3 backdrop-blur",
        sticky && "sticky top-0",
      )}
    >
      {backTo ? (
        <Link
          to={backTo}
          aria-label="Back"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-card text-foreground shadow-sm hover:bg-secondary"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
      ) : (
        <span className="h-10 w-10" />
      )}
      <div className="min-w-0 text-center">
        {title && (
          <h1 className="truncate text-base font-semibold">{title}</h1>
        )}
        {subtitle && (
          <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>
      <div className="flex items-center justify-end">{rightSlot}</div>
    </header>
  );
}

/* ---------------- PrimaryButton ---------------- */
export function PrimaryButton({
  children,
  className,
  icon: Icon,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { icon?: LucideIcon }) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/25 transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50",
        className,
      )}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {children}
    </button>
  );
}

/* ---------------- LabeledField ---------------- */
export function LabeledField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-foreground">
        {label}
      </span>
      {children}
      {hint && (
        <span className="mt-1 block text-[11px] text-muted-foreground">
          {hint}
        </span>
      )}
    </label>
  );
}
