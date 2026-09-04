-- Secure write path for audit logs.
-- The authenticated caller must own the project; actor_id always comes from auth.uid().
CREATE OR REPLACE FUNCTION public.registrar_auditoria(
  p_project_id uuid,
  p_action text,
  p_entity_type text,
  p_entity_id uuid DEFAULT NULL,
  p_details jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  novo_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Autenticação necessária';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.projects
    WHERE id = p_project_id
      AND owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Projeto não autorizado';
  END IF;

  INSERT INTO public.audit_logs (
    project_id,
    actor_id,
    action,
    entity_type,
    entity_id,
    details
  )
  VALUES (
    p_project_id,
    auth.uid(),
    left(coalesce(p_action, ''), 120),
    left(coalesce(p_entity_type, ''), 120),
    p_entity_id,
    coalesce(p_details, '{}'::jsonb)
  )
  RETURNING id INTO novo_id;

  RETURN novo_id;
END;
$$;

REVOKE ALL ON FUNCTION public.registrar_auditoria(uuid, text, text, uuid, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.registrar_auditoria(uuid, text, text, uuid, jsonb) FROM anon;
GRANT EXECUTE ON FUNCTION public.registrar_auditoria(uuid, text, text, uuid, jsonb) TO authenticated;
