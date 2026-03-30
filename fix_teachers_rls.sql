-- ============================================================
-- 1. Fix: Missing UNIQUE constraint for ON CONFLICT
-- ============================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'teachers_user_id_key'
    ) THEN
        ALTER TABLE public.teachers ADD CONSTRAINT teachers_user_id_key UNIQUE (user_id);
    END IF;
END $$;

-- ============================================================
-- 2. Fix: Missing RLS Policies for Teachers
-- ============================================================

-- Allow teachers to view their own profile record (needed for dashboard & actions)
DROP POLICY IF EXISTS "Teachers can view own profile" ON public.teachers;
CREATE POLICY "Teachers can view own profile" 
ON public.teachers FOR SELECT 
USING (auth.uid() = user_id);

-- Allow teachers to update their own profile data
DROP POLICY IF EXISTS "Teachers can update own profile" ON public.teachers;
CREATE POLICY "Teachers can update own profile" 
ON public.teachers FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Ensure admins can also manage teachers
DROP POLICY IF EXISTS "Admins can manage teachers" ON public.teachers;
CREATE POLICY "Admins can manage teachers" 
ON public.teachers FOR ALL 
USING ( (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' );

-- ============================================================
-- 3. Fix: Auto-create Teacher Profile Trigger
-- ============================================================

-- Update the handle_new_user function to also create a teacher record
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
    user_role TEXT;
BEGIN
    user_role := COALESCE(NEW.raw_user_meta_data ->> 'role', 'student');
    
    INSERT INTO public.profiles (id, full_name, email, role, is_active)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
        NEW.email,
        user_role,
        CASE WHEN user_role = 'teacher' THEN false ELSE true END
    );

    -- Auto create teacher profile if role is teacher
    IF user_role = 'teacher' THEN
        INSERT INTO public.teachers (user_id, full_name, price_per_lesson, is_available)
        VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''), 0, false)
        ON CONFLICT (user_id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$;

-- ============================================================
-- 4. One-time Sync: Create missing profiles for existing teachers
-- ============================================================
INSERT INTO public.teachers (user_id, full_name, price_per_lesson, is_available)
SELECT id, full_name, 0, false
FROM public.profiles
WHERE role = 'teacher'
AND id NOT IN (SELECT user_id FROM public.teachers)
ON CONFLICT (user_id) DO NOTHING;

-- Verification:
-- After running this, the "Teacher profile not found" error will be resolved forever.
