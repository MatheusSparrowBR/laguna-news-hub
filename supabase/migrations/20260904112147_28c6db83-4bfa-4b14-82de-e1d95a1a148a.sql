-- =========================================================
-- Notícias Laguna — fundação editorial / monetização (ADITIVO)
-- Nenhum DROP, TRUNCATE, DELETE ou UPDATE de dados existentes.
-- =========================================================

-- ---------- novos valores de enum (aditivos) ----------
ALTER TYPE public.post_status ADD VALUE IF NOT EXISTS 'awaiting_approval';
ALTER TYPE public.post_status ADD VALUE IF NOT EXISTS 'approved';
ALTER TYPE public.post_status ADD VALUE IF NOT EXISTS 'queued';

ALTER TYPE public.news_status ADD VALUE IF NOT EXISTS 'rejected';
ALTER TYPE public.news_status ADD VALUE IF NOT EXISTS 'scheduled';
ALTER TYPE public.news_status ADD VALUE IF NOT EXISTS 'archived';

-- =========================================================
-- FASE 2 — persistência da decisão geográfica
-- =========================================================
CREATE TABLE IF NOT EXISTS public.news_geography (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  news_id uuid NOT NULL UNIQUE REFERENCES public.news(id) ON DELETE CASCADE,
  decision text NOT NULL CHECK (decision IN ('local','outside','uncertain')),
  score numeric NOT NULL DEFAULT 0,
  matched_localities text[] NOT NULL DEFAULT '{}',
  matched_entities text[] NOT NULL DEFAULT '{}',
  excluded_localities text[] NOT NULL DEFAULT '{}',
  reason text,
  source_mode text NOT NULL DEFAULT 'shadow' CHECK (source_mode IN ('shadow','review','block_outside')),
  review_status text NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending','reviewed','skipped')),
  manual_decision text CHECK (manual_decision IN ('local','outside','uncertain')),
  review_notes text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.news_geography TO authenticated;
GRANT ALL ON public.news_geography TO service_role;
ALTER TABLE public.news_geography ENABLE ROW LEVEL SECURITY;

CREATE POLICY news_geography_project ON public.news_geography
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.news n WHERE n.id = news_geography.news_id AND public.owns_project(n.project_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.news n WHERE n.id = news_geography.news_id AND public.owns_project(n.project_id)));

CREATE INDEX IF NOT EXISTS news_geography_decision_idx ON public.news_geography (decision);
CREATE INDEX IF NOT EXISTS news_geography_review_status_idx ON public.news_geography (review_status);

CREATE TRIGGER news_geography_updated_at BEFORE UPDATE ON public.news_geography
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- FASE 19 — patrocinadores
-- =========================================================
CREATE TABLE IF NOT EXISTS public.sponsors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  display_name text,
  contact_name text,
  email text,
  phone text,
  instagram_handle text,
  website text,
  logo_url text,
  notes text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sponsors TO authenticated;
GRANT ALL ON public.sponsors TO service_role;
ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;

CREATE POLICY sponsors_project ON public.sponsors
  FOR ALL TO authenticated
  USING (public.owns_project(project_id))
  WITH CHECK (public.owns_project(project_id));

CREATE INDEX IF NOT EXISTS sponsors_project_id_idx ON public.sponsors (project_id);

CREATE TRIGGER sponsors_updated_at BEFORE UPDATE ON public.sponsors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- FASE 20 — campanhas
-- =========================================================
CREATE TABLE IF NOT EXISTS public.sponsor_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  sponsor_id uuid NOT NULL REFERENCES public.sponsors(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  start_date date,
  end_date date,
  budget numeric,
  contracted_posts integer NOT NULL DEFAULT 0,
  delivered_posts integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','paused','completed','cancelled')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sponsor_campaigns TO authenticated;
GRANT ALL ON public.sponsor_campaigns TO service_role;
ALTER TABLE public.sponsor_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY sponsor_campaigns_project ON public.sponsor_campaigns
  FOR ALL TO authenticated
  USING (public.owns_project(project_id))
  WITH CHECK (public.owns_project(project_id));

CREATE INDEX IF NOT EXISTS sponsor_campaigns_project_id_idx ON public.sponsor_campaigns (project_id);
CREATE INDEX IF NOT EXISTS sponsor_campaigns_sponsor_id_idx ON public.sponsor_campaigns (sponsor_id);
CREATE INDEX IF NOT EXISTS sponsor_campaigns_status_idx ON public.sponsor_campaigns (status);

CREATE TRIGGER sponsor_campaigns_updated_at BEFORE UPDATE ON public.sponsor_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- FASE 21 — entregáveis
-- =========================================================
CREATE TABLE IF NOT EXISTS public.sponsor_deliverables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.sponsor_campaigns(id) ON DELETE CASCADE,
  post_id uuid REFERENCES public.posts(id) ON DELETE SET NULL,
  scheduled_at timestamptz,
  published_at timestamptz,
  status text NOT NULL DEFAULT 'contracted' CHECK (status IN ('contracted','scheduled','published','cancelled')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sponsor_deliverables TO authenticated;
GRANT ALL ON public.sponsor_deliverables TO service_role;
ALTER TABLE public.sponsor_deliverables ENABLE ROW LEVEL SECURITY;

CREATE POLICY sponsor_deliverables_project ON public.sponsor_deliverables
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.sponsor_campaigns c WHERE c.id = sponsor_deliverables.campaign_id AND public.owns_project(c.project_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.sponsor_campaigns c WHERE c.id = sponsor_deliverables.campaign_id AND public.owns_project(c.project_id)));

CREATE INDEX IF NOT EXISTS sponsor_deliverables_campaign_id_idx ON public.sponsor_deliverables (campaign_id);
CREATE INDEX IF NOT EXISTS sponsor_deliverables_status_idx ON public.sponsor_deliverables (status);

CREATE TRIGGER sponsor_deliverables_updated_at BEFORE UPDATE ON public.sponsor_deliverables
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- FASE 17 — asset registry
-- =========================================================
CREATE TABLE IF NOT EXISTS public.post_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  asset_type text NOT NULL DEFAULT 'feed' CHECK (asset_type IN ('feed','square','story','sponsor_logo','other')),
  storage_path text NOT NULL,
  public_url text,
  mime_type text,
  width integer,
  height integer,
  file_size integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.post_assets TO authenticated;
GRANT ALL ON public.post_assets TO service_role;
ALTER TABLE public.post_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY post_assets_project ON public.post_assets
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_assets.post_id AND public.owns_project(p.project_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_assets.post_id AND public.owns_project(p.project_id)));

