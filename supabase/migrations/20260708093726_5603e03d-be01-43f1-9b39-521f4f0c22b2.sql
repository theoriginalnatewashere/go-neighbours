-- Ensure RLS helper functions have EXECUTE granted to the roles that evaluate policies.
-- SECURITY DEFINER functions still need EXECUTE for the calling role.
-- Revoke from PUBLIC first for least privilege, then grant explicitly.

REVOKE ALL ON FUNCTION public.current_user_neighbourhood() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_neighbourhood() TO authenticated, anon, service_role;

REVOKE ALL ON FUNCTION public.current_user_verification_status() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_verification_status() TO authenticated, anon, service_role;

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, anon, service_role;

REVOKE ALL ON FUNCTION public.is_conversation_participant(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_conversation_participant(uuid, uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.get_or_create_direct_conversation(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_or_create_direct_conversation(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.get_conversation_partners() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_conversation_partners() TO authenticated, service_role;
