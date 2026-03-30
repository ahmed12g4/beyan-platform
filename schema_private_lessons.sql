-- Create or Update 'teachers' table
CREATE TABLE IF NOT EXISTS public.teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    bio TEXT,
    specialization TEXT,
    photo_url TEXT,
    price_per_lesson NUMERIC NOT NULL DEFAULT 0,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- RLS: Visitors can read available teachers, only admin can write
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone." ON public.teachers FOR SELECT USING (is_available = true);
-- Admins only policy not detailed here but assumed managed centrally

-- Create or Update 'teacher_availability'
CREATE TABLE IF NOT EXISTS public.teacher_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_booked BOOLEAN DEFAULT false
);

ALTER TABLE public.teacher_availability ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public available times." ON public.teacher_availability FOR SELECT USING (true);
CREATE POLICY "Teachers can update their own times." ON public.teacher_availability FOR UPDATE USING ( auth.uid() IN (SELECT user_id FROM public.teachers WHERE id = teacher_id) );
CREATE POLICY "Teachers can insert their own times." ON public.teacher_availability FOR INSERT WITH CHECK ( auth.uid() IN (SELECT user_id FROM public.teachers WHERE id = teacher_id) );
CREATE POLICY "Teachers can delete their own times." ON public.teacher_availability FOR DELETE USING ( auth.uid() IN (SELECT user_id FROM public.teachers WHERE id = teacher_id) );

-- Create 'bookings' table
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE,
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed')),
    meet_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students see own bookings" ON public.bookings FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Teachers see own bookings" ON public.bookings FOR SELECT USING (auth.uid() IN (SELECT user_id FROM public.teachers WHERE id = teacher_id));
CREATE POLICY "Students can insert own bookings" ON public.bookings FOR INSERT WITH CHECK (auth.uid() = student_id);

-- Create 'student_lesson_balance'
CREATE TABLE IF NOT EXISTS public.student_lesson_balance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE,
    lessons_remaining INTEGER NOT NULL DEFAULT 0,
    lessons_total INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(student_id, teacher_id)
);

ALTER TABLE public.student_lesson_balance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students see own balance" ON public.student_lesson_balance FOR SELECT USING (auth.uid() = student_id);

-- Storage
INSERT INTO storage.buckets (id, name, public) VALUES ('teachers', 'teachers', true) ON CONFLICT DO NOTHING;
