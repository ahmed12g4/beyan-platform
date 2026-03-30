-- ==========================================
-- CREATE MISSING STORAGE BUCKETS
-- Buckets: courses, groups, avatars
-- ==========================================

-- 1. Create Buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('courses', 'courses', true),
  ('groups', 'groups', true),
  ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Clean up existing overlapping policies for these specific buckets
DROP POLICY IF EXISTS "Public Read Access for courses" ON storage.objects;
DROP POLICY IF EXISTS "Admin Manage Access for courses" ON storage.objects;
DROP POLICY IF EXISTS "Public Read Access for groups" ON storage.objects;
DROP POLICY IF EXISTS "Admin Manage Access for groups" ON storage.objects;
DROP POLICY IF EXISTS "Public Read Access for avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can manage own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage all avatars" ON storage.objects;

-- ==========================================
-- 3. POLICIES FOR 'courses' BUCKET
-- ==========================================
CREATE POLICY "Public Read Access for courses"
ON storage.objects FOR SELECT
USING ( bucket_id = 'courses' );

CREATE POLICY "Admin Manage Access for courses"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'courses' 
  AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  bucket_id = 'courses' 
  AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- ==========================================
-- 4. POLICIES FOR 'groups' BUCKET
-- ==========================================
CREATE POLICY "Public Read Access for groups"
ON storage.objects FOR SELECT
USING ( bucket_id = 'groups' );

CREATE POLICY "Admin Manage Access for groups"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'groups' 
  AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  bucket_id = 'groups' 
  AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- ==========================================
-- 5. POLICIES FOR 'avatars' BUCKET
-- ==========================================
CREATE POLICY "Public Read Access for avatars"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

-- Users can manage their own avatar folder (path: userId/filename)
CREATE POLICY "Users can manage own avatar"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Admins can also manage all avatars
CREATE POLICY "Admins can manage all avatars"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  bucket_id = 'avatars' 
  AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);
