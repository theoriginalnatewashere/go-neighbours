
CREATE OR REPLACE FUNCTION public.get_or_create_direct_conversation(_other uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _me uuid := auth.uid();
  _conv uuid;
BEGIN
  IF _me IS NULL THEN
    RAISE EXCEPTION 'unauthenticated';
  END IF;
  IF _other IS NULL OR _other = _me THEN
    RAISE EXCEPTION 'invalid recipient';
  END IF;

  SELECT cp1.conversation_id INTO _conv
  FROM public.conversation_participants cp1
  JOIN public.conversation_participants cp2
    ON cp1.conversation_id = cp2.conversation_id
  WHERE cp1.user_id = _me AND cp2.user_id = _other
  LIMIT 1;

  IF _conv IS NOT NULL THEN
    RETURN _conv;
  END IF;

  INSERT INTO public.conversations DEFAULT VALUES RETURNING id INTO _conv;
  INSERT INTO public.conversation_participants(conversation_id, user_id)
  VALUES (_conv, _me), (_conv, _other);
  RETURN _conv;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_or_create_direct_conversation(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_or_create_direct_conversation(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_conversation_partners()
RETURNS TABLE(conversation_id uuid, user_id uuid, display_name text, full_name text, avatar_url text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT cp.conversation_id, cp.user_id, p.display_name, p.full_name, p.avatar_url
  FROM public.conversation_participants cp
  JOIN public.profiles p ON p.id = cp.user_id
  WHERE cp.user_id <> auth.uid()
    AND cp.conversation_id IN (
      SELECT conversation_id
      FROM public.conversation_participants
      WHERE user_id = auth.uid()
    );
$$;

REVOKE EXECUTE ON FUNCTION public.get_conversation_partners() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_conversation_partners() TO authenticated;
