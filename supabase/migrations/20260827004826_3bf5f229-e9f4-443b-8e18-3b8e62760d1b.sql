-- Tipos
CREATE TYPE public.app_role AS ENUM ('admin', 'editor', 'viewer');
CREATE TYPE public.source_type AS ENUM ('rss', 'website', 'api', 'official');
CREATE TYPE public.news_status AS ENUM ('new','analyzing','awaiting_approval','approved','published','ignored','duplicate','review_required');
CREATE TYPE public.moderation_status AS ENUM ('pending','approved','review_required','rejected');
CREATE TYPE public.post_type AS ENUM ('feed','story','reel');
CREATE TYPE public.post_status AS ENUM ('draft','scheduled','publishing','published','failed','cancelled');
CREATE TYPE public.run_type AS ENUM ('source_scan','news_analysis','post_generation','publication','analytics');
CREATE TYPE public.run_status AS ENUM ('running','completed','failed','partial');

-- Função utilitária de updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  role public.app_role NOT NULL DEFAULT 'admin',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_own" ON public.profiles FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- projects
CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  country text NOT NULL DEFAULT 'Brasil',
  profile_name text,
  instagram_username text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT ALL ON public.projects TO service_role;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "projects_own" ON public.projects FOR ALL TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE TRIGGER projects_updated_at BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Função de posse (security definer, evita recursão em RLS)
CREATE OR REPLACE FUNCTION public.owns_project(_project_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.projects p WHERE p.id = _project_id AND p.owner_id = auth.uid());
$$;

-- categories (catálogo global)
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories_read" ON public.categories FOR SELECT TO authenticated USING (true);

-- sources
CREATE TABLE public.sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  url text NOT NULL,
  source_type public.source_type NOT NULL DEFAULT 'website',
  rss_url text,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  active boolean NOT NULL DEFAULT true,
  last_checked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX sources_project_idx ON public.sources(project_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sources TO authenticated;
GRANT ALL ON public.sources TO service_role;
ALTER TABLE public.sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sources_project" ON public.sources FOR ALL TO authenticated
  USING (public.owns_project(project_id)) WITH CHECK (public.owns_project(project_id));
CREATE TRIGGER sources_updated_at BEFORE UPDATE ON public.sources
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- news
CREATE TABLE public.news (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  source_id uuid REFERENCES public.sources(id) ON DELETE SET NULL,
  title text NOT NULL,
  original_content text,
  source_url text,
  image_url text,
  city text,
  state text,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  importance_score numeric(4,1) NOT NULL DEFAULT 0,
  ai_confidence integer NOT NULL DEFAULT 0,
  is_duplicate boolean NOT NULL DEFAULT false,
  duplicate_group_id uuid,
  status public.news_status NOT NULL DEFAULT 'new',
  published_at timestamptz,
  discovered_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX news_project_idx ON public.news(project_id);
CREATE INDEX news_status_idx ON public.news(status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.news TO authenticated;
GRANT ALL ON public.news TO service_role;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
CREATE POLICY "news_project" ON public.news FOR ALL TO authenticated
  USING (public.owns_project(project_id)) WITH CHECK (public.owns_project(project_id));
CREATE TRIGGER news_updated_at BEFORE UPDATE ON public.news
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- news_analysis
CREATE TABLE public.news_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  news_id uuid NOT NULL UNIQUE REFERENCES public.news(id) ON DELETE CASCADE,
  summary text,
  instagram_title text,
  instagram_caption text,
  hashtags text,
  suggested_art_text text,
  moderation_status public.moderation_status NOT NULL DEFAULT 'pending',
  moderation_notes text,
  analyzed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.news_analysis TO authenticated;
GRANT ALL ON public.news_analysis TO service_role;
ALTER TABLE public.news_analysis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "news_analysis_project" ON public.news_analysis FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.news n WHERE n.id = news_id AND public.owns_project(n.project_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.news n WHERE n.id = news_id AND public.owns_project(n.project_id)));
CREATE TRIGGER news_analysis_updated_at BEFORE UPDATE ON public.news_analysis
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- posts
CREATE TABLE public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  news_id uuid REFERENCES public.news(id) ON DELETE SET NULL,
  post_type public.post_type NOT NULL DEFAULT 'feed',
  title text,
  caption text,
  image_url text,
  status public.post_status NOT NULL DEFAULT 'draft',
  scheduled_at timestamptz,
  published_at timestamptz,
  external_post_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX posts_project_idx ON public.posts(project_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.posts TO authenticated;
GRANT ALL ON public.posts TO service_role;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "posts_project" ON public.posts FOR ALL TO authenticated
  USING (public.owns_project(project_id)) WITH CHECK (public.owns_project(project_id));
CREATE TRIGGER posts_updated_at BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- analytics
CREATE TABLE public.analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  reach integer NOT NULL DEFAULT 0,
  impressions integer NOT NULL DEFAULT 0,
  likes integer NOT NULL DEFAULT 0,
  comments integer NOT NULL DEFAULT 0,
  shares integer NOT NULL DEFAULT 0,
  saves integer NOT NULL DEFAULT 0,
  video_views integer NOT NULL DEFAULT 0,
  collected_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX analytics_post_idx ON public.analytics(post_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.analytics TO authenticated;
GRANT ALL ON public.analytics TO service_role;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "analytics_project" ON public.analytics FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND public.owns_project(p.project_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND public.owns_project(p.project_id)));

-- settings
CREATE TABLE public.settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL UNIQUE REFERENCES public.projects(id) ON DELETE CASCADE,
  auto_publish_enabled boolean NOT NULL DEFAULT false,
  approval_required boolean NOT NULL DEFAULT true,
  max_posts_per_day integer NOT NULL DEFAULT 6,
  minimum_confidence integer NOT NULL DEFAULT 70,
  minimum_interval_minutes integer NOT NULL DEFAULT 60,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.settings TO authenticated;
GRANT ALL ON public.settings TO service_role;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings_project" ON public.settings FOR ALL TO authenticated
  USING (public.owns_project(project_id)) WITH CHECK (public.owns_project(project_id));
CREATE TRIGGER settings_updated_at BEFORE UPDATE ON public.settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- automation_runs
CREATE TABLE public.automation_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  run_type public.run_type NOT NULL,
  status public.run_status NOT NULL DEFAULT 'running',
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  error_message text,
  items_processed integer NOT NULL DEFAULT 0,
  retry_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX automation_runs_project_idx ON public.automation_runs(project_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.automation_runs TO authenticated;
GRANT ALL ON public.automation_runs TO service_role;
ALTER TABLE public.automation_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "automation_runs_project" ON public.automation_runs FOR ALL TO authenticated
  USING (public.owns_project(project_id)) WITH CHECK (public.owns_project(project_id));

-- Categorias iniciais
INSERT INTO public.categories (name, slug) VALUES
  ('Urgente','urgente'),('Trânsito','transito'),('Segurança','seguranca'),
  ('Prefeitura','prefeitura'),('Cidade','cidade'),('Eventos','eventos'),
  ('Turismo','turismo'),('Clima','clima'),('Esportes','esportes'),
  ('Economia','economia'),('Educação','educacao'),('Saúde','saude');

-- Projeto inicial (sem dono até o primeiro administrador entrar)
INSERT INTO public.projects (name, city, state, country, profile_name, instagram_username, active)
VALUES ('Projeto Notícias Laguna','Laguna','SC','Brasil','NOME_DO_PERFIL', NULL, true);

INSERT INTO public.settings (project_id)
SELECT id FROM public.projects WHERE name = 'Projeto Notícias Laguna';

-- Onboarding do administrador: cria o perfil e assume o projeto inicial sem dono
CREATE OR REPLACE FUNCTION public.claim_admin_project(_name text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _project uuid;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;

  INSERT INTO public.profiles (user_id, name, role)
  VALUES (_uid, _name, 'admin')
  ON CONFLICT (user_id) DO UPDATE SET name = COALESCE(public.profiles.name, EXCLUDED.name);

  SELECT id INTO _project FROM public.projects WHERE owner_id = _uid ORDER BY created_at LIMIT 1;
  IF _project IS NULL THEN
    UPDATE public.projects SET owner_id = _uid
    WHERE id = (SELECT id FROM public.projects WHERE owner_id IS NULL ORDER BY created_at LIMIT 1)
    RETURNING id INTO _project;
  END IF;

  IF _project IS NULL THEN
    INSERT INTO public.projects (owner_id, name, city, state, country, profile_name, active)
    VALUES (_uid, 'Projeto Notícias Laguna','Laguna','SC','Brasil','NOME_DO_PERFIL', true)
    RETURNING id INTO _project;
  END IF;

  INSERT INTO public.settings (project_id) VALUES (_project) ON CONFLICT (project_id) DO NOTHING;
  RETURN _project;
END; $$;
GRANT EXECUTE ON FUNCTION public.claim_admin_project(text) TO authenticated;