CREATE OR REPLACE FUNCTION public.get_conversation_partners()
 RETURNS TABLE(conversation_id uuid, user_id uuid, display_name text, full_name text, avatar_url text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT cp.conversation_id, cp.user_id, p.display_name, p.full_name, p.avatar_url
  FROM public.conversation_participants cp
  LEFT JOIN public.profiles p ON p.id = cp.user_id
  WHERE cp.user_id <> auth.uid()
    AND cp.conversation_id IN (
      SELECT conversation_id
      FROM public.conversation_participants
      WHERE user_id = auth.uid()
    );
$function$;