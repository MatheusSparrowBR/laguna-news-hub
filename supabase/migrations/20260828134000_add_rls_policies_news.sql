-- Garante que RLS está habilitado e adiciona policy de leitura para a tabela news
-- Isso permite que usuários autenticados leiam todas as notícias do seu projeto

ALTER TABLE IF EXISTS public.news ENABLE ROW LEVEL SECURITY;

-- Policy para SELECT: qualquer usuário autenticado pode ler notícias
-- (o filtro por project_id é feito no app)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'news' AND policyname = 'allow_authenticated_read_news'
  ) THEN
    CREATE POLICY allow_authenticated_read_news ON public.news
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END
$$;

-- Policy para SELECT na tabela sources (necessária para o JOIN)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'sources' AND policyname = 'allow_authenticated_read_sources'
  ) THEN
    ALTER TABLE IF EXISTS public.sources ENABLE ROW LEVEL SECURITY;
    CREATE POLICY allow_authenticated_read_sources ON public.sources
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END
$$;

-- Policy para SELECT na tabela categories (necessária para o JOIN)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'categories' AND policyname = 'allow_authenticated_read_categories'
  ) THEN
    ALTER TABLE IF EXISTS public.categories ENABLE ROW LEVEL SECURITY;
    CREATE POLICY allow_authenticated_read_categories ON public.categories
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END
$$;

-- Policy para SELECT na tabela news_analysis (necessária para o JOIN)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'news_analysis' AND policyname = 'allow_authenticated_read_news_analysis'
  ) THEN
    ALTER TABLE IF EXISTS public.news_analysis ENABLE ROW LEVEL SECURITY;
    CREATE POLICY allow_authenticated_read_news_analysis ON public.news_analysis
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END
$$;

-- Policy para SELECT na tabela projects
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'projects' AND policyname = 'allow_authenticated_read_projects'
  ) THEN
    ALTER TABLE IF EXISTS public.projects ENABLE ROW LEVEL SECURITY;
    CREATE POLICY allow_authenticated_read_projects ON public.projects
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END
$$;
