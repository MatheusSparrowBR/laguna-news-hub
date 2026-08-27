-- owns_project passa a ser SECURITY INVOKER (as políticas do projeto já limitam a visibilidade)
CREATE OR REPLACE FUNCTION public.owns_project(_project_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.projects p WHERE p.id = _project_id AND p.owner_id = auth.uid());
$$;
REVOKE ALL ON FUNCTION public.owns_project(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.owns_project(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.claim_admin_project(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_admin_project(text) TO authenticated;