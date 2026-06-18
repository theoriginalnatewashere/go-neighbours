# Go Neighbours — Figma Import Migration Plan

## 1. What's actually in `src/imports/`

`src/imports/` contains **14 PNG screenshots** (no `.tsx`/`.jsx` Figma source). Several files are byte-identical duplicates:

| Unique screen | Files | Purpose |
|---|---|---|
| Welcome / Onboarding hero | `image.png` ≡ `image-7.png` | Get Started landing |
| "Chat Directly with Neighbors" sign-up | `image-1.png` ≡ `image-6.png` | Auth entry (Email / Apple) |
| Allow Location Access | `image-2.png` ≡ `image-8.png` | Location permission prompt |
| Finding neighbourhood cluster (loader) | `image-3.png` ≡ `image-9.png` | Progress / scanning state |
| Cluster assigned (D18) | `image-4.png` ≡ `image-10.png` | Cluster confirmation |
| Profile Setup (skills, tags) | `image-5.png` ≡ `image-11.png` | Profile creation form |
| Location Details / Verify Address | `image-12.png` | Already built |
| Verification Submitted | `image-13.png` | Post-verify confirmation |

Net: **8 unique screens**, **2 already implemented** (`/` Onboarding, `/verify-address` Address Verification), **6 to add**.

Note: the screenshots are greyscale wireframes. The warm beige / cream / coral / peach / muted-orange palette in `src/styles.css` is the source of truth — do **not** copy the grey tones from PNGs.

## 2. Screen → route mapping

| # | Screen | Proposed route | Status |
|---|---|---|---|
| 1 | Welcome | `/` | Exists (`Onboarding.tsx`) — minor copy/illustration update |
| 2 | Sign up (Email / Apple) | `/auth` | New, static UI only |
| 3 | Allow Location Access | `/location` | New |
| 4 | Finding cluster (scanning) | `/location/scanning` | New |
| 5 | Cluster assigned | `/location/cluster` | New |
| 6 | Profile Setup | `/profile-setup` | New |
| 7 | Location Details | `/verify-address` | Exists (`AddressVerification.tsx`) |
| 8 | Verification Submitted | `/verify-address/submitted` | New |

End-to-end flow: `/` → `/auth` → `/location` → `/location/scanning` → `/location/cluster` → `/profile-setup` → `/verify-address` → `/verify-address/submitted`.

## 3. New components to build in `src/app/components/`

One file per screen, each composed from the existing pattern library:

- `AuthSignUp.tsx` — illustration block, headline, two pill buttons (Email, Apple) with leading icons.
- `LocationPermission.tsx` — map illustration, 3-row info list (reuse the `InfoRow` shape already in `AddressVerification.tsx`), primary "Allow Location Access" + ghost "Not now".
- `ClusterScanning.tsx` — animated radar/cluster illustration, segmented progress (Scanning / Matching / Preparing), step list with status icons, "Continue in background" + "Cancel".
- `ClusterAssigned.tsx` — cluster graphic, headline, large cluster-id card (e.g. "D18"), Continue CTA.
- `ProfileSetup.tsx` — avatar uploader, name input, multi-line "About me", chip multi-select for Skills, segmented "How long have you lived here" group, chip multi-select for Interest tags, "Verify Location" CTA.
- `VerificationSubmitted.tsx` — shield illustration, two info rows (estimated time, notification), closing copy. Reuse the existing shield icon from `AddressVerification.tsx`.

## 4. Reusable patterns to extract / extend

`src/app/components/patterns/index.tsx` already exposes `NeighborAvatar`, `TrustBadge`, `CategoryFilter`, `PostCard`, `BottomNav`, `FloatingActionButton`, `MessageThreadItem`, `NotificationItem`, `SafetyCard`. Add these onboarding-flow primitives:

- `ScreenHeader` — back-arrow + title row used on screens 3, 6, 7, 8.
- `InfoRow` — promote the local component out of `AddressVerification.tsx` (used on screens 3, 7, 8).
- `ChipToggle` / `ChipGroup` — selectable rounded pills for Skills + Interests on screen 6.
- `SegmentedControl` — for "How long have you been here" on screen 6 and the Scanning/Matching/Preparing indicator on screen 4.
- `PrimaryButton` / `GhostButton` wrappers around shadcn `Button` with the project's rounded-xl coral styling, so every screen uses the same CTA shape.
- `IllustrationFrame` — soft rounded card with cream background that hosts each hero illustration placeholder.

## 5. Existing files likely to need updates

- `src/routes/index.tsx` / `Onboarding.tsx` — small copy alignment ("Go Neighbour" wording, three feature chips Trust/Help/Community).
- `src/app/components/AddressVerification.tsx` — extract `InfoRow` and `Field` into patterns once new screens reuse them.
- `src/app/components/patterns/index.tsx` — add the 6 primitives above.
- `src/routeTree.gen.ts` — auto-regenerates; do not hand-edit.
- `src/styles.css` — only if a new semantic token is genuinely needed (e.g. a "muted-cream" surface). Prefer existing tokens.
- `src/routes/__root.tsx` — confirm the 393px phone-frame wrapper still wraps every new route via `<Outlet />`; no structural change expected.

## 6. Risks and things to avoid

- **PNG-only references.** No Figma component tree to copy; layouts must be rebuilt from scratch. Don't attempt OCR-style pixel-matching — match intent, not greyscale.
- **Greyscale palette mismatch.** Screenshots look mono; the live design system is warm beige/coral. Use only `bg-background`, `bg-card`, `bg-primary`, `bg-accent`, `text-foreground`, etc. Reject any hardcoded `#fff` / `bg-white` / `bg-neutral-*`.
- **Absolute positioning temptation.** Each screen is a vertical stack — build with flex/`gap`, not absolute coordinates, so the 393px frame stays responsive at smaller widths.
- **Duplicated info-row / shield / field components.** Several screens repeat the same row primitives already inlined in `AddressVerification.tsx`. Extract before re-implementing to avoid drift.
- **Illustration placeholders.** Use simple rounded `IllustrationFrame` blocks with lucide icons, not generated images, to keep the migration token-light.
- **Form state.** Profile Setup has the most state (chips, segmented, textarea). Keep it local `useState`, mocked, no persistence.
- **Route nesting.** `/location/scanning` and `/location/cluster` should be sibling flat files (`location.scanning.tsx`, `location.cluster.tsx`), not a layout — no shared chrome.
- **Auth screen wording.** Screenshot says "Sign up with Apple"; project rule is no backend in this step. Keep buttons static (no handlers wired to providers).

## 7. Recommended implementation order

1. Extract shared primitives into `patterns/` (`ScreenHeader`, `InfoRow`, `ChipGroup`, `SegmentedControl`, `IllustrationFrame`, button wrappers).
2. Refactor `AddressVerification.tsx` to consume the extracted primitives (no visual change).
3. Build screens in user-flow order so the prototype is walkable after each step:
   1. `AuthSignUp` → `/auth`
   2. `LocationPermission` → `/location`
   3. `ClusterScanning` → `/location/scanning`
   4. `ClusterAssigned` → `/location/cluster`
   5. `ProfileSetup` → `/profile-setup`
   6. `VerificationSubmitted` → `/verify-address/submitted`
4. Wire navigation: each CTA uses `<Link>` / `useNavigate` to advance the flow with mock data.
5. Add `head()` metadata (title + description) per route for SEO, single H1 per screen.
6. Verify build, then tour the flow at 393px in the preview.

No files will be modified until this plan is approved.
