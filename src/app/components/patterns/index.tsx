import { Link } from "@tanstack/react-router";
import {
  BadgeCheck,
  Bell,
  Heart,
  Home,
  type LucideIcon,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Shield,
  Trash2,
  User,
} from "lucide-react";
import { type ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


/* ---------------- NeighborAvatar ---------------- */
type AvatarSize = "sm" | "md" | "lg";
const avatarSizes: Record<AvatarSize, string> = {
  sm: "h-8 w-8 text-xs",
  md: "h-11 w-11 text-sm",
  lg: "h-14 w-14 text-base",
};

export function NeighborAvatar({
  name,
  src,
  size = "md",
  verified,
  className,
}: {
  name: string;
  src?: string;
  size?: AvatarSize;
  verified?: boolean;
  className?: string;
}) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className={cn("relative inline-flex shrink-0", className)}>
      <div
        className={cn(
          "flex items-center justify-center overflow-hidden rounded-full bg-secondary font-semibold text-secondary-foreground",
          avatarSizes[size],
        )}
      >
        {src ? (
          <img src={src} alt={name} className="h-full w-full object-cover" />
        ) : (
          <span>{initials}</span>
        )}
      </div>
      {verified && (
        <span className="absolute -right-0.5 -bottom-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground ring-2 ring-background">
          <BadgeCheck className="h-3 w-3" />
        </span>
      )}
    </div>
  );
}

/* ---------------- TrustBadge ---------------- */
type TrustLevel = "verified" | "trusted" | "new";
const trustStyles: Record<TrustLevel, { label: string; className: string }> = {
  verified: {
    label: "Verified",
    className: "bg-primary/10 text-primary",
  },
  trusted: {
    label: "Trusted neighbor",
    className: "bg-accent/40 text-accent-foreground",
  },
  new: {
    label: "New",
    className: "bg-muted text-muted-foreground",
  },
};

export function TrustBadge({
  level = "verified",
  label,
  className,
}: {
  level?: TrustLevel;
  label?: string;
  className?: string;
}) {
  const s = trustStyles[level];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
        s.className,
        className,
      )}
    >
      <BadgeCheck className="h-3 w-3" />
      {label ?? s.label}
    </span>
  );
}

/* ---------------- CategoryFilter ---------------- */
export type Category = { id: string; label: string };

export function CategoryFilter({
  categories,
  value,
  onChange,
  className,
}: {
  categories: Category[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4",
        className,
      )}
    >
      {categories.map((c) => {
        const active = c.id === value;
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onChange(c.id)}
            className={cn(
              "shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-foreground hover:bg-secondary",
            )}
          >
            {c.label}
          </button>
        );
      })}
    </div>
  );
}

/* ---------------- PostCard ---------------- */
export type Post = {
  id: string;
  author: { name: string; avatar?: string; verified?: boolean };
  category?: string;
  timeAgo: string;
  title?: string;
  body: string;
  likes: number;
  liked?: boolean;
  comments: number;
  urgency?: "low" | "medium" | "high";
  previewImageUrl?: string;
  imageCount?: number;
};

const urgencyTone: Record<NonNullable<Post["urgency"]>, string> = {
  high: "bg-destructive/10 text-destructive",
  medium: "bg-accent/50 text-accent-foreground",
  low: "bg-secondary text-secondary-foreground",
};

