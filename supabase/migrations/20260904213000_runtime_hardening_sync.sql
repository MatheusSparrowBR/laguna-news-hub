-- HORA NEWS LAGUNA — runtime hardening sync
-- Reproducible, idempotent and additive. No domain data is deleted.

-- =========================================================
-- Audit log required by server audit helpers and community triggers
-- =========================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_logs_project_id_idx ON public.audit_logs(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_actor_id_idx ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS audit_logs_entity_idx ON public.audit_logs(entity_type, entity_id);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
DROP POLICY IF EXISTS audit_logs_read ON public.audit_logs;
CREATE POLICY audit_logs_read ON public.audit_logs FOR SELECT TO authenticated
  USING (public.owns_project(project_id));
REVOKE INSERT, UPDATE, DELETE ON public.audit_logs FROM anon, authenticated;

-- =========================================================
-- Post idempotency: the application uses ON CONFLICT(idempotency_key)
-- =========================================================
CREATE UNIQUE INDEX IF NOT EXISTS posts_idempotency_key_uidx
  ON public.posts(idempotency_key);

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
REVOKE ALL ON FUNCTION public.normalize_post_idempotency_key() FROM PUBLIC, anon, authenticated;

-- =========================================================
-- Notifications: system-owned; client can only mark read_at
-- =========================================================
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
REVOKE INSERT, DELETE ON public.notifications FROM authenticated;
DROP POLICY IF EXISTS notifications_project_update ON public.notifications;
CREATE POLICY notifications_project_update ON public.notifications
  FOR UPDATE TO authenticated
  USING (public.owns_project(project_id))
  WITH CHECK (public.owns_project(project_id));
CREATE OR REPLACE FUNCTION public.prevent_notification_tamper()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE v_role text := coalesce(current_setting('request.jwt.claims', true)::jsonb ->> 'role', '');
BEGIN
  IF v_role <> 'service_role' THEN
    IF OLD.project_id IS DISTINCT FROM NEW.project_id
       OR OLD.kind IS DISTINCT FROM NEW.kind
       OR OLD.title IS DISTINCT FROM NEW.title
       OR OLD.message IS DISTINCT FROM NEW.message
       OR OLD.news_id IS DISTINCT FROM NEW.news_id
       OR OLD.post_id IS DISTINCT FROM NEW.post_id
       OR OLD.campaign_id IS DISTINCT FROM NEW.campaign_id
       OR OLD.created_at IS DISTINCT FROM NEW.created_at
    THEN
      RAISE EXCEPTION 'Somente read_at pode ser alterado pelo cliente';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS prevent_notification_tamper ON public.notifications;
CREATE TRIGGER prevent_notification_tamper BEFORE UPDATE ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.prevent_notification_tamper();
REVOKE ALL ON FUNCTION public.prevent_notification_tamper() FROM PUBLIC, anon, authenticated;

-- =========================================================
-- Operational tables are backend-owned
-- =========================================================
REVOKE INSERT, UPDATE, DELETE ON public.analytics FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.social_accounts FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.publication_logs FROM authenticated;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.social_account_credentials FROM authenticated, anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.oauth_states FROM authenticated, anon;
GRANT SELECT ON public.analytics TO authenticated;
GRANT SELECT ON public.social_accounts TO authenticated;
GRANT SELECT ON public.publication_logs TO authenticated;
GRANT ALL ON public.social_account_credentials TO service_role;
GRANT ALL ON public.oauth_states TO service_role;

-- =========================================================
-- Foreign-key indexes used by the live schema
-- =========================================================
CREATE INDEX IF NOT EXISTS community_submissions_reviewed_by_idx ON public.community_submissions(reviewed_by);
CREATE INDEX IF NOT EXISTS notifications_campaign_id_idx ON public.notifications(campaign_id);
CREATE INDEX IF NOT EXISTS notifications_news_id_idx ON public.notifications(news_id);
CREATE INDEX IF NOT EXISTS notifications_post_id_idx ON public.notifications(post_id);
CREATE INDEX IF NOT EXISTS oauth_states_project_id_idx ON public.oauth_states(project_id);
CREATE INDEX IF NOT EXISTS posts_sponsor_id_idx ON public.posts(sponsor_id);
CREATE INDEX IF NOT EXISTS sponsor_deliverables_post_id_idx ON public.sponsor_deliverables(post_id);

-- =========================================================
-- Safe onboarding helper: existing users use their own project only
-- =========================================================
CREATE OR REPLACE FUNCTION public.claim_admin_project(_name text DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _project uuid;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT id INTO _project FROM public.projects
  WHERE owner_id = _uid ORDER BY created_at LIMIT 1;
  IF _project IS NULL THEN RAISE EXCEPTION 'no project assigned to the authenticated user'; END IF;
  RETURN _project;
END;
$$;
REVOKE ALL ON FUNCTION public.claim_admin_project(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_admin_project(text) TO authenticated;

-- =========================================================
-- Private Storage buckets used by the application
-- =========================================================
INSERT INTO storage.buckets(id, name, public)
VALUES ('social-assets', 'social-assets', false)
ON CONFLICT (id) DO UPDATE SET public = false;
INSERT INTO storage.buckets(id, name, public)
VALUES ('community-submissions', 'community-submissions', false)
ON CONFLICT (id) DO UPDATE SET public = false;
