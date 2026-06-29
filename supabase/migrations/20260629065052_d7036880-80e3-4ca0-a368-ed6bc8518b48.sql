-- Restrict profiles SELECT to own row only
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;

CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Public-facing safe view of profile fields, usable for neighbour cards
CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker = true) AS
SELECT
  id,
  display_name,
  full_name,
  avatar_url,
  bio,
  interests,
  skills,
  tenure
FROM public.profiles;

REVOKE ALL ON public.public_profiles FROM PUBLIC, anon;
GRANT SELECT ON public.public_profiles TO authenticated;

-- Allow the view (running as invoker) to read the underlying rows for any user
CREATE POLICY "Public profile fields readable by authenticated"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);
