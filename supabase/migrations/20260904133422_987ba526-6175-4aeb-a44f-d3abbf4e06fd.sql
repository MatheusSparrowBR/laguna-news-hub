CREATE UNIQUE INDEX IF NOT EXISTS posts_idempotency_key_uidx
  ON public.posts (idempotency_key)
  WHERE idempotency_key IS NOT NULL;