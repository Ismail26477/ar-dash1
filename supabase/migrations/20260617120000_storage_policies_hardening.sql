-- ============================================================
-- STORAGE HARDENING — owner-scoped avatars, staff-only product/
-- category images. Idempotent / re-runnable. Public read kept so
-- getPublicUrl() works for storefront + admin.
-- Relies on public.is_staff() (defined in critical_functions_rls).
-- ============================================================

-- Ensure buckets exist and are public (for getPublicUrl)
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;
INSERT INTO storage.buckets (id, name, public) VALUES ('category-images', 'category-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- ---------- AVATARS: owner-scoped writes (path = <uid>/<file>) ----------
DROP POLICY IF EXISTS "Avatars are publicly accessible" ON storage.objects;
CREATE POLICY "Avatars are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ---------- PRODUCT IMAGES: staff-only writes, public read ----------
DROP POLICY IF EXISTS "Product images are publicly accessible" ON storage.objects;
CREATE POLICY "Product images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Staff can upload product images" ON storage.objects;
CREATE POLICY "Staff can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-images' AND public.is_staff());

DROP POLICY IF EXISTS "Authenticated users can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Staff can update product images" ON storage.objects;
CREATE POLICY "Staff can update product images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'product-images' AND public.is_staff());

DROP POLICY IF EXISTS "Authenticated users can delete product images" ON storage.objects;
DROP POLICY IF EXISTS "Staff can delete product images" ON storage.objects;
CREATE POLICY "Staff can delete product images"
ON storage.objects FOR DELETE
USING (bucket_id = 'product-images' AND public.is_staff());

-- ---------- CATEGORY IMAGES: admin-only writes, public read ----------
DROP POLICY IF EXISTS "Category images are publicly accessible" ON storage.objects;
CREATE POLICY "Category images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'category-images');

DROP POLICY IF EXISTS "Admin can upload category images" ON storage.objects;
CREATE POLICY "Admin can upload category images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'category-images' AND public.is_admin());

DROP POLICY IF EXISTS "Admin can update category images" ON storage.objects;
CREATE POLICY "Admin can update category images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'category-images' AND public.is_admin());

DROP POLICY IF EXISTS "Admin can delete category images" ON storage.objects;
CREATE POLICY "Admin can delete category images"
ON storage.objects FOR DELETE
USING (bucket_id = 'category-images' AND public.is_admin());
