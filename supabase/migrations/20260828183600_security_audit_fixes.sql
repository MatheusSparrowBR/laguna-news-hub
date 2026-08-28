-- AUDITORIA DE SEGURANÇA: Correções de policies e proteções
-- Data: 2026-08-28

-- =====================================================
-- 1. REMOVER POLICIES PERMISSIVAS (USING true) que quebram isolamento entre projetos
-- As policies originais da migration 1 (baseadas em owns_project) já são suficientes.
-- =====================================================

-- news: remover policy permissiva, manter news_project
DROP POLICY IF EXISTS "allow_authenticated_read_news" ON public.news;

-- sources: remover policy permissiva, manter sources_project
DROP POLICY IF EXISTS "allow_authenticated_read_sources" ON public.sources;

-- news_analysis: remover policy permissiva, manter news_analysis_project
DROP POLICY IF EXISTS "allow_authenticated_read_news_analysis" ON public.news_analysis;

-- projects: remover policy permissiva, manter projects_own
DROP POLICY IF EXISTS "allow_authenticated_read_projects" ON public.projects;

-- categories: manter allow_authenticated_read_categories (tabela global, SELECT OK)
-- Não remover.

-- =====================================================
-- 2. AUTOMATION_RUNS: restringir para que usuário comum não possa inserir/modificar runs
-- Apenas SELECT (para ver histórico) é permitido ao authenticated.
-- INSERT/UPDATE/DELETE ficam para service_role (Edge Functions/backend).
-- =====================================================

-- Remover policy antiga que permitia ALL
DROP POLICY IF EXISTS "automation_runs_project" ON public.automation_runs;

-- Usuário autenticado pode apenas VER runs do próprio projeto
CREATE POLICY "automation_runs_select_own"
  ON public.automation_runs
  FOR SELECT
  TO authenticated
  USING (public.owns_project(project_id));

-- Revogar INSERT/UPDATE/DELETE de authenticated nesta tabela
-- (service_role já tem ALL via GRANT ALL)
REVOKE INSERT, UPDATE, DELETE ON public.automation_runs FROM authenticated;

-- =====================================================
-- 3. PROFILES: impedir que usuário altere o próprio role via frontend
-- =====================================================

CREATE OR REPLACE FUNCTION public.prevent_role_change()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  -- Permitir mudança de role apenas se executado pelo service_role (backend)
  -- current_setting('role') retorna o role da sessão atual no PostgreSQL
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    -- Verificar se é uma sessão de service_role
    -- Em Supabase, request.jwt.claims->>'role' indica o role do JWT
    IF current_setting('request.jwt.claims', true)::jsonb->>'role' != 'service_role' THEN
      RAISE EXCEPTION 'Alteração de role não permitida';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_role_change_trigger ON public.profiles;
CREATE TRIGGER prevent_role_change_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_role_change();