export function PostCard({
  post,
  onLike,
  onComment,
  expandable,
  expanded,
  onToggle,
  canManage,
  onEdit,
  onDelete,
}: {
  post: Post;
  onLike?: (id: string) => void;
  onComment?: (id: string) => void;
  expandable?: boolean;
  expanded?: boolean;
  onToggle?: (id: string) => void;
  canManage?: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}) {

  const interactive = expandable && !!onToggle;
  const isOpen = !!expanded;

  const handleToggle = () => onToggle?.(post.id);
  const handleKey = (e: React.KeyboardEvent<HTMLElement>) => {
    if (!interactive) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleToggle();
    }
  };
  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <article
      className={cn(
        "relative rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors",
        interactive &&
          "cursor-pointer hover:bg-secondary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      )}
      onClick={interactive ? handleToggle : undefined}
      onKeyDown={interactive ? handleKey : undefined}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-expanded={interactive ? isOpen : undefined}
    >
      {post.urgency && (
        <span
          className={cn(
            "absolute top-3 right-3 z-10 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
            urgencyTone[post.urgency],
          )}
        >
          {post.urgency}
        </span>
      )}

      <header className="flex items-center gap-3">
        <NeighborAvatar
          name={post.author.name}
          src={post.author.avatar}
          verified={post.author.verified}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold">{post.author.name}</p>
            {post.category && (
              <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground">
                {post.category}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{post.timeAgo}</p>
        </div>
        {canManage ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                onClick={stop}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-secondary"
                aria-label="Post options"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              onClick={stop}
              onCloseAutoFocus={(e) => e.preventDefault()}
            >
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  onEdit?.(post.id);
                }}
              >
                <Pencil className="mr-2 h-4 w-4" /> Edit post
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  onDelete?.(post.id);
                }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete post
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <button
            type="button"
            onClick={stop}
            className="rounded-full p-1.5 text-muted-foreground hover:bg-secondary"
            aria-label="Post options"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        )}
      </header>


      {post.previewImageUrl && (
        <div className="relative mt-3 overflow-hidden rounded-xl border border-border bg-secondary">
          <img
            src={post.previewImageUrl}
            alt=""
            className="h-40 w-full object-cover"
            loading="lazy"
          />
          {post.imageCount && post.imageCount > 1 && (
            <span className="absolute right-2 bottom-2 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white">
              +{post.imageCount - 1}
            </span>
          )}
        </div>
      )}

      {post.title && (
        <h3 className="mt-3 text-base font-semibold leading-snug">
          {post.title}
        </h3>
      )}
      <p
        className={cn(
          "mt-1.5 whitespace-pre-line text-sm leading-relaxed text-foreground/90",
          interactive && !isOpen && "line-clamp-2",
        )}
      >
        {post.body}
      </p>

      {interactive && (
        <button
          type="button"
          onClick={(e) => {
            stop(e);
            handleToggle();
          }}
          className="mt-2 text-xs font-medium text-primary hover:underline"
          aria-label={isOpen ? "Collapse post" : "Expand post"}
        >
          {isOpen ? "Show less" : "Read more"}
        </button>
      )}

      <footer className="mt-4 flex items-center gap-5 text-sm text-muted-foreground">
        <button
          type="button"
          onClick={(e) => {
            stop(e);
            onLike?.(post.id);
          }}
          aria-pressed={!!post.liked}
          aria-label={post.liked ? "Unlike post" : "Like post"}
          className={cn(
            "inline-flex items-center gap-1.5 transition-colors",
            post.liked ? "text-primary" : "hover:text-primary",
          )}
        >
          <Heart
            className={cn("h-4 w-4", post.liked && "fill-current")}
          />
          {post.likes}
        </button>
        <button
          type="button"
          onClick={(e) => {
            stop(e);
            onComment?.(post.id);
          }}
          className="inline-flex items-center gap-1.5 hover:text-primary"
        >
          <MessageCircle className="h-4 w-4" />
          {post.comments}
        </button>
      </footer>
    </article>
  );
}


/* ---------------- BottomNav ---------------- */
export type NavItem = {
  id: string;
  label: string;
  to: string;
  icon: LucideIcon;
  badge?: number;
};

export const defaultNavItems: NavItem[] = [
  { id: "home", label: "Home", to: "/home", icon: Home },
  { id: "explore", label: "Browse", to: "/browse", icon: Search },
  { id: "messages", label: "Messages", to: "/messages", icon: MessageCircle },
  { id: "profile", label: "Profile", to: "/profile", icon: User },
];

