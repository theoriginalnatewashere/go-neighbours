
-- Add optional post relationship to conversations
ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS post_id uuid REFERENCES public.posts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS conversations_post_id_idx ON public.conversations(post_id);

-- Replace the direct-conversation helper to optionally scope by post
DROP FUNCTION IF EXISTS public.get_or_create_direct_conversation(uuid);
DROP FUNCTION IF EXISTS public.get_or_create_direct_conversation(uuid, uuid);

CREATE OR REPLACE FUNCTION public.get_or_create_direct_conversation(_other uuid, _post uuid DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = _other) THEN
    RAISE EXCEPTION 'recipient is not a neighbour';
  END IF;

  IF _post IS NOT NULL THEN
    -- Find an existing conversation between these two users tied to this post
    SELECT c.id INTO _conv
    FROM public.conversations c
    JOIN public.conversation_participants cp1
      ON cp1.conversation_id = c.id AND cp1.user_id = _me
    JOIN public.conversation_participants cp2
      ON cp2.conversation_id = c.id AND cp2.user_id = _other
    WHERE c.post_id = _post
    LIMIT 1;
  ELSE
    -- Generic direct message: match a conversation with no post context
    SELECT c.id INTO _conv
    FROM public.conversations c
    JOIN public.conversation_participants cp1
      ON cp1.conversation_id = c.id AND cp1.user_id = _me
    JOIN public.conversation_participants cp2
      ON cp2.conversation_id = c.id AND cp2.user_id = _other
    WHERE c.post_id IS NULL
    LIMIT 1;
  END IF;

  IF _conv IS NOT NULL THEN
    RETURN _conv;
  END IF;

  INSERT INTO public.conversations(post_id) VALUES (_post) RETURNING id INTO _conv;
  INSERT INTO public.conversation_participants(conversation_id, user_id)
  VALUES (_conv, _me), (_conv, _other);
  RETURN _conv;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_or_create_direct_conversation(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_or_create_direct_conversation(uuid, uuid) TO authenticated, service_role;
