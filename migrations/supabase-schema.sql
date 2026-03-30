-- ============================================================
-- Beyan Dil Akademi — Complete Database Schema
-- Run this entire file in Supabase SQL Editor
-- ============================================================

-- ============================================================
-- 0. HELPER FUNCTION: Auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 1. PROFILES (extends Supabase auth.users)
-- ============================================================
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    bio TEXT,
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'admin')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    subscription_status TEXT DEFAULT 'FREE' CHECK (subscription_status IN ('FREE', 'PREMIUM', 'TRIAL')),
    subscription_expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
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
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 2. COURSES
-- ============================================================
CREATE TABLE public.courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    thumbnail_url TEXT,
    level TEXT CHECK (level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
    course_type TEXT DEFAULT 'GENERAL' CHECK (course_type IN ('GENERAL', 'CONVERSATION', 'BUSINESS', 'GRAMMAR', 'QURAN', 'VOCABULARY', 'OTHER')),
    price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'TRY',
    duration_weeks INTEGER,
    schedule TEXT,
    color TEXT DEFAULT '#204544',
    is_published BOOLEAN NOT NULL DEFAULT false,
    is_subscription_only BOOLEAN NOT NULL DEFAULT false,
    max_students INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_courses_updated_at
    BEFORE UPDATE ON public.courses
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_courses_teacher_id ON public.courses(teacher_id);
CREATE INDEX idx_courses_slug ON public.courses(slug);
CREATE INDEX idx_courses_is_published ON public.courses(is_published);

-- ============================================================
-- 3. LESSONS
-- ============================================================
CREATE TABLE public.lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    duration_minutes INTEGER DEFAULT 45,
    lesson_type TEXT DEFAULT 'VIDEO' CHECK (lesson_type IN ('VIDEO', 'LIVE', 'QUIZ', 'READING', 'ASSIGNMENT')),
    video_url TEXT,
    scheduled_at TIMESTAMPTZ,
    meeting_link TEXT,
    status TEXT DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SCHEDULED', 'LIVE', 'COMPLETED', 'CANCELLED')),
    is_published BOOLEAN NOT NULL DEFAULT false,
    is_free_preview BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_lessons_updated_at
    BEFORE UPDATE ON public.lessons
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_lessons_course_id ON public.lessons(course_id);
CREATE INDEX idx_lessons_order ON public.lessons(course_id, order_index);

-- ============================================================
-- 4. ENROLLMENTS
-- ============================================================
CREATE TABLE public.enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PAUSED', 'COMPLETED', 'DROPPED')),
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
    certificate_earned BOOLEAN NOT NULL DEFAULT false,
    UNIQUE(student_id, course_id)
);

CREATE INDEX idx_enrollments_student ON public.enrollments(student_id);
CREATE INDEX idx_enrollments_course ON public.enrollments(course_id);

-- ============================================================
-- 5. LESSON PROGRESS
-- ============================================================
CREATE TABLE public.lesson_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enrollment_id UUID NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    completed_at TIMESTAMPTZ,
    last_position_seconds INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(enrollment_id, lesson_id)
);

CREATE TRIGGER update_lesson_progress_updated_at
    BEFORE UPDATE ON public.lesson_progress
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_progress_enrollment ON public.lesson_progress(enrollment_id);
CREATE INDEX idx_progress_lesson ON public.lesson_progress(lesson_id);

-- ============================================================
-- 6. COMMENTS
-- ============================================================
CREATE TABLE public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    is_approved BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_comments_updated_at
    BEFORE UPDATE ON public.comments
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_comments_course ON public.comments(course_id);
CREATE INDEX idx_comments_user ON public.comments(user_id);

-- ============================================================
-- 7. NOTIFICATIONS
-- ============================================================
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'SYSTEM' CHECK (type IN (
        'ENROLLMENT', 'COURSE_UPDATE', 'LIVE_SESSION',
        'ACHIEVEMENT', 'COMMENT', 'SUBSCRIPTION', 'SYSTEM', 'BOOKING'
    )),
    link TEXT,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(user_id, is_read);

