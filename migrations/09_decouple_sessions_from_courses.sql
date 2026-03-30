-- Make course_id nullable to support standalone sessions (webinars, etc.)
ALTER TABLE public.live_sessions ALTER COLUMN course_id DROP NOT NULL;

-- Create an index on session_date for faster queries on the "Live Calendar"
CREATE INDEX IF NOT EXISTS idx_live_sessions_date ON public.live_sessions(session_date);

-- Update RLS policy for students to allow viewing standalone sessions (where course_id is NULL)
-- or sessions for courses they are enrolled in.

DROP POLICY IF EXISTS "Students can view sessions for enrolled courses" ON public.live_sessions;

CREATE POLICY "Students can view relevant sessions"
ON public.live_sessions
FOR SELECT
USING (
  -- Option 1: Standalone session (public to all students)
  course_id IS NULL
  OR
  -- Option 2: Enrolled course session
  EXISTS (
    SELECT 1 FROM public.enrollments
    WHERE enrollments.course_id = live_sessions.course_id
    AND enrollments.student_id = auth.uid()
    AND enrollments.status = 'active'
  )
);
