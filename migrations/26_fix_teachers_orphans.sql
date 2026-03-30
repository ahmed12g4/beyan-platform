-- ============================================================
-- 26_fix_teachers_orphans.sql
-- Fix: Orphaned teachers and ForeignKey Violation
-- ============================================================

-- 1. Identify and Remove Orphaned Teacher Records
-- These are teachers that don't have a corresponding profile in the profiles table.
DELETE FROM public.teachers 
WHERE user_id NOT IN (SELECT id FROM public.profiles);

-- 2. Clean up any other potential orphans (Optional but safe)
DELETE FROM public.teacher_availabilities 
WHERE teacher_id NOT IN (SELECT id FROM public.profiles);

DELETE FROM public.teacher_wallets 
WHERE teacher_id NOT IN (SELECT id FROM public.profiles);

-- 3. Re-apply the Foreign Key Constraint
-- This ensures that from now on, you cannot have a teacher without a profile.
-- It also sets up CASCADE DELETE.
ALTER TABLE public.teachers 
DROP CONSTRAINT IF EXISTS teachers_user_id_fkey;

ALTER TABLE public.teachers 
ADD CONSTRAINT teachers_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;

-- 4. Sync: Ensure every user with role='teacher' has a record in the teachers table
-- (Only if it doesn't already exist)
INSERT INTO public.teachers (user_id, full_name, price_per_lesson, is_available)
SELECT id, full_name, 0, false
FROM public.profiles
WHERE role = 'teacher'
AND id NOT IN (SELECT user_id FROM public.teachers)
ON CONFLICT (user_id) DO NOTHING;

-- Verification
-- After running this, the "insert or update on table teachers violates foreign key constraint" error will be fixed.
