import { redirect } from "@tanstack/react-router";

// Pages moved from the site root to /app. Old links (bookmarks, emails,
// push notifications, installed PWAs) keep working via a permanent redirect
// that preserves the full path, search params and hash.
export function redirectToAppPath({ location }: { location: { href: string } }): never {
  throw redirect({ href: `/app${location.href}`, statusCode: 301, replace: true });
}
