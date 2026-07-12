CREATE POLICY "Users view own-cluster announcements"
ON public.announcements
FOR SELECT
TO authenticated
USING (cluster = public.current_user_neighbourhood());