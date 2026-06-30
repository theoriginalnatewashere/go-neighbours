
-- 1. Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 2. Protect profile verification fields from direct user writes
CREATE OR REPLACE FUNCTION public.protect_profile_verification_fields()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF (NEW.verification_status IS DISTINCT FROM OLD.verification_status
      OR NEW.verification_submitted_at IS DISTINCT FROM OLD.verification_submitted_at) THEN
    IF current_setting('app.bypass_verification_guard', true) = 'on' THEN
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'verification_status and verification_submitted_at are managed by the verification system';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_protect_verification
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_verification_fields();

-- 3. Verification request lifecycle triggers
CREATE OR REPLACE FUNCTION public.on_verification_request_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM set_config('app.bypass_verification_guard', 'on', true);
  UPDATE public.profiles
    SET verification_status = 'pending',
        verification_submitted_at = now()
    WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER verification_requests_after_insert
  AFTER INSERT ON public.verification_requests
  FOR EACH ROW EXECUTE FUNCTION public.on_verification_request_insert();

CREATE OR REPLACE FUNCTION public.on_verification_request_review()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status
     AND NEW.status IN ('approved', 'rejected') THEN
    -- Stamp reviewer info if admin forgot to
    IF NEW.reviewed_at IS NULL THEN NEW.reviewed_at := now(); END IF;
    IF NEW.reviewed_by IS NULL THEN NEW.reviewed_by := auth.uid(); END IF;

    PERFORM set_config('app.bypass_verification_guard', 'on', true);
    UPDATE public.profiles
      SET verification_status = NEW.status
      WHERE id = NEW.user_id;

    -- Refresh denormalised flag on all of this author's posts
    UPDATE public.posts
      SET author_verified = (NEW.status = 'approved')
      WHERE author_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

-- BEFORE so we can mutate NEW.reviewed_at / reviewed_by
CREATE TRIGGER verification_requests_before_update
  BEFORE UPDATE ON public.verification_requests
  FOR EACH ROW EXECUTE FUNCTION public.on_verification_request_review();

-- 4. Admin RLS on verification_requests
CREATE POLICY "Admins can view all verification requests"
  ON public.verification_requests FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update verification requests"
  ON public.verification_requests FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
