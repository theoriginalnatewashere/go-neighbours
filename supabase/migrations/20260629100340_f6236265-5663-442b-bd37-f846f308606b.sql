
ALTER TABLE public.posts
  ADD COLUMN author_name text,
  ADD COLUMN author_avatar_url text,
  ADD COLUMN author_verified boolean NOT NULL DEFAULT false;
