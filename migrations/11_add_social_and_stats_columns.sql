-- Add social_whatsapp column if it doesn't exist
ALTER TABLE public.platform_settings 
ADD COLUMN IF NOT EXISTS social_whatsapp text;

-- Add stats columns if they don't exist
ALTER TABLE public.platform_settings 
ADD COLUMN IF NOT EXISTS stats_courses_count integer DEFAULT 900;

ALTER TABLE public.platform_settings 
ADD COLUMN IF NOT EXISTS stats_students_count integer DEFAULT 75;

ALTER TABLE public.platform_settings 
ADD COLUMN IF NOT EXISTS stats_satisfaction_rate integer DEFAULT 100;

-- Notify user to run this in SQL Editor
COMMENT ON COLUMN public.platform_settings.stats_courses_count IS 'Dynamic course count for homepage';
COMMENT ON COLUMN public.platform_settings.stats_students_count IS 'Dynamic student count for homepage';
COMMENT ON COLUMN public.platform_settings.stats_satisfaction_rate IS 'Dynamic satisfaction rate for homepage';
