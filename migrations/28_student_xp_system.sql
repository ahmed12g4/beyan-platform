-- Migration: Add Student XP and Streak System
-- Path: migrations/28_student_xp_system.sql

-- 1. Create student_xp table
CREATE TABLE IF NOT EXISTS public.student_xp (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    total_xp INTEGER NOT NULL DEFAULT 0,
    current_level INTEGER NOT NULL DEFAULT 1,
    current_league TEXT NOT NULL DEFAULT 'BRONZ',
    streak_days INTEGER NOT NULL DEFAULT 0,
    last_activity_date DATE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(student_id)
);

-- 2. Create xp_transactions table
CREATE TABLE IF NOT EXISTS public.xp_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    xp_amount INTEGER NOT NULL,
    reason TEXT NOT NULL,
    reference_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create daily_activity table
CREATE TABLE IF NOT EXISTS public.daily_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
    lessons_watched INTEGER NOT NULL DEFAULT 0,
    xp_earned INTEGER NOT NULL DEFAULT 0,
    UNIQUE(student_id, activity_date)
);

-- 4. Enable RLS
ALTER TABLE public.student_xp ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_activity ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
-- Students can read their own
CREATE POLICY "student_xp_select_own" ON public.student_xp FOR SELECT USING (student_id = auth.uid());
CREATE POLICY "xp_transactions_select_own" ON public.xp_transactions FOR SELECT USING (student_id = auth.uid());
CREATE POLICY "daily_activity_select_own" ON public.daily_activity FOR SELECT USING (student_id = auth.uid());

-- Admin can read all
CREATE POLICY "student_xp_select_admin" ON public.student_xp FOR SELECT USING (public.get_user_role() = 'admin');
CREATE POLICY "xp_transactions_select_admin" ON public.xp_transactions FOR SELECT USING (public.get_user_role() = 'admin');
CREATE POLICY "daily_activity_select_admin" ON public.daily_activity FOR SELECT USING (public.get_user_role() = 'admin');

-- System/Admin management
CREATE POLICY "student_xp_admin_all" ON public.student_xp FOR ALL USING (public.get_user_role() = 'admin');
CREATE POLICY "xp_transactions_admin_all" ON public.xp_transactions FOR ALL USING (public.get_user_role() = 'admin');
CREATE POLICY "daily_activity_admin_all" ON public.daily_activity FOR ALL USING (public.get_user_role() = 'admin');

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_student_xp_student_id ON public.student_xp(student_id);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_student_id ON public.xp_transactions(student_id);
CREATE INDEX IF NOT EXISTS idx_daily_activity_student_id ON public.daily_activity(student_id);
CREATE INDEX IF NOT EXISTS idx_daily_activity_date ON public.daily_activity(activity_date);