CREATE INDEX IF NOT EXISTS post_assets_post_id_idx ON public.post_assets (post_id);

-- =========================================================
-- FASE 32 — contas sociais (sem tokens)
-- =========================================================
CREATE TABLE IF NOT EXISTS public.social_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'instagram' CHECK (provider IN ('instagram')),
  account_id text,
  username text,
  display_name text,
  status text NOT NULL DEFAULT 'disconnected' CHECK (status IN ('disconnected','connecting','connected','expired','error')),
  scopes text[] NOT NULL DEFAULT '{}',
  connected_at timestamptz,
  last_verified_at timestamptz,
  token_expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, provider)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.social_accounts TO authenticated;
GRANT ALL ON public.social_accounts TO service_role;
ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY social_accounts_project ON public.social_accounts
  FOR ALL TO authenticated
  USING (public.owns_project(project_id))
  WITH CHECK (public.owns_project(project_id));

CREATE TRIGGER social_accounts_updated_at BEFORE UPDATE ON public.social_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- FASE 37 — log de publicação
-- =========================================================
CREATE TABLE IF NOT EXISTS public.publication_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'instagram',
  external_id text,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','publishing','published','failed','cancelled')),
  attempt integer NOT NULL DEFAULT 1,
  attempted_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  error_code text,
  error_message text,
  response_metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.publication_logs TO authenticated;
GRANT ALL ON public.publication_logs TO service_role;
ALTER TABLE public.publication_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY publication_logs_project ON public.publication_logs
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.posts p WHERE p.id = publication_logs.post_id AND public.owns_project(p.project_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.posts p WHERE p.id = publication_logs.post_id AND public.owns_project(p.project_id)));

CREATE INDEX IF NOT EXISTS publication_logs_post_id_idx ON public.publication_logs (post_id);
CREATE INDEX IF NOT EXISTS publication_logs_status_idx ON public.publication_logs (status);

-- =========================================================
-- FASE 43 — notificações internas
-- =========================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  kind text NOT NULL,
  title text NOT NULL,
  message text,
  news_id uuid REFERENCES public.news(id) ON DELETE SET NULL,
  post_id uuid REFERENCES public.posts(id) ON DELETE SET NULL,
  campaign_id uuid REFERENCES public.sponsor_campaigns(id) ON DELETE SET NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY notifications_project ON public.notifications
  FOR ALL TO authenticated
  USING (public.owns_project(project_id))
  WITH CHECK (public.owns_project(project_id));

CREATE INDEX IF NOT EXISTS notifications_project_id_idx ON public.notifications (project_id, created_at DESC);

-- =========================================================
-- FASE 44 — auditoria (somente leitura para o dono)
-- =========================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  actor_id uuid,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY audit_logs_read ON public.audit_logs
  FOR SELECT TO authenticated
  USING (public.owns_project(project_id));

CREATE INDEX IF NOT EXISTS audit_logs_project_id_idx ON public.audit_logs (project_id, created_at DESC);

-- =========================================================
-- FASE 8/23/25/56 — colunas aditivas em posts
-- =========================================================
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS campaign_id uuid REFERENCES public.sponsor_campaigns(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS sponsor_id uuid REFERENCES public.sponsors(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_sponsored boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS hashtags text,
  ADD COLUMN IF NOT EXISTS template_key text,
  ADD COLUMN IF NOT EXISTS channel text NOT NULL DEFAULT 'instagram',
  ADD COLUMN IF NOT EXISTS idempotency_key text;

CREATE UNIQUE INDEX IF NOT EXISTS posts_idempotency_key_uidx
  ON public.posts (project_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS posts_project_status_idx ON public.posts (project_id, status);
CREATE INDEX IF NOT EXISTS posts_campaign_id_idx ON public.posts (campaign_id);