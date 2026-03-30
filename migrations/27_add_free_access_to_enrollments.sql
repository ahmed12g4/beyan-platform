-- Migration: Add free access support to enrollments
-- Path: migrations/27_add_free_access_to_enrollments.sql

-- 1. Add is_free column
ALTER TABLE public.enrollments 
ADD COLUMN IF NOT EXISTS is_free BOOLEAN NOT NULL DEFAULT false;

-- 2. Update status check constraint if necessary 
-- The user mentioned 'inactive', but the existing check is: 
-- CHECK (status IN ('ACTIVE', 'PAUSED', 'COMPLETED', 'DROPPED'))
-- I will add 'INACTIVE' to the allowed statuses to match the requirement.

ALTER TABLE public.enrollments 
DROP CONSTRAINT IF EXISTS enrollments_status_check;

ALTER TABLE public.enrollments 
ADD CONSTRAINT enrollments_status_check 
CHECK (status IN ('ACTIVE', 'PAUSED', 'COMPLETED', 'DROPPED', 'INACTIVE'));

-- 3. RLS Policies (Ensure Admin can manage all enrollments)
-- The existing policy 'enrollments_admin_all' already allows ALL for admins:
-- CREATE POLICY "enrollments_admin_all" ON public.enrollments FOR ALL USING (public.get_user_role() = 'admin');
-- So no new policies are strictly required, but we should double check if students can see is_free.
-- Students can see their own enrollments via 'enrollments_select_own'.

-- 4. Add index for performance on free enrollments
CREATE INDEX IF NOT EXISTS idx_enrollments_is_free ON public.enrollments(is_free) WHERE is_free = true;