export function BottomNav({
  items = defaultNavItems,
  activeId,
}: {
  items?: NavItem[];
  activeId?: string;
}) {
  return (
    <nav className="sticky bottom-0 z-40 border-t border-border bg-card/90 backdrop-blur">
      <ul className="mx-auto flex max-w-md items-stretch justify-around px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.id === activeId;
          return (
            <li key={item.id} className="flex-1">
              <Link
                to={item.to}
                className={cn(
                  "relative flex flex-col items-center gap-0.5 rounded-xl py-1.5 text-[11px] font-medium transition-colors",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span className="relative">
                  <Icon className="h-5 w-5" />
                  {item.badge ? (
                    <span className="absolute -top-1 -right-2 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                      {item.badge > 9 ? "9+" : item.badge}
                    </span>
                  ) : null}
                </span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/* ---------------- FloatingActionButton ---------------- */
export function FloatingActionButton({
  onClick,
  label = "Create post",
  icon: Icon = Plus,
  className,
}: {
  onClick?: () => void;
  label?: string;
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "fixed right-5 bottom-24 z-30 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform hover:scale-105 active:scale-95",
        className,
      )}
    >
      <Icon className="h-6 w-6" />
    </button>
  );
}

/* ---------------- MessageThreadItem ---------------- */
export type MessageThread = {
  id: string;
  name: string;
  avatar?: string;
  verified?: boolean;
  preview: string;
  timeAgo: string;
  unread?: number;
};

export function MessageThreadItem({
  thread,
  onClick,
}: {
  thread: MessageThread;
  onClick?: (id: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onClick?.(thread.id)}
      className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors hover:bg-secondary"
    >
      <NeighborAvatar
        name={thread.name}
        src={thread.avatar}
        verified={thread.verified}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-semibold">{thread.name}</p>
          <span className="shrink-0 text-[11px] text-muted-foreground">
            {thread.timeAgo}
          </span>
        </div>
        <p
          className={cn(
            "truncate text-sm",
            thread.unread
              ? "font-medium text-foreground"
              : "text-muted-foreground",
          )}
        >
          {thread.preview}
        </p>
      </div>
      {thread.unread ? (
        <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground">
          {thread.unread}
        </span>
      ) : null}
    </button>
  );
}

/* ---------------- NotificationItem ---------------- */
type NotifKind = "message" | "like" | "comment" | "system";
const notifIcon: Record<NotifKind, LucideIcon> = {
  message: MessageCircle,
  like: Heart,
  comment: MessageCircle,
  system: Bell,
};

export type Notification = {
  id: string;
  kind: NotifKind;
  title: string;
  description?: string;
  timeAgo: string;
  read?: boolean;
};

export function NotificationItem({
  notification,
  onClick,
}: {
  notification: Notification;
  onClick?: (id: string) => void;
}) {
  const Icon = notifIcon[notification.kind];
  return (
    <button
      type="button"
      onClick={() => onClick?.(notification.id)}
      className={cn(
        "flex w-full items-start gap-3 rounded-2xl px-3 py-3 text-left transition-colors hover:bg-secondary",
        !notification.read && "bg-accent/20",
      )}
    >
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-snug">{notification.title}</p>
        {notification.description && (
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
            {notification.description}
          </p>
        )}
        <p className="mt-1 text-[11px] text-muted-foreground">
          {notification.timeAgo}
        </p>
      </div>
      {!notification.read && (
        <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
      )}
    </button>
  );
}

/* ---------------- SafetyCard ---------------- */
export function SafetyCard({
  title,
  children,
  icon: Icon = Shield,
  action,
}: {
  title: string;
  children: ReactNode;
  icon?: LucideIcon;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-accent/30 p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold">{title}</h3>
          <div className="mt-1 text-sm leading-relaxed text-foreground/85">
            {children}
          </div>
          {action && <div className="mt-3">{action}</div>}
        </div>
      </div>
    </div>
  );
}