-- ============================================================
-- 8. COURSE CONTENT
-- ============================================================
CREATE TABLE public.course_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    content_type TEXT NOT NULL CHECK (content_type IN ('PDF', 'VIDEO', 'AUDIO', 'PPT', 'DOCUMENT', 'IMAGE', 'LINK', 'OTHER')),
    file_url TEXT NOT NULL,
    file_size BIGINT DEFAULT 0,
    mime_type TEXT,
    views INTEGER NOT NULL DEFAULT 0,
    downloads INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_content_course ON public.course_content(course_id);

-- ============================================================
-- 9. PLATFORM SETTINGS (singleton)
-- ============================================================
CREATE TABLE public.platform_settings (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    site_name TEXT NOT NULL DEFAULT 'Beyan Dil Akademi',
    site_description TEXT DEFAULT 'Online dil öğrenme platformu',
    contact_email TEXT DEFAULT 'info@beyan.com',
    support_email TEXT DEFAULT 'destek@beyan.com',
    max_enrollments_per_user INTEGER DEFAULT 10,
    allow_new_registrations BOOLEAN DEFAULT true,
    maintenance_mode BOOLEAN DEFAULT false,
    announcement_bar_enabled BOOLEAN DEFAULT false,
    announcement_text TEXT DEFAULT '',
    announcement_color TEXT DEFAULT '#204544',
    whatsapp_enabled BOOLEAN DEFAULT false,
    whatsapp_number TEXT DEFAULT '',
    whatsapp_message TEXT DEFAULT 'Merhaba, bilgi almak istiyorum',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_settings_updated_at
    BEFORE UPDATE ON public.platform_settings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.platform_settings (id) VALUES (1);

-- ============================================================
-- 10. VIEWS
-- ============================================================

CREATE OR REPLACE VIEW public.course_stats AS
SELECT
    c.id AS course_id,
    c.teacher_id,
    COUNT(DISTINCT e.id) AS enrolled_count,
    COUNT(DISTINCT CASE WHEN e.status = 'ACTIVE' THEN e.id END) AS active_students,
    COUNT(DISTINCT l.id) AS total_lessons,
    COALESCE(AVG(cm.rating), 0) AS avg_rating,
    COUNT(DISTINCT cm.id) AS review_count
FROM public.courses c
LEFT JOIN public.enrollments e ON e.course_id = c.id
LEFT JOIN public.lessons l ON l.course_id = c.id AND l.is_published = true
LEFT JOIN public.comments cm ON cm.course_id = c.id AND cm.is_approved = true
GROUP BY c.id, c.teacher_id;

CREATE OR REPLACE VIEW public.enrollment_progress AS
SELECT
    e.id AS enrollment_id,
    e.student_id,
    e.course_id,
    e.status,
    e.enrolled_at,
    COUNT(DISTINCT lp.id) FILTER (WHERE lp.is_completed = true) AS completed_lessons,
    COUNT(DISTINCT l.id) AS total_lessons,
    CASE
        WHEN COUNT(DISTINCT l.id) > 0
        THEN ROUND(
            (COUNT(DISTINCT lp.id) FILTER (WHERE lp.is_completed = true)::DECIMAL
            / COUNT(DISTINCT l.id)) * 100
        )
        ELSE 0
    END AS progress_percentage
FROM public.enrollments e
LEFT JOIN public.courses c ON c.id = e.course_id
LEFT JOIN public.lessons l ON l.course_id = c.id AND l.is_published = true
LEFT JOIN public.lesson_progress lp ON lp.enrollment_id = e.id AND lp.lesson_id = l.id
GROUP BY e.id, e.student_id, e.course_id, e.status, e.enrolled_at;

-- ============================================================
-- 11. ENABLE RLS ON ALL TABLES
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 12. HELPER FUNCTION: Get current user role
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- 13. RLS POLICIES — PROFILES
-- ============================================================
CREATE POLICY "profiles_select_all"
    ON public.profiles FOR SELECT USING (true);

CREATE POLICY "profiles_update_own"
    ON public.profiles FOR UPDATE
    USING (id = auth.uid())
    WITH CHECK (
        id = auth.uid()
        AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
    );

CREATE POLICY "profiles_admin_update"
    ON public.profiles FOR UPDATE
    USING (public.get_user_role() = 'admin');

CREATE POLICY "profiles_admin_delete"
    ON public.profiles FOR DELETE
    USING (public.get_user_role() = 'admin');

-- ============================================================
-- 14. RLS POLICIES — COURSES
-- ============================================================
CREATE POLICY "courses_select_published"
    ON public.courses FOR SELECT USING (is_published = true);

CREATE POLICY "courses_select_own_teacher"
    ON public.courses FOR SELECT USING (teacher_id = auth.uid());

CREATE POLICY "courses_select_admin"
    ON public.courses FOR SELECT USING (public.get_user_role() = 'admin');

CREATE POLICY "courses_insert_teacher"
    ON public.courses FOR INSERT
    WITH CHECK (teacher_id = auth.uid() AND public.get_user_role() IN ('teacher', 'admin'));

CREATE POLICY "courses_update_own_teacher"
    ON public.courses FOR UPDATE
    USING (teacher_id = auth.uid()) WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "courses_update_admin"
    ON public.courses FOR UPDATE USING (public.get_user_role() = 'admin');

CREATE POLICY "courses_delete_own_teacher"
    ON public.courses FOR DELETE USING (teacher_id = auth.uid() AND is_published = false);

CREATE POLICY "courses_delete_admin"
    ON public.courses FOR DELETE USING (public.get_user_role() = 'admin');

-- ============================================================
-- 15. RLS POLICIES — LESSONS
-- ============================================================
CREATE POLICY "lessons_select_enrolled"
    ON public.lessons FOR SELECT
    USING (
        is_published = true AND EXISTS (
            SELECT 1 FROM public.enrollments e
            WHERE e.course_id = lessons.course_id AND e.student_id = auth.uid() AND e.status = 'ACTIVE'
        )
    );

CREATE POLICY "lessons_select_preview"
    ON public.lessons FOR SELECT USING (is_free_preview = true AND is_published = true);

CREATE POLICY "lessons_select_own_teacher"
    ON public.lessons FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.courses c WHERE c.id = lessons.course_id AND c.teacher_id = auth.uid()));

