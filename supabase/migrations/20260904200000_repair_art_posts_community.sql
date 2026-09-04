-- HORA NEWS LAGUNA — reparo de runtime para Posts/Artes/Pautas da Comunidade
-- Aditivo e idempotente. Não apaga dados de domínio.

-- =========================================================
-- 1) Garantias de schema usadas pelo Post Composer
-- =========================================================

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS idempotency_key text,
  ADD COLUMN IF NOT EXISTS community_submission_id uuid,
  ADD COLUMN IF NOT EXISTS template_key text,
  ADD COLUMN IF NOT EXISTS channel text NOT NULL DEFAULT 'instagram',
  ADD COLUMN IF NOT EXISTS published_at timestamptz,
  ADD COLUMN IF NOT EXISTS photo_credit text;

-- =========================================================
-- 2) Tabelas de comunidade: garante que o runtime esteja alinhado
-- =========================================================

CREATE TABLE IF NOT EXISTS public.community_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'Outro',
  location text,
  neighborhood text,
  occurred_at timestamptz,
  source_type text NOT NULL DEFAULT 'Outro',
  submitter_name text,
  submitter_phone text,
  submitter_email text,
  consent_media text NOT NULL DEFAULT 'not_informed' CHECK (consent_media IN ('authorized','not_authorized','not_informed')),
  publication_permission text NOT NULL DEFAULT 'pending' CHECK (publication_permission IN ('yes','no','pending')),
  status text NOT NULL DEFAULT 'received' CHECK (status IN ('received','triage','verifying','verified','approved','not_confirmed','rejected','converted_to_post')),
  editorial_notes text,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS community_submissions_project_status_idx
  ON public.community_submissions(project_id, status);
CREATE INDEX IF NOT EXISTS community_submissions_project_created_idx
  ON public.community_submissions(project_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.community_submission_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES public.community_submissions(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  media_type text NOT NULL CHECK (media_type IN ('image','video')),
  storage_path text NOT NULL UNIQUE,
  original_filename text NOT NULL,
  mime_type text NOT NULL,
  file_size bigint NOT NULL CHECK (file_size > 0),
  width integer,
  height integer,
  duration numeric,
  caption text,
  is_primary boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS community_media_submission_idx
  ON public.community_submission_media(submission_id, sort_order);
CREATE INDEX IF NOT EXISTS community_media_project_idx
  ON public.community_submission_media(project_id);

ALTER TABLE public.posts
  DROP CONSTRAINT IF EXISTS posts_community_submission_id_fkey;
ALTER TABLE public.posts
  ADD CONSTRAINT posts_community_submission_id_fkey
  FOREIGN KEY (community_submission_id)
  REFERENCES public.community_submissions(id)
  ON DELETE SET NULL;

GRANT SELECT, INSERT, UPDATE ON public.community_submissions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_submission_media TO authenticated;
GRANT ALL ON public.community_submissions TO service_role;
GRANT ALL ON public.community_submission_media TO service_role;

ALTER TABLE public.community_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_submission_media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS community_submissions_project ON public.community_submissions;
CREATE POLICY community_submissions_project
  ON public.community_submissions FOR ALL TO authenticated
  USING (public.owns_project(project_id))
  WITH CHECK (public.owns_project(project_id));

DROP POLICY IF EXISTS community_media_project ON public.community_submission_media;
CREATE POLICY community_media_project
  ON public.community_submission_media FOR ALL TO authenticated
  USING (public.owns_project(project_id))
  WITH CHECK (public.owns_project(project_id));

REVOKE ALL ON public.community_submissions FROM anon;
REVOKE ALL ON public.community_submission_media FROM anon;

-- =========================================================
-- 3) Idempotência dos posts
-- =========================================================

-- ON CONFLICT (idempotency_key) precisa de uma restrição/índice único
-- inferível sem predicado adicional. Em PostgreSQL, um índice parcial
-- exigiria um WHERE correspondente no ON CONFLICT; o código do Composer
-- usa somente a coluna, portanto o índice deve ser não-parcial.
DROP INDEX IF EXISTS public.posts_idempotency_key_uidx;
CREATE UNIQUE INDEX IF NOT EXISTS posts_idempotency_key_uidx
  ON public.posts (idempotency_key);

CREATE OR REPLACE FUNCTION public.normalize_post_idempotency_key()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.community_submission_id IS NOT NULL THEN
    NEW.idempotency_key := NEW.project_id::text || ':community:' || NEW.community_submission_id::text || ':' || NEW.post_type::text;
  ELSIF NEW.news_id IS NOT NULL THEN
    NEW.idempotency_key := NEW.project_id::text || ':news:' || NEW.news_id::text || ':' || NEW.post_type::text;
  ELSIF NEW.campaign_id IS NOT NULL THEN
    NEW.idempotency_key := NEW.project_id::text || ':campaign:' || NEW.campaign_id::text || ':' || NEW.post_type::text;
  ELSIF NEW.idempotency_key IS NULL
     OR NEW.idempotency_key = NEW.project_id::text || ':manual:' || NEW.post_type::text THEN
    NEW.idempotency_key := NEW.project_id::text || ':manual:' || NEW.id::text || ':' || NEW.post_type::text;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS normalize_post_idempotency_key ON public.posts;
CREATE TRIGGER normalize_post_idempotency_key
BEFORE INSERT OR UPDATE OF project_id, news_id, campaign_id, community_submission_id, post_type, idempotency_key
ON public.posts
FOR EACH ROW EXECUTE FUNCTION public.normalize_post_idempotency_key();

REVOKE ALL ON FUNCTION public.normalize_post_idempotency_key() FROM anon, authenticated, public;

-- =========================================================
-- 4) Storage oficial de artes/fotos dos posts
-- =========================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('social-assets', 'social-assets', false)
ON CONFLICT (id) DO UPDATE SET public = false;

