CREATE TABLE public.neighbourhood_directory (
  neighbourhood_key text PRIMARY KEY,
  display_name text NOT NULL,
  city text,
  country text,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.neighbourhood_directory TO authenticated;
GRANT ALL ON public.neighbourhood_directory TO service_role;

ALTER TABLE public.neighbourhood_directory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view neighbourhood directory" ON public.neighbourhood_directory
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins insert neighbourhood directory" ON public.neighbourhood_directory
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update neighbourhood directory" ON public.neighbourhood_directory
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins delete neighbourhood directory" ON public.neighbourhood_directory
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER neighbourhood_directory_updated_at BEFORE UPDATE ON public.neighbourhood_directory
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Backfill from neighbourhoods members already use.
INSERT INTO public.neighbourhood_directory (neighbourhood_key, display_name)
SELECT p.neighbourhood_key, initcap(min(btrim(p.neighbourhood)))
FROM public.profiles p
WHERE p.neighbourhood_key IS NOT NULL AND p.neighbourhood_key <> ''
GROUP BY p.neighbourhood_key
ON CONFLICT DO NOTHING;

UPDATE public.neighbourhood_directory SET city = 'Delft', country = 'Netherlands', is_active = true WHERE neighbourhood_key = 'antonia veerstraat';
UPDATE public.neighbourhood_directory SET city = 'Den Haag', country = 'Netherlands', is_active = true WHERE neighbourhood_key = 'den haag';
UPDATE public.neighbourhood_directory SET city = 'Leiden', country = 'Netherlands', is_active = true WHERE neighbourhood_key = 'lammenschans';

-- New neighbourhoods appear in the admin list automatically (inactive until an admin completes them).
CREATE OR REPLACE FUNCTION public.register_neighbourhood_in_directory()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.neighbourhood_key IS NOT NULL AND NEW.neighbourhood_key <> '' THEN
    INSERT INTO public.neighbourhood_directory (neighbourhood_key, display_name)
    VALUES (NEW.neighbourhood_key, initcap(btrim(coalesce(NEW.neighbourhood, NEW.neighbourhood_key))))
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
EXCEPTION WHEN others THEN
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_register_neighbourhood AFTER INSERT OR UPDATE OF neighbourhood_key ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.register_neighbourhood_in_directory();

-- Public directory: names and location only, no counts or member data.
CREATE OR REPLACE FUNCTION public.get_active_neighbourhoods()
RETURNS TABLE(country text, city text, name text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT d.country, d.city, d.display_name
  FROM public.neighbourhood_directory d
  WHERE d.is_active
    AND d.country IS NOT NULL AND btrim(d.country) <> ''
    AND d.city IS NOT NULL AND btrim(d.city) <> ''
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.neighbourhood_key = d.neighbourhood_key AND p.onboarding_completed
    )
  ORDER BY d.country, d.city, d.display_name;
$$;

REVOKE ALL ON FUNCTION public.get_active_neighbourhoods() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_active_neighbourhoods() TO anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.register_neighbourhood_in_directory() FROM PUBLIC, anon, authenticated;