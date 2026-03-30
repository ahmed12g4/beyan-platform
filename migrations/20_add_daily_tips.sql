-- Migration for adding tips columns to platform_settings
ALTER TABLE platform_settings
ADD COLUMN IF NOT EXISTS student_tips JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS teacher_tips JSONB DEFAULT '[]'::jsonb;
