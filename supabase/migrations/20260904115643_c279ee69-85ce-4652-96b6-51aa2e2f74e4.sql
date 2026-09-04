-- =========================================================
-- Consolidação: integridade, auditoria e saúde de fontes (ADITIVO)
-- Nenhum DROP TABLE, TRUNCATE, DELETE ou UPDATE de dados de domínio.
-- =========================================================

-- ---------- 1. audit_logs: INSERT controlado, sem UPDATE/DELETE ----------
DROP POLICY IF EXISTS "audit_logs_insert_own_project" ON public.audit_logs;
CREATE POLICY "audit_logs_insert_own_project"
  ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK (public.owns_project(project_id) AND (actor_id IS NULL OR actor_id = auth.uid()));

REVOKE UPDATE, DELETE ON public.audit_logs FROM authenticated;
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;

-- ---------- 2. delivered_posts derivado das entregas concluídas ----------
CREATE OR REPLACE FUNCTION public.recalcular_delivered_posts(_campaign_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.sponsor_campaigns c
     SET delivered_posts = (
           SELECT count(*) FROM public.sponsor_deliverables d
            WHERE d.campaign_id = c.id AND d.status = 'published'
         )
   WHERE c.id = _campaign_id;
END; $$;

CREATE OR REPLACE FUNCTION public.trg_sponsor_deliverables_sync()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP <> 'INSERT' AND OLD.campaign_id IS DISTINCT FROM NEW.campaign_id THEN
    PERFORM public.recalcular_delivered_posts(OLD.campaign_id);
  END IF;
  IF TG_OP = 'DELETE' THEN
    PERFORM public.recalcular_delivered_posts(OLD.campaign_id);
    RETURN OLD;
  END IF;
  PERFORM public.recalcular_delivered_posts(NEW.campaign_id);
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS sponsor_deliverables_sync ON public.sponsor_deliverables;
CREATE TRIGGER sponsor_deliverables_sync
AFTER INSERT OR UPDATE OF status, campaign_id OR DELETE ON public.sponsor_deliverables
FOR EACH ROW EXECUTE FUNCTION public.trg_sponsor_deliverables_sync();

-- ---------- 3. integridade entre projetos ----------
CREATE OR REPLACE FUNCTION public.trg_campaign_same_project()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _sponsor_project uuid;
BEGIN
  SELECT project_id INTO _sponsor_project FROM public.sponsors WHERE id = NEW.sponsor_id;
  IF _sponsor_project IS DISTINCT FROM NEW.project_id THEN
    RAISE EXCEPTION 'campanha e patrocinador precisam pertencer ao mesmo projeto';
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS campaign_same_project ON public.sponsor_campaigns;
CREATE TRIGGER campaign_same_project
BEFORE INSERT OR UPDATE OF sponsor_id, project_id ON public.sponsor_campaigns
FOR EACH ROW EXECUTE FUNCTION public.trg_campaign_same_project();

CREATE OR REPLACE FUNCTION public.trg_post_same_project()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _p uuid;
BEGIN
  IF NEW.sponsor_id IS NOT NULL THEN
    SELECT project_id INTO _p FROM public.sponsors WHERE id = NEW.sponsor_id;
    IF _p IS DISTINCT FROM NEW.project_id THEN
      RAISE EXCEPTION 'post e patrocinador precisam pertencer ao mesmo projeto';
    END IF;
  END IF;
  IF NEW.campaign_id IS NOT NULL THEN
    SELECT project_id INTO _p FROM public.sponsor_campaigns WHERE id = NEW.campaign_id;
    IF _p IS DISTINCT FROM NEW.project_id THEN
      RAISE EXCEPTION 'post e campanha precisam pertencer ao mesmo projeto';
    END IF;
  END IF;
  IF NEW.news_id IS NOT NULL THEN
    SELECT project_id INTO _p FROM public.news WHERE id = NEW.news_id;
    IF _p IS DISTINCT FROM NEW.project_id THEN
      RAISE EXCEPTION 'post e notícia precisam pertencer ao mesmo projeto';
    END IF;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS post_same_project ON public.posts;
CREATE TRIGGER post_same_project
BEFORE INSERT OR UPDATE OF sponsor_id, campaign_id, news_id, project_id ON public.posts
FOR EACH ROW EXECUTE FUNCTION public.trg_post_same_project();

CREATE OR REPLACE FUNCTION public.trg_deliverable_same_project()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _campanha uuid; _post uuid;
BEGIN
  IF NEW.post_id IS NULL THEN RETURN NEW; END IF;
  SELECT project_id INTO _campanha FROM public.sponsor_campaigns WHERE id = NEW.campaign_id;
  SELECT project_id INTO _post FROM public.posts WHERE id = NEW.post_id;
  IF _campanha IS DISTINCT FROM _post THEN
    RAISE EXCEPTION 'entrega e post precisam pertencer ao mesmo projeto da campanha';
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS deliverable_same_project ON public.sponsor_deliverables;
CREATE TRIGGER deliverable_same_project
BEFORE INSERT OR UPDATE OF post_id, campaign_id ON public.sponsor_deliverables
FOR EACH ROW EXECUTE FUNCTION public.trg_deliverable_same_project();

-- ---------- 4. saúde das fontes ----------
ALTER TABLE public.sources ADD COLUMN IF NOT EXISTS last_http_status integer;
ALTER TABLE public.sources ADD COLUMN IF NOT EXISTS last_error text;
ALTER TABLE public.sources ADD COLUMN IF NOT EXISTS last_news_found_at timestamptz;
ALTER TABLE public.sources ADD COLUMN IF NOT EXISTS consecutive_failures integer NOT NULL DEFAULT 0;

-- ---------- 5. idempotência de publicação concluída ----------
CREATE UNIQUE INDEX IF NOT EXISTS publication_logs_published_unico
  ON public.publication_logs (post_id, provider) WHERE status = 'published';

-- ---------- 6. remover acesso anônimo desnecessário ----------
REVOKE ALL ON public.news_geography FROM anon;
REVOKE ALL ON public.sponsors FROM anon;
REVOKE ALL ON public.sponsor_campaigns FROM anon;
REVOKE ALL ON public.sponsor_deliverables FROM anon;
REVOKE ALL ON public.post_assets FROM anon;
REVOKE ALL ON public.social_accounts FROM anon;
REVOKE ALL ON public.publication_logs FROM anon;
REVOKE ALL ON public.notifications FROM anon;
REVOKE ALL ON public.audit_logs FROM anon;