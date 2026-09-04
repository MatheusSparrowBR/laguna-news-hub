-- Cover the audit_logs actor foreign key flagged by Supabase advisors.
CREATE INDEX IF NOT EXISTS audit_logs_actor_id_idx
  ON public.audit_logs(actor_id);

-- Hot lookups used by the editor and Instagram publisher.
CREATE INDEX IF NOT EXISTS post_assets_post_asset_type_created_idx
  ON public.post_assets(post_id, asset_type, created_at DESC);

CREATE INDEX IF NOT EXISTS news_analysis_news_id_idx
  ON public.news_analysis(news_id);

CREATE INDEX IF NOT EXISTS publication_logs_post_status_idx
  ON public.publication_logs(post_id, status);

-- Remove only explicit healthcheck markers generated during the integration audit.
DELETE FROM public.posts
WHERE title = '__HEALTHCHECK_POST_UPDATED__';

DELETE FROM public.community_submissions
WHERE title = '__HEALTHCHECK_COMMUNITY_SUBMISSION__';