CREATE POLICY "lessons_select_admin"
    ON public.lessons FOR SELECT USING (public.get_user_role() = 'admin');

CREATE POLICY "lessons_insert_teacher"
    ON public.lessons FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND c.teacher_id = auth.uid()));

CREATE POLICY "lessons_update_teacher"
    ON public.lessons FOR UPDATE
    USING (EXISTS (SELECT 1 FROM public.courses c WHERE c.id = lessons.course_id AND c.teacher_id = auth.uid()));

CREATE POLICY "lessons_delete_teacher"
    ON public.lessons FOR DELETE
    USING (EXISTS (SELECT 1 FROM public.courses c WHERE c.id = lessons.course_id AND c.teacher_id = auth.uid()));

CREATE POLICY "lessons_admin_all"
    ON public.lessons FOR ALL USING (public.get_user_role() = 'admin');

-- ============================================================
-- 16. RLS POLICIES — ENROLLMENTS
-- ============================================================
CREATE POLICY "enrollments_select_own"
    ON public.enrollments FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "enrollments_select_teacher"
    ON public.enrollments FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.courses c WHERE c.id = enrollments.course_id AND c.teacher_id = auth.uid()));

CREATE POLICY "enrollments_select_admin"
    ON public.enrollments FOR SELECT USING (public.get_user_role() = 'admin');

CREATE POLICY "enrollments_insert_student"
    ON public.enrollments FOR INSERT WITH CHECK (student_id = auth.uid());

CREATE POLICY "enrollments_insert_admin"
    ON public.enrollments FOR INSERT WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "enrollments_update_own"
    ON public.enrollments FOR UPDATE
    USING (student_id = auth.uid()) WITH CHECK (student_id = auth.uid());

CREATE POLICY "enrollments_admin_all"
    ON public.enrollments FOR ALL USING (public.get_user_role() = 'admin');

-- ============================================================
-- 17. RLS POLICIES — LESSON PROGRESS
-- ============================================================
CREATE POLICY "progress_select_own"
    ON public.lesson_progress FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.enrollments e WHERE e.id = lesson_progress.enrollment_id AND e.student_id = auth.uid()));

