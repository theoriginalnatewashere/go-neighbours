-- Remove the overly-broad policy added earlier; users may only read their own row
DROP POLICY IF EXISTS "Public profile fields readable by authenticated" ON public.profiles;

-- Recreate the view as security definer (default) so it can expose only safe
-- columns of other users without granting broad row access on profiles.
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles AS
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

ALTER VIEW public.public_profiles OWNER TO postgres;

REVOKE ALL ON public.public_profiles FROM PUBLIC, anon;
GRANT SELECT ON public.public_profiles TO authenticated;
