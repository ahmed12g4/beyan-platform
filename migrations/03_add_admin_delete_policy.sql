-- ============================================================
-- Admin: Add DELETE policy for profiles table
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- ============================================================

-- Allow admins to delete any profile
CREATE POLICY "profiles_admin_delete"
    ON public.profiles FOR DELETE
    USING (public.get_user_role() = 'admin');

-- Optional: Change courses table constraint from RESTRICT to CASCADE
-- so deleting a teacher also deletes their courses.
-- UNCOMMENT the following if you want automatic cascade:
-- ALTER TABLE public.courses DROP CONSTRAINT courses_teacher_id_fkey;
-- ALTER TABLE public.courses ADD CONSTRAINT courses_teacher_id_fkey 
--     FOREIGN KEY (teacher_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