CREATE POLICY "progress_select_teacher"
    ON public.lesson_progress FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.enrollments e
        JOIN public.courses c ON c.id = e.course_id
        WHERE e.id = lesson_progress.enrollment_id AND c.teacher_id = auth.uid()
    ));

CREATE POLICY "progress_insert_own"
    ON public.lesson_progress FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.enrollments e WHERE e.id = enrollment_id AND e.student_id = auth.uid()));

CREATE POLICY "progress_update_own"
    ON public.lesson_progress FOR UPDATE
    USING (EXISTS (SELECT 1 FROM public.enrollments e WHERE e.id = lesson_progress.enrollment_id AND e.student_id = auth.uid()));

CREATE POLICY "progress_admin_all"
    ON public.lesson_progress FOR ALL USING (public.get_user_role() = 'admin');

-- ============================================================
-- 18. RLS POLICIES — COMMENTS
-- ============================================================
CREATE POLICY "comments_select_approved"
    ON public.comments FOR SELECT USING (is_approved = true);

CREATE POLICY "comments_select_own"
    ON public.comments FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "comments_select_admin"
    ON public.comments FOR SELECT USING (public.get_user_role() = 'admin');

CREATE POLICY "comments_insert_enrolled"
    ON public.comments FOR INSERT
    WITH CHECK (
        user_id = auth.uid() AND EXISTS (
            SELECT 1 FROM public.enrollments e
            WHERE e.course_id = course_id AND e.student_id = auth.uid() AND e.status IN ('ACTIVE', 'COMPLETED')
        )
    );

CREATE POLICY "comments_update_own"
    ON public.comments FOR UPDATE
    USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "comments_admin_update"
    ON public.comments FOR UPDATE USING (public.get_user_role() = 'admin');

CREATE POLICY "comments_delete_own"
    ON public.comments FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "comments_delete_admin"
    ON public.comments FOR DELETE USING (public.get_user_role() = 'admin');

-- ============================================================
-- 19. RLS POLICIES — NOTIFICATIONS
-- ============================================================
CREATE POLICY "notifications_select_own"
    ON public.notifications FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "notifications_insert_admin"
    ON public.notifications FOR INSERT WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "notifications_update_own"
    ON public.notifications FOR UPDATE
    USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "notifications_delete_own"
    ON public.notifications FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "notifications_delete_admin"
    ON public.notifications FOR DELETE USING (public.get_user_role() = 'admin');

-- ============================================================
-- 20. RLS POLICIES — COURSE CONTENT
-- ============================================================
CREATE POLICY "content_select_enrolled"
    ON public.course_content FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.enrollments e
        WHERE e.course_id = course_content.course_id AND e.student_id = auth.uid() AND e.status = 'ACTIVE'
    ));

CREATE POLICY "content_select_teacher"
    ON public.course_content FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_content.course_id AND c.teacher_id = auth.uid()));

CREATE POLICY "content_select_admin"
    ON public.course_content FOR SELECT USING (public.get_user_role() = 'admin');

CREATE POLICY "content_insert_teacher"
    ON public.course_content FOR INSERT
    WITH CHECK (
        uploaded_by = auth.uid()
        AND EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND c.teacher_id = auth.uid())
    );

CREATE POLICY "content_delete_teacher"
    ON public.course_content FOR DELETE
    USING (EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_content.course_id AND c.teacher_id = auth.uid()));

CREATE POLICY "content_admin_all"
    ON public.course_content FOR ALL USING (public.get_user_role() = 'admin');

-- ============================================================
-- 21. RLS POLICIES — PLATFORM SETTINGS
-- ============================================================
CREATE POLICY "settings_select_all"
    ON public.platform_settings FOR SELECT USING (true);

CREATE POLICY "settings_update_admin"
    ON public.platform_settings FOR UPDATE USING (public.get_user_role() = 'admin');

-- ============================================================
-- 22. STORAGE BUCKETS
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'avatars', 'avatars', true, 2097152,
    ARRAY['image/jpeg', 'image/png', 'image/webp']
);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'course-thumbnails', 'course-thumbnails', true, 5242880,
    ARRAY['image/jpeg', 'image/png', 'image/webp']
);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'course-content', 'course-content', false, 52428800,
    ARRAY['application/pdf', 'audio/mpeg', 'audio/mp3', 'audio/wav',
          'video/mp4', 'video/webm', 'video/quicktime',
          'image/jpeg', 'image/png', 'image/webp', 'image/gif',
          'application/vnd.ms-powerpoint',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
);

-- ============================================================
-- 23. STORAGE POLICIES
-- ============================================================

-- Avatars
CREATE POLICY "avatars_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "avatars_upload_own" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "avatars_update_own" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "avatars_delete_own" ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Course Thumbnails
CREATE POLICY "thumbnails_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'course-thumbnails');
CREATE POLICY "thumbnails_upload_teacher" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'course-thumbnails' AND public.get_user_role() IN ('teacher', 'admin'));
CREATE POLICY "thumbnails_update_teacher" ON storage.objects FOR UPDATE USING (bucket_id = 'course-thumbnails' AND public.get_user_role() IN ('teacher', 'admin'));
CREATE POLICY "thumbnails_delete_teacher" ON storage.objects FOR DELETE USING (bucket_id = 'course-thumbnails' AND public.get_user_role() IN ('teacher', 'admin'));

-- Course Content (private)
CREATE POLICY "content_storage_read_enrolled" ON storage.objects FOR SELECT
    USING (bucket_id = 'course-content' AND (
        public.get_user_role() IN ('teacher', 'admin')
        OR EXISTS (
            SELECT 1 FROM public.enrollments e
            WHERE e.course_id::text = (storage.foldername(name))[1]
            AND e.student_id = auth.uid() AND e.status = 'ACTIVE'
        )
    ));
CREATE POLICY "content_storage_upload_teacher" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'course-content' AND public.get_user_role() IN ('teacher', 'admin'));
CREATE POLICY "content_storage_delete_teacher" ON storage.objects FOR DELETE USING (bucket_id = 'course-content' AND public.get_user_role() IN ('teacher', 'admin'));
-- ============================================================
-- 24. RATE LIMITING SYSTEM
-- ============================================================
CREATE TABLE IF NOT EXISTS public.rate_limits (
    key TEXT PRIMARY KEY,
    count INTEGER NOT NULL DEFAULT 1,
    reset_at TIMESTAMPTZ NOT NULL
);

-- Function to check and increment rate limit
CREATE OR REPLACE FUNCTION public.check_rate_limit(
    p_key TEXT,
    p_limit INTEGER,
    p_window_seconds INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_count INTEGER;
    v_reset_at TIMESTAMPTZ;
BEGIN
    -- Cleanup expired entries periodically (optional, or rely on a cron/worker)
    DELETE FROM public.rate_limits WHERE reset_at < NOW();

    SELECT count, reset_at INTO v_current_count, v_reset_at
    FROM public.rate_limits
    WHERE key = p_key;

    IF NOT FOUND THEN
        INSERT INTO public.rate_limits (key, count, reset_at)
        VALUES (p_key, 1, NOW() + (p_window_seconds || ' seconds')::INTERVAL);
        RETURN TRUE;
    END IF;

    IF v_current_count >= p_limit THEN
        RETURN FALSE;
    END IF;

    UPDATE public.rate_limits
    SET count = count + 1
    WHERE key = p_key;
    
    RETURN TRUE;
END;
$$;

-- ============================================================
-- 25. AUTH METADATA SYNC (Performance Optimization)
-- ============================================================
-- This function syncs profile changes (role, is_active) to auth.users metadata
-- so middleware can access them without extra DB queries.
CREATE OR REPLACE FUNCTION public.sync_profile_to_auth()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE auth.users
  SET raw_user_meta_data = 
    COALESCE(raw_user_meta_data, '{}'::jsonb) || 
    jsonb_build_object(
      'role', NEW.role,
      'is_active', NEW.is_active
    )
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_update_sync_auth
    AFTER UPDATE OF role, is_active ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.sync_profile_to_auth();

-- Initial sync for existing users (run this manually if needed)
-- UPDATE public.profiles SET role = role; 
