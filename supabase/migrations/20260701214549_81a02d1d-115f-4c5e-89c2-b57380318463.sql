
-- 1) likes_count on posts (denormalised for feed display)
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS likes_count INTEGER NOT NULL DEFAULT 0;

-- 2) post_likes table
CREATE TABLE IF NOT EXISTS public.post_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id)
);

CREATE INDEX IF NOT EXISTS post_likes_user_id_created_at_idx
  ON public.post_likes(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS post_likes_post_id_idx
  ON public.post_likes(post_id);

GRANT SELECT, INSERT, DELETE ON public.post_likes TO authenticated;
GRANT ALL ON public.post_likes TO service_role;

ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

-- Users may see likes on posts they can see (posts RLS already scopes to cluster).
CREATE POLICY "Members can view likes on visible posts"
  ON public.post_likes FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_likes.post_id)
  );

CREATE POLICY "Users can like posts they can see"
  ON public.post_likes FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_likes.post_id)
  );

CREATE POLICY "Users can remove their own likes"
  ON public.post_likes FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- 3) Trigger to keep posts.likes_count in sync
CREATE OR REPLACE FUNCTION public.sync_post_likes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS post_likes_count_ins ON public.post_likes;
CREATE TRIGGER post_likes_count_ins
  AFTER INSERT ON public.post_likes
  FOR EACH ROW EXECUTE FUNCTION public.sync_post_likes_count();

DROP TRIGGER IF EXISTS post_likes_count_del ON public.post_likes;
CREATE TRIGGER post_likes_count_del
  AFTER DELETE ON public.post_likes
  FOR EACH ROW EXECUTE FUNCTION public.sync_post_likes_count();
