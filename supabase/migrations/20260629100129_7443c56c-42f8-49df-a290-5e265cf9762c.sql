
CREATE OR REPLACE FUNCTION public.current_user_neighbourhood()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT neighbourhood FROM public.profiles WHERE id = auth.uid()
$$;

REVOKE EXECUTE ON FUNCTION public.current_user_neighbourhood() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_neighbourhood() TO authenticated, service_role;

CREATE TABLE public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cluster text NOT NULL,
  building text,
  category text NOT NULL DEFAULT 'Help',
  urgency text NOT NULL DEFAULT 'medium' CHECK (urgency IN ('low','medium','high')),
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX posts_cluster_created_idx ON public.posts (cluster, created_at DESC);
CREATE INDEX posts_author_idx ON public.posts (author_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.posts TO authenticated;
GRANT ALL ON public.posts TO service_role;

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cluster neighbours can view posts"
  ON public.posts FOR SELECT
  TO authenticated
  USING (
    cluster IS NOT NULL
    AND cluster = public.current_user_neighbourhood()
  );

CREATE POLICY "Authors can insert posts in their cluster"
  ON public.posts FOR INSERT
  TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND cluster = public.current_user_neighbourhood()
  );

CREATE POLICY "Authors can update their own posts"
  ON public.posts FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Authors can delete their own posts"
  ON public.posts FOR DELETE
  TO authenticated
  USING (author_id = auth.uid());

CREATE TRIGGER posts_set_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
