
-- 1. Harden RPC: require _other to be a real profile
CREATE OR REPLACE FUNCTION public.get_or_create_direct_conversation(_other uuid)
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
$function$;

-- 2. Purge broken conversations whose participants aren't real profiles
WITH bad AS (
  SELECT DISTINCT cp.conversation_id
  FROM public.conversation_participants cp
  LEFT JOIN public.profiles p ON p.id = cp.user_id
  WHERE p.id IS NULL
)
DELETE FROM public.messages WHERE conversation_id IN (SELECT conversation_id FROM bad);

WITH bad AS (
  SELECT DISTINCT cp.conversation_id
  FROM public.conversation_participants cp
  LEFT JOIN public.profiles p ON p.id = cp.user_id
  WHERE p.id IS NULL
)
DELETE FROM public.conversation_participants WHERE conversation_id IN (SELECT conversation_id FROM bad);

WITH bad AS (
  SELECT c.id
  FROM public.conversations c
  WHERE NOT EXISTS (SELECT 1 FROM public.conversation_participants cp WHERE cp.conversation_id = c.id)
)
DELETE FROM public.conversations WHERE id IN (SELECT id FROM bad);
