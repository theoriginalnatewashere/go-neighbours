
-- 1) Immutable normalization helper: lowercase + trim + collapse internal whitespace.
CREATE OR REPLACE FUNCTION public.normalize_cluster(_value text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT NULLIF(lower(btrim(regexp_replace(COALESCE(_value, ''), '\s+', ' ', 'g'))), '')
$$;

-- 2) Generated key columns on every table that stores a neighbourhood/cluster.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS neighbourhood_key text
  GENERATED ALWAYS AS (public.normalize_cluster(neighbourhood)) STORED;

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS cluster_key text
  GENERATED ALWAYS AS (public.normalize_cluster(cluster)) STORED;

ALTER TABLE public.announcements
  ADD COLUMN IF NOT EXISTS cluster_key text
  GENERATED ALWAYS AS (public.normalize_cluster(cluster)) STORED;

ALTER TABLE public.verification_requests
  ADD COLUMN IF NOT EXISTS neighbourhood_key text
  GENERATED ALWAYS AS (public.normalize_cluster(neighbourhood)) STORED;

CREATE INDEX IF NOT EXISTS profiles_neighbourhood_key_idx ON public.profiles (neighbourhood_key);
CREATE INDEX IF NOT EXISTS posts_cluster_key_created_idx  ON public.posts (cluster_key, created_at DESC);
CREATE INDEX IF NOT EXISTS announcements_cluster_key_idx  ON public.announcements (cluster_key);

-- 3) Redefine current_user_neighbourhood() to return the normalized key.
CREATE OR REPLACE FUNCTION public.current_user_neighbourhood()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT neighbourhood_key FROM public.profiles WHERE id = auth.uid()
$$;

-- 4) Rewrite every cluster-scoped RLS policy to compare on the normalized key.

-- posts SELECT
DROP POLICY IF EXISTS "Cluster neighbours can view posts" ON public.posts;
CREATE POLICY "Cluster neighbours can view posts"
ON public.posts
FOR SELECT
TO authenticated
USING (
  cluster_key IS NOT NULL
  AND cluster_key = public.current_user_neighbourhood()
);

-- posts INSERT (verified users, own cluster)
DROP POLICY IF EXISTS "posts_insert_verified_own_cluster" ON public.posts;
CREATE POLICY "posts_insert_verified_own_cluster"
ON public.posts
FOR INSERT
TO authenticated
WITH CHECK (
  author_id = auth.uid()
  AND public.current_user_verification_status() = 'approved'
  AND cluster_key IS NOT NULL
  AND cluster_key = public.current_user_neighbourhood()
);

-- announcements SELECT (admins)
DROP POLICY IF EXISTS "Admins view own-cluster announcements" ON public.announcements;
CREATE POLICY "Admins view own-cluster announcements"
ON public.announcements
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  AND cluster_key = public.current_user_neighbourhood()
);

-- announcements INSERT (admins, own cluster)
DROP POLICY IF EXISTS "Admins insert announcements in own cluster" ON public.announcements;
CREATE POLICY "Admins insert announcements in own cluster"
ON public.announcements
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  AND sender_id = auth.uid()
  AND cluster_key = public.current_user_neighbourhood()
);

-- announcements SELECT (all users in the cluster)
DROP POLICY IF EXISTS "Users view own-cluster announcements" ON public.announcements;
CREATE POLICY "Users view own-cluster announcements"
ON public.announcements
FOR SELECT
TO authenticated
USING (cluster_key = public.current_user_neighbourhood());
