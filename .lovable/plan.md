## Plan: Post-verification submission screen + posting gate

### 1. Update `src/app/components/VerificationSubmitted.tsx`
Simplify the existing screen to match the requested copy:
- Title: **"Verification submitted"**
- Body: **"While we review your address, you can explore your community, browse posts, and complete your profile."**
- Keep the shield illustration and the two small info rows (time estimate + notification) since they reinforce the message — remove the "close the app / see you soon" copy which contradicts the new "explore" direction.
- Primary CTA: **"Go to Home"** styled as the main filled button, navigating to `/home`.
- Remove the back arrow to `/verify-address` (submission is a terminal state; going back to resubmit would be confusing while pending). Users can still reach verification later from their profile.

### 2. Gate post creation until verification is approved
Currently any signed-in user with a neighbourhood set can create a post. Add an "approved-only" gate so unverified users can browse and message but cannot publish.

**Backend (authoritative):**
- New migration tightening the `posts` INSERT RLS policy to also require `public.current_user_verification_status() = 'approved'` (via a small SECURITY DEFINER helper reading `profiles.verification_status`, mirroring the existing `current_user_neighbourhood()` helper). UPDATE policy left as-is (editing existing posts stays allowed).

**Frontend (UX):**
- `src/lib/posts.ts` `createPost`: also fetch `verification_status`; throw a friendly error if not `approved` so the RLS rejection never surfaces as a raw error.
- `src/app/components/EnhancedHome.tsx` and `src/app/components/Browse.tsx`: when the signed-in user's `verification_status !== 'approved'`, render the "Create post" FAB/CTA in a disabled state with a short tooltip/toast on tap: "Available once your address is verified." Empty-state CTA on Home changes from "Create a post" to "Verify your address" linking to `/verify-address` for unverified users.
- `src/app/components/CreateRequest.tsx`: on mount, if the user isn't approved, redirect to `/verify-address` with a toast explaining why (defence in depth for deep links).

### 3. Flow confirmation
- Submit verification → `/verify-address/submitted` (new copy) → **Go to Home** → `/home`.
- On `/home`, unverified users see the feed and can open posts and message, but the create-post entry points are gated with the message above until an admin approves the request.

### Technical notes
- No schema changes beyond one migration adding the helper function and swapping the posts INSERT policy.
- Existing `verification_status` values (`unverified | pending | approved | rejected`) are reused; only `approved` unlocks posting.
- No changes to messaging, browsing, or profile editing permissions.