DROP POLICY IF EXISTS social_assets_select_own_project ON storage.objects;
CREATE POLICY social_assets_select_own_project
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'social-assets'
    AND public.owns_project(NULLIF((storage.foldername(name))[1], '')::uuid)
  );

DROP POLICY IF EXISTS social_assets_insert_own_project ON storage.objects;
CREATE POLICY social_assets_insert_own_project
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'social-assets'
    AND public.owns_project(NULLIF((storage.foldername(name))[1], '')::uuid)
  );

DROP POLICY IF EXISTS social_assets_update_own_project ON storage.objects;
CREATE POLICY social_assets_update_own_project
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'social-assets'
    AND public.owns_project(NULLIF((storage.foldername(name))[1], '')::uuid)
  )
  WITH CHECK (
    bucket_id = 'social-assets'
    AND public.owns_project(NULLIF((storage.foldername(name))[1], '')::uuid)
  );

DROP POLICY IF EXISTS social_assets_delete_own_project ON storage.objects;
CREATE POLICY social_assets_delete_own_project
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'social-assets'
    AND public.owns_project(NULLIF((storage.foldername(name))[1], '')::uuid)
  );

-- =========================================================
-- 5) Storage privado da comunidade
-- =========================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('community-submissions', 'community-submissions', false)
ON CONFLICT (id) DO UPDATE SET public = false;

DROP POLICY IF EXISTS community_storage_select ON storage.objects;
CREATE POLICY community_storage_select
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'community-submissions'
    AND public.owns_project(NULLIF((storage.foldername(name))[1], '')::uuid)
  );

DROP POLICY IF EXISTS community_storage_insert ON storage.objects;
CREATE POLICY community_storage_insert
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'community-submissions'
    AND public.owns_project(NULLIF((storage.foldername(name))[1], '')::uuid)
    AND (storage.foldername(name))[2] = 'community'
  );

DROP POLICY IF EXISTS community_storage_update ON storage.objects;
CREATE POLICY community_storage_update
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'community-submissions'
    AND public.owns_project(NULLIF((storage.foldername(name))[1], '')::uuid)
  )
  WITH CHECK (
    bucket_id = 'community-submissions'
    AND public.owns_project(NULLIF((storage.foldername(name))[1], '')::uuid)
  );

DROP POLICY IF EXISTS community_storage_delete ON storage.objects;
CREATE POLICY community_storage_delete
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'community-submissions'
    AND public.owns_project(NULLIF((storage.foldername(name))[1], '')::uuid)
  );

-- =========================================================
-- 6) Exposição pública
-- =========================================================

REVOKE ALL ON public.post_assets FROM anon;
REVOKE ALL ON public.publication_logs FROM anon;
