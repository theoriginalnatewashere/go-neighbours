
CREATE OR REPLACE FUNCTION public.current_user_verification_status()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT verification_status FROM public.profiles WHERE id = auth.uid()
$$;

GRANT EXECUTE ON FUNCTION public.current_user_verification_status() TO authenticated;

DROP POLICY IF EXISTS "Users can create posts in their cluster" ON public.posts;
DROP POLICY IF EXISTS "posts_insert_own_cluster" ON public.posts;

CREATE POLICY "posts_insert_verified_own_cluster"
ON public.posts
FOR INSERT
TO authenticated
WITH CHECK (
  author_id = auth.uid()
  AND cluster IS NOT NULL
  AND cluster = public.current_user_neighbourhood()
  AND public.current_user_verification_status() = 'approved'
);
