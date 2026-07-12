-- 1) Allow admins to delete any post
DROP POLICY IF EXISTS "Authors can delete their own posts" ON public.posts;
CREATE POLICY "Authors or admins can delete posts"
  ON public.posts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id OR public.has_role(auth.uid(), 'admin'));

-- 2) Announcements table (cluster-scoped push announcements sent by admins)
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cluster TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  delivered_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.announcements TO authenticated;
GRANT ALL ON public.announcements TO service_role;

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Admins can view announcements in their own cluster
CREATE POLICY "Admins view own-cluster announcements"
  ON public.announcements
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    AND cluster = public.current_user_neighbourhood()
  );

-- Admins can create announcements targeting their own cluster only
CREATE POLICY "Admins insert announcements in own cluster"
  ON public.announcements
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    AND sender_id = auth.uid()
    AND cluster = public.current_user_neighbourhood()
  );