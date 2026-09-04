-- HORA NEWS LAGUNA — integridade transacional das pautas da comunidade
-- Complementa as políticas RLS com invariantes que não podem depender do cliente.

-- =========================================================
-- 1) Mídia sempre pertence à mesma pauta/projeto
-- =========================================================

CREATE OR REPLACE FUNCTION public.validate_community_media_integrity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_project_id uuid;
BEGIN
  SELECT project_id
    INTO v_project_id
  FROM public.community_submissions
  WHERE id = NEW.submission_id;

  IF v_project_id IS NULL THEN
    RAISE EXCEPTION 'Pauta da comunidade não encontrada';
  END IF;

  IF NEW.project_id IS DISTINCT FROM v_project_id THEN
    RAISE EXCEPTION 'A mídia não pertence ao mesmo projeto da pauta';
  END IF;

  IF NEW.is_primary THEN
    PERFORM pg_advisory_xact_lock(hashtextextended(NEW.submission_id::text, 0));

    UPDATE public.community_submission_media
    SET is_primary = false
    WHERE submission_id = NEW.submission_id
      AND id IS DISTINCT FROM NEW.id
      AND is_primary = true;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_community_media_integrity
  ON public.community_submission_media;

CREATE TRIGGER validate_community_media_integrity
BEFORE INSERT OR UPDATE OF submission_id, project_id, is_primary
ON public.community_submission_media
FOR EACH ROW
EXECUTE FUNCTION public.validate_community_media_integrity();

REVOKE ALL ON FUNCTION public.validate_community_media_integrity() FROM anon, authenticated, public;

-- =========================================================
-- 2) Post de comunidade só pode usar pauta aprovada e autorizada
--    e cada pauta pode gerar no máximo um post.
-- =========================================================

CREATE OR REPLACE FUNCTION public.validate_community_post_integrity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_project_id uuid;
  v_status text;
  v_permission text;
  v_existing_id uuid;
BEGIN
  IF NEW.community_submission_id IS NULL THEN
    RETURN NEW;
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(NEW.community_submission_id::text, 0));

  SELECT project_id, status, publication_permission
    INTO v_project_id, v_status, v_permission
  FROM public.community_submissions
  WHERE id = NEW.community_submission_id;

  IF v_project_id IS NULL THEN
    RAISE EXCEPTION 'Pauta da comunidade não encontrada';
  END IF;

  IF NEW.project_id IS DISTINCT FROM v_project_id THEN
    RAISE EXCEPTION 'O post e a pauta da comunidade pertencem a projetos diferentes';
  END IF;

  IF v_status <> 'approved' THEN
    RAISE EXCEPTION 'A pauta precisa estar aprovada antes de criar uma publicação';
  END IF;

  IF v_permission <> 'yes' THEN
    RAISE EXCEPTION 'A permissão de publicação da pauta não está autorizada';
  END IF;

  SELECT id
    INTO v_existing_id
  FROM public.posts
  WHERE community_submission_id = NEW.community_submission_id
    AND id IS DISTINCT FROM NEW.id
  LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    RAISE EXCEPTION 'Esta pauta já possui uma publicação vinculada';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_community_post_integrity ON public.posts;

CREATE TRIGGER validate_community_post_integrity
BEFORE INSERT OR UPDATE OF project_id, community_submission_id
ON public.posts
FOR EACH ROW
EXECUTE FUNCTION public.validate_community_post_integrity();

REVOKE ALL ON FUNCTION public.validate_community_post_integrity() FROM anon, authenticated, public;

-- Índices para os checks acima e para a navegação editorial.
CREATE INDEX IF NOT EXISTS community_media_submission_primary_idx
  ON public.community_submission_media(submission_id, is_primary)
  WHERE is_primary = true;

CREATE INDEX IF NOT EXISTS posts_community_submission_lookup_idx
  ON public.posts(community_submission_id)
  WHERE community_submission_id IS NOT NULL;
