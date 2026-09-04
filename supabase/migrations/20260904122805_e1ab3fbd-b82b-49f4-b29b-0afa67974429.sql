CREATE TABLE public.social_account_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  provider text NOT NULL,
  access_token text NOT NULL,
  token_type text NOT NULL DEFAULT 'bearer',
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, provider)
);

GRANT ALL ON public.social_account_credentials TO service_role;
ALTER TABLE public.social_account_credentials ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER social_account_credentials_updated_at
BEFORE UPDATE ON public.social_account_credentials
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.oauth_states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  provider text NOT NULL,
  state_hash text NOT NULL UNIQUE,
  created_by uuid,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX oauth_states_project_id_idx ON public.oauth_states(project_id);
GRANT ALL ON public.oauth_states TO service_role;
ALTER TABLE public.oauth_states ENABLE ROW LEVEL SECURITY;