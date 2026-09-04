-- Cria o campo editorial explícito para o crédito/fonte da foto.
-- Não altera dados existentes: coluna nova, opcional e retrocompatível.
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS photo_credit text;

COMMENT ON COLUMN public.posts.photo_credit IS
  'Crédito/fonte informado manualmente para a fotografia usada na publicação.';
