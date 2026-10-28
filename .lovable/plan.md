# Merge the Go Neighbors landing page into Go Neighbours

## What I found

**Main app (this project)** — 22 pages, all at the top level (`/home`, `/browse`, `/messages`, `/chat/…`, `/request/…`, `/notifications`, `/profile`, `/auth`, `/location…`, `/verify-address…`, `/admin/verifications`, etc.). Today `/` is the welcome screen and sends signed-in members straight to `/home` or `/location`.

**Landing project (Go Neighbors Landing)** — one page plus a sitemap and an "install app" pop-up. No backend. Its neighbourhood picker is a hard-coded list (e.g. Utrecht › Keramus Building, Delft › TUDelft Campus) that opens WhatsApp groups.

## Compatibility issues

| Issue | Impact | How it's handled |
|---|---|---|
| Both projects own `/` | Clash | Landing page takes `/`; current welcome screen moves to `/app` |
| ~60 internal links, redirects and sign-in returns point at old paths | Broken navigation if moved blindly | Update every link; keep every old path as a redirect to its `/app/…` twin (keeping `?next=`, `?post=`, `?edit=` etc.) |
| Phone alerts open `/chat/…` and `/notifications` | Old alerts already on phones | Point new alerts to `/app/…`; old links still work via redirects |
| Installed app opens `/home` | Existing installs | Start page becomes `/app/home`; old one redirects |
| Sign-up confirmation emails and Google return to old paths | Sign-in loops | Update return addresses; old ones redirect |
| AI agent connection pages (`/mcp`, `/.well-known/…`, `/.lovable/oauth/consent`) | Registered addresses must not change | Left exactly where they are |
| Landing images are Lovable-hosted pointers (4) | Would break on Cloudflare | Download into `public/images/` (per project rule) |
| Different fonts/colours (DM Sans + DM Serif Display, own palette) | Could restyle the app | Landing styles scoped to the landing page only; app look unchanged |
| Name spelling "Go Neighbors" vs "Go Neighbours" | Inconsistent | Use "Go Neighbours" on the landing page |
| Share image points at the old landing address | Wrong preview | Copy `og-share.jpg` here and use this app's address |
| No country/city stored anywhere — only free-text neighbourhood | Directory can't group | New admin-managed list (below) |

## Plan

### 1. Neighbourhood directory data (additive only, nothing reset)
- New admin-managed list of neighbourhoods: name, city, country, active on/off — linked to the existing neighbourhood key members already have.
- Pre-filled from neighbourhoods members already use (e.g. Antonia Veerstraat, Delft); I'll fill in city/country where it's obvious and leave the rest for an admin to complete. Incomplete entries stay hidden.
- One public lookup returning **only** country, city, neighbourhood name — shown only when marked active and has at least one member who finished sign-up. No counts, no names, no addresses.
- Small admin screen at `/app/admin/neighbourhoods` (admins only) to set country, city and active status.
- Existing users, posts, messages, verification, announcements and all current access rules untouched.

### 2. Move the app under `/app`
- `/app` = current welcome screen (signed-in members still go on to Home/Location as today).
- Every page moves to `/app/<same name>`, e.g. `/app/home`, `/app/request/123`, `/app/auth`.
- Every old address redirects to its new one.

### 3. Landing page at `/`
- Copy design, copy text and layout as-is, including the install pop-up and sitemap.
- "Find your neighbours" becomes **"Explore active neighbourhoods"**, with country and city filters and a Country › City › Neighbourhood list from live data, plus empty and loading states.
- Guests see "Join your neighbourhood" / "Sign in" → `/app/auth`. Signed-in members see **Open App** → `/app/home`.
- Each directory entry gets a "Join on Go Neighbours" button in place of the WhatsApp link (see question below).

### 4. Checks
- Tests: public lookup returns no private fields and hides inactive or empty neighbourhoods; old addresses redirect correctly.
- Browser: landing page as guest and as a signed-in member, on mobile and desktop; deep links (`/request/…`, `/chat/…`, `/auth?next=…`) still land correctly.
- Production build including the Cloudflare output.

## Open question
The landing page links each neighbourhood to a WhatsApp group. Should I swap these for "Join on Go Neighbours" (my default), or keep WhatsApp links as an optional admin-managed field?

## Technical details
- Table `public.neighbourhood_directory(neighbourhood_key text PK, display_name, city, country, is_active bool default false, timestamps)`; GRANT to authenticated/service_role; RLS: admin-only writes via `has_role`, no direct anon access.
- `public.get_active_neighbourhoods()` SECURITY DEFINER, `GRANT EXECUTE TO anon, authenticated`, returns `(country, city, name)` via `EXISTS` on `profiles.neighbourhood_key` with `onboarding_completed`.
- Routes move to `src/routes/app/…` (`_authenticated` layout nested under `app`); old files become thin `beforeLoad` redirects. MCP/OAuth routes and `/sw.js` scope `/` unchanged; manifest `start_url` `/app/home`; Edge Function push URLs updated.
- Landing loaded via server function with publishable client; signed-in state read on the client after hydration.
