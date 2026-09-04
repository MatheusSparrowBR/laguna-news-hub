-- HORA NEWS LAGUNA — Pautas da Comunidade
-- Sem backfill, sem alteração de news/RSS/cron/Instagram OAuth.

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

CREATE INDEX IF NOT EXISTS community_submissions_project_status_idx ON public.community_submissions(project_id, status);
CREATE INDEX IF NOT EXISTS community_submissions_project_created_idx ON public.community_submissions(project_id, created_at DESC);

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

CREATE INDEX IF NOT EXISTS community_media_submission_idx ON public.community_submission_media(submission_id, sort_order);
CREATE INDEX IF NOT EXISTS community_media_project_idx ON public.community_submission_media(project_id);

ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS community_submission_id uuid REFERENCES public.community_submissions(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS posts_community_submission_idx ON public.posts(community_submission_id);

GRANT SELECT, INSERT, UPDATE ON public.community_submissions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_submission_media TO authenticated;
GRANT ALL ON public.community_submissions TO service_role;
GRANT ALL ON public.community_submission_media TO service_role;

ALTER TABLE public.community_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_submission_media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS community_submissions_project ON public.community_submissions;
CREATE POLICY community_submissions_project ON public.community_submissions
  FOR ALL TO authenticated
  USING (public.owns_project(project_id))
  WITH CHECK (public.owns_project(project_id));

DROP POLICY IF EXISTS community_media_project ON public.community_submission_media;
CREATE POLICY community_media_project ON public.community_submission_media
  FOR ALL TO authenticated
  USING (public.owns_project(project_id))
  WITH CHECK (public.owns_project(project_id));

DROP POLICY IF EXISTS posts_community_submission_project ON public.posts;
CREATE POLICY posts_community_submission_project ON public.posts
  FOR ALL TO authenticated
  USING (public.owns_project(project_id))
  WITH CHECK (public.owns_project(project_id));

DROP TRIGGER IF EXISTS community_submissions_updated_at ON public.community_submissions;
CREATE TRIGGER community_submissions_updated_at
  BEFORE UPDATE ON public.community_submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Transições editoriais críticas. Não permite saltos arbitrários.
CREATE OR REPLACE FUNCTION public.validate_community_submission_transition()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    IF NOT (
      (OLD.status = 'received' AND NEW.status IN ('triage','rejected','not_confirmed')) OR
      (OLD.status = 'triage' AND NEW.status IN ('verifying','rejected','not_confirmed')) OR
      (OLD.status = 'verifying' AND NEW.status IN ('verified','rejected','not_confirmed')) OR
      (OLD.status = 'verified' AND NEW.status IN ('approved','rejected','not_confirmed')) OR
      (OLD.status = 'approved' AND NEW.status = 'converted_to_post') OR
      (OLD.status = NEW.status)
    ) THEN
      RAISE EXCEPTION 'Transição editorial inválida: % -> %', OLD.status, NEW.status;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS community_submission_transition ON public.community_submissions;
CREATE TRIGGER community_submission_transition
  BEFORE UPDATE ON public.community_submissions
  FOR EACH ROW EXECUTE FUNCTION public.validate_community_submission_transition();

-- Auditoria de status sem armazenar segredos/dados de autenticação.
CREATE OR REPLACE FUNCTION public.audit_community_submission_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_action text;
  v_details jsonb;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action := 'received';
    v_details := jsonb_build_object('new_status', NEW.status);
  ELSIF OLD.status IS DISTINCT FROM NEW.status THEN
    v_action := NEW.status;
    v_details := jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status);
  ELSE
    RETURN NEW;
  END IF;

  INSERT INTO public.audit_logs (project_id, actor_id, action, entity_type, entity_id, details)
  VALUES (
    NEW.project_id,
    auth.uid(),
    v_action,
    'community_submission',
    NEW.id,
    v_details
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS community_submission_audit ON public.community_submissions;
CREATE TRIGGER community_submission_audit
  AFTER INSERT OR UPDATE ON public.community_submissions
  FOR EACH ROW EXECUTE FUNCTION public.audit_community_submission_change();

-- Bucket privado para mídia bruta de comunidade. A mídia não fica pública.
INSERT INTO storage.buckets (id, name, public)
VALUES ('community-submissions', 'community-submissions', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS community_storage_select ON storage.objects;
CREATE POLICY community_storage_select ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'community-submissions'
    AND public.owns_project(((storage.foldername(name))[1])::uuid)
  );

DROP POLICY IF EXISTS community_storage_insert ON storage.objects;
CREATE POLICY community_storage_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'community-submissions'
    AND public.owns_project(((storage.foldername(name))[1])::uuid)
    AND (storage.foldername(name))[2] = 'community'
  );

DROP POLICY IF EXISTS community_storage_update ON storage.objects;
CREATE POLICY community_storage_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'community-submissions'
    AND public.owns_project(((storage.foldername(name))[1])::uuid)
  )
  WITH CHECK (
    bucket_id = 'community-submissions'
    AND public.owns_project(((storage.foldername(name))[1])::uuid)
  );

DROP POLICY IF EXISTS community_storage_delete ON storage.objects;
CREATE POLICY community_storage_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'community-submissions'
    AND public.owns_project(((storage.foldername(name))[1])::uuid)
  );

REVOKE ALL ON public.community_submissions FROM anon;
REVOKE ALL ON public.community_submission_media FROM anon;
