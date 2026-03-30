-- Create live_sessions table
CREATE TABLE IF NOT EXISTS public.live_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    session_date TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    meet_url TEXT NOT NULL,
    teacher_id UUID REFERENCES public.profiles(id),
    is_confirmed_by_teacher BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.live_sessions ENABLE ROW LEVEL SECURITY;

-- Policies

-- 1. Admins can do everything
CREATE POLICY "Admins can manage all sessions"
ON public.live_sessions
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- 2. Teachers can view sessions assigned to them
CREATE POLICY "Teachers can view assigned sessions"
ON public.live_sessions
FOR SELECT
USING (
  teacher_id = auth.uid()
);

-- 3. Teachers can update confirmation status of assigned sessions
CREATE POLICY "Teachers can confirm assigned sessions"
ON public.live_sessions
FOR UPDATE
USING (
  teacher_id = auth.uid()
)
WITH CHECK (
  teacher_id = auth.uid()
);

-- 4. Students can view sessions for courses they are enrolled in
CREATE POLICY "Students can view sessions for enrolled courses"
ON public.live_sessions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.enrollments
    WHERE enrollments.course_id = live_sessions.course_id
    AND enrollments.student_id = auth.uid()
    AND enrollments.status = 'active' -- Assuming 'active' status exists
  )
);

-- Triggers for updated_at
CREATE TRIGGER update_live_sessions_updated_at
BEFORE UPDATE ON public.live_sessions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
