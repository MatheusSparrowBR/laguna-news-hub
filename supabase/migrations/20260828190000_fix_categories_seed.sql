-- Migration corretiva: categorias globais (sem project_id)
-- 
-- PROBLEMA: A migration 20260828133100_seed_demo_news.sql tenta buscar/inserir
-- categorias usando "project_id", mas a tabela categories é global e NÃO possui
-- essa coluna. Isso causa falha silenciosa (SELECT retorna NULL, INSERT falha
-- por UNIQUE constraint em name/slug).
--
-- SOLUÇÃO: Garantir que as 12 categorias existam usando ON CONFLICT para
-- evitar duplicações. Não altera estrutura nem apaga dados existentes.
-- =============================================================================

INSERT INTO public.categories (name, slug, active) VALUES
  ('Urgente',     'urgente',     true),
  ('Trânsito',    'transito',    true),
  ('Segurança',   'seguranca',   true),
  ('Prefeitura',  'prefeitura',  true),
  ('Cidade',      'cidade',      true),
  ('Eventos',     'eventos',     true),
  ('Turismo',     'turismo',     true),
  ('Clima',       'clima',       true),
  ('Esportes',    'esportes',    true),
  ('Economia',    'economia',    true),
  ('Educação',    'educacao',    true),
  ('Saúde',       'saude',       true)
ON CONFLICT (slug) DO NOTHING;
