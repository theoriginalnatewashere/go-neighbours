
-- Fix: post_likes SELECT should be limited to likes on posts the viewer can actually see
DROP POLICY IF EXISTS "Members can view likes on visible posts" ON public.post_likes;
CREATE POLICY "Members can view likes on visible posts"
ON public.post_likes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.posts p
    WHERE p.id = post_likes.post_id
      AND p.cluster IS NOT NULL
      AND p.cluster = public.current_user_neighbourhood()
  )
);

-- Fix: conversation_participants INSERT should not allow joining arbitrary conversations
DROP POLICY IF EXISTS "Users can add themselves as participant" ON public.conversation_participants;
CREATE POLICY "Users can add themselves as participant"
ON public.conversation_participants
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND NOT EXISTS (
    SELECT 1 FROM public.conversation_participants cp
    WHERE cp.conversation_id = conversation_participants.conversation_id
  )
);
