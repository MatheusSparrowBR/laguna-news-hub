-- Regras explícitas de acesso: nada é acessível a partir do navegador.
-- Somente o servidor (chave de serviço) manipula credenciais e pedidos de conexão.
REVOKE ALL ON public.social_account_credentials FROM anon, authenticated;
REVOKE ALL ON public.oauth_states FROM anon, authenticated;

DROP POLICY IF EXISTS "credenciais sem acesso pelo cliente" ON public.social_account_credentials;
CREATE POLICY "credenciais sem acesso pelo cliente"
  ON public.social_account_credentials
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

DROP POLICY IF EXISTS "pedidos de conexao sem acesso pelo cliente" ON public.oauth_states;
CREATE POLICY "pedidos de conexao sem acesso pelo cliente"
  ON public.oauth_states
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);