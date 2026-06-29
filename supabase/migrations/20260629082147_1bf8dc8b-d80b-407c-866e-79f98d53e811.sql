-- 1) Status enum
DO $$ BEGIN
  CREATE TYPE public.verification_status AS ENUM ('unverified','pending','approved','rejected');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2) Profile columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS verification_status public.verification_status NOT NULL DEFAULT 'unverified',
  ADD COLUMN IF NOT EXISTS verification_submitted_at TIMESTAMPTZ;

-- 3) Verification requests table
CREATE TABLE IF NOT EXISTS public.verification_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.verification_status NOT NULL DEFAULT 'pending',
  neighbourhood TEXT NOT NULL,
  address TEXT NOT NULL,
  building TEXT,
  room TEXT,
  reviewer_note TEXT,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4) Grants
GRANT SELECT, INSERT ON public.verification_requests TO authenticated;
GRANT ALL ON public.verification_requests TO service_role;

-- 5) RLS
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own verification requests" ON public.verification_requests;
CREATE POLICY "Users can view their own verification requests"
  ON public.verification_requests
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own verification requests" ON public.verification_requests;
CREATE POLICY "Users can create their own verification requests"
  ON public.verification_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- No UPDATE/DELETE policies for authenticated → only service_role can review.

-- 6) Prevent duplicate pending requests per user
CREATE UNIQUE INDEX IF NOT EXISTS verification_requests_one_pending_per_user
  ON public.verification_requests (user_id)
  WHERE status = 'pending';

-- 7) updated_at trigger
DROP TRIGGER IF EXISTS update_verification_requests_updated_at ON public.verification_requests;
CREATE TRIGGER update_verification_requests_updated_at
  BEFORE UPDATE ON public.verification_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
