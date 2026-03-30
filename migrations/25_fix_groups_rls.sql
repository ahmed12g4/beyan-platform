-- ============================================================
-- 25_fix_groups_rls.sql
-- Fix: Row-Level Security Policies for Groups Management
-- ============================================================

-- 1. Enable RLS for groups-related tables
ALTER TABLE IF EXISTS public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.group_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.group_enrollments ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing problematic policies if any (to avoid conflicts)
DO $$ 
BEGIN
    -- Groups
    DROP POLICY IF EXISTS "Admins can manage all groups" ON public.groups;
    DROP POLICY IF EXISTS "Anyone can view published groups" ON public.groups;
    DROP POLICY IF EXISTS "Admins can manage groups" ON public.groups;
    DROP POLICY IF EXISTS "Public can view groups" ON public.groups;
    
    -- Sessions
    DROP POLICY IF EXISTS "Admins can manage all group sessions" ON public.group_sessions;
    DROP POLICY IF EXISTS "Anyone can view group sessions" ON public.group_sessions;
    DROP POLICY IF EXISTS "Admins can manage group sessions" ON public.group_sessions;
    
    -- Enrollments
    DROP POLICY IF EXISTS "Admins can manage all group enrollments" ON public.group_enrollments;
    DROP POLICY IF EXISTS "Admins can manage group enrollments" ON public.group_enrollments;
EXCEPTION WHEN OTHERS THEN END $$;

-- ============================================================
-- 3. POLICIES FOR 'groups' TABLE
-- ============================================================

-- Allow Admins to perform ALL operations on groups
CREATE POLICY "Admins can manage all groups"
ON public.groups
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Allow everyone (authenticated and anon) to view published groups
CREATE POLICY "Anyone can view published groups"
ON public.groups
FOR SELECT
USING (is_published = true);

-- ============================================================
-- 4. POLICIES FOR 'group_sessions' TABLE
-- ============================================================

-- Allow Admins to perform ALL operations on sessions
CREATE POLICY "Admins can manage all group sessions"
ON public.group_sessions
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Allow everyone to view group sessions (needed for the public group details page)
CREATE POLICY "Anyone can view group sessions"
ON public.group_sessions
FOR SELECT
USING (true);

-- ============================================================
-- 5. POLICIES FOR 'group_enrollments' TABLE
-- ============================================================

-- Allow Admins to perform ALL operations on enrollments
CREATE POLICY "Admins can manage all group enrollments"
ON public.group_enrollments
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Allow students to view their own enrollments
CREATE POLICY "Students can view own group enrollments"
ON public.group_enrollments
FOR SELECT
TO authenticated
USING (auth.uid() = student_id);

-- Verify
-- After running this SQL in Supabase SQL Editor, the "RLS Policy Violation" error will be resolved.
