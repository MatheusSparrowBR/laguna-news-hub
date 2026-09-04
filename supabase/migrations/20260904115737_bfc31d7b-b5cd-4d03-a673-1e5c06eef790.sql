DROP POLICY IF EXISTS "social_assets_select_own_project" ON storage.objects;
CREATE POLICY "social_assets_select_own_project"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'social-assets'
     AND public.owns_project(NULLIF((storage.foldername(name))[1], '')::uuid));

DROP POLICY IF EXISTS "social_assets_insert_own_project" ON storage.objects;
CREATE POLICY "social_assets_insert_own_project"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'social-assets'
     AND public.owns_project(NULLIF((storage.foldername(name))[1], '')::uuid));

DROP POLICY IF EXISTS "social_assets_update_own_project" ON storage.objects;
CREATE POLICY "social_assets_update_own_project"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'social-assets'
     AND public.owns_project(NULLIF((storage.foldername(name))[1], '')::uuid))
  WITH CHECK (bucket_id = 'social-assets'
     AND public.owns_project(NULLIF((storage.foldername(name))[1], '')::uuid));

DROP POLICY IF EXISTS "social_assets_delete_own_project" ON storage.objects;
CREATE POLICY "social_assets_delete_own_project"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'social-assets'
     AND public.owns_project(NULLIF((storage.foldername(name))[1], '')::uuid));