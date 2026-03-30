-- migrations/30_quiz_and_assignment_refinements.sql

-- Link Quizzes to Lessons
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE;

-- Link Assignments to Lessons
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE;

-- Add RLS policies for Quizzes
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Teachers can manage quizzes for their courses') THEN
        CREATE POLICY "Teachers can manage quizzes for their courses" ON quizzes
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM courses c WHERE c.id = quizzes.course_id AND c.teacher_id = auth.uid()
                )
            );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Students can view quizzes they are enrolled in') THEN
        CREATE POLICY "Students can view quizzes they are enrolled in" ON quizzes
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM enrollments e WHERE e.course_id = quizzes.course_id AND e.student_id = auth.uid()
                )
            );
    END IF;
END $$;

-- Add RLS policies for Quiz Questions
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Teachers can manage quiz questions') THEN
        CREATE POLICY "Teachers can manage quiz questions" ON quiz_questions
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM quizzes q
                    JOIN courses c ON c.id = q.course_id
                    WHERE q.id = quiz_questions.quiz_id AND c.teacher_id = auth.uid()
                )
            );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Students can view quiz questions') THEN
        CREATE POLICY "Students can view quiz questions" ON quiz_questions
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM enrollments e
                    JOIN quizzes q ON q.course_id = e.course_id
                    WHERE q.id = quiz_questions.quiz_id AND e.student_id = auth.uid()
                )
            );
    END IF;
END $$;

-- Add RLS policies for Quiz Results
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Students can view and create their own quiz results') THEN
        CREATE POLICY "Students can view and create their own quiz results" ON quiz_results
            FOR ALL USING (student_id = auth.uid());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Teachers can view quiz results for their courses') THEN
        CREATE POLICY "Teachers can view quiz results for their courses" ON quiz_results
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM quizzes q
                    JOIN courses c ON c.id = q.course_id
                    WHERE q.id = quiz_results.quiz_id AND c.teacher_id = auth.uid()
                )
            );
    END IF;
END $$;
