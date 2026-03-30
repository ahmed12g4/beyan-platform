-- ==========================================
-- SECURE LIVE SESSIONS RLS POLICY
-- Fixes the critical issue where all sessions were public
-- ==========================================

-- 1. Drop the overly permissive policy
DROP POLICY IF EXISTS "Sessions are viewable by everyone" ON public.live_sessions;

-- 2. Create strict policy for Students/Public
-- Allows viewing ONLY if:
-- A) It's a standalone session (webinar) -> course_id IS NULL
-- B) OR user is enrolled in the linked course with 'active' or 'completed' status
-- B) OR user is enrolled in the linked course with 'active' or 'completed' status
DROP POLICY IF EXISTS "Students can view relevant sessions" ON public.live_sessions;

CREATE POLICY "Students can view relevant sessions"
ON public.live_sessions
FOR SELECT
USING (
  -- Option 1: Standalone session (public to authenticated users)
  course_id IS NULL
  OR
  -- Option 2: Enrolled course session
  EXISTS (
    SELECT 1 FROM public.enrollments
    WHERE enrollments.course_id = live_sessions.course_id
    AND enrollments.student_id = auth.uid()
    AND (enrollments.status = 'active' OR enrollments.status = 'completed') 
  )
);

-- 3. Ensure Teachers can view their own assigned sessions (and standalone ones)
DROP POLICY IF EXISTS "Teachers can view assigned sessions" ON public.live_sessions;
CREATE POLICY "Teachers can view assigned sessions"
ON public.live_sessions
FOR SELECT
USING (
  teacher_id = auth.uid() 
  OR 
  course_id IS NULL -- They should also see webinars they might be leading even if not explicitly assigned yet (though usually they are)
  OR
  EXISTS (
     -- Teachers should see sessions for courses they teach
     SELECT 1 FROM public.courses
     WHERE courses.id = live_sessions.course_id
     AND courses.teacher_id = auth.uid()
  )
);

-- 4. Admins already have full access via "Admins can manage all sessions" (Policy 1 in create_live_sessions.sql)
