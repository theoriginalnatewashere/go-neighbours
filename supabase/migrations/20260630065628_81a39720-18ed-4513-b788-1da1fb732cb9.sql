
REVOKE EXECUTE ON FUNCTION public.protect_profile_verification_fields() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.on_verification_request_insert() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.on_verification_request_review() FROM PUBLIC, anon, authenticated;
