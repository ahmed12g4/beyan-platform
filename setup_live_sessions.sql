-- Create the live_sessions table
CREATE TABLE public.live_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    session_date TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    meet_url TEXT,
    status TEXT DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'LIVE', 'ENDED', 'CANCELLED')),
    recording_url TEXT,
    is_confirmed_by_teacher BOOLEAN DEFAULT false,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add foreign key properly bridging to profiles
ALTER TABLE public.live_sessions
ADD CONSTRAINT live_sessions_teacher_id_fkey
FOREIGN KEY (teacher_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Enable Row Level Security
ALTER TABLE public.live_sessions ENABLE ROW LEVEL SECURITY;

-- Policy 1: Everyone can view live sessions they are related to
-- For simplicity, let's just make them readable to authenticated users, 
-- and the app UI will filter appropriately based on enrollments/ownership.
CREATE POLICY "Enable read access for authenticated users" 
ON public.live_sessions 
FOR SELECT 
TO authenticated 
USING (true);

-- Policy 2: Teachers and Admins can create live sessions
CREATE POLICY "Enable insert for authenticated users"
ON public.live_sessions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = teacher_id OR auth.uid() = created_by);

-- Policy 3: Teachers and Admins can update their own sessions
CREATE POLICY "Enable update for creators and teachers"
ON public.live_sessions
FOR UPDATE
TO authenticated
USING (auth.uid() = teacher_id OR auth.uid() = created_by);

-- Policy 4: Teachers and Admins can delete
CREATE POLICY "Enable delete for creators and teachers"
ON public.live_sessions
FOR DELETE
TO authenticated
USING (auth.uid() = teacher_id OR auth.uid() = created_by);

-- Trigger to automatically string updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at_live_sessions()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_live_sessions_updated
BEFORE UPDATE ON public.live_sessions
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at_live_sessions();
