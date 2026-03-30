-- Add "How It Works" section columns to platform_settings

ALTER TABLE platform_settings
ADD COLUMN IF NOT EXISTS how_it_works_title TEXT DEFAULT 'Beyan Dil Akademi Nasıl Çalışır?',
ADD COLUMN IF NOT EXISTS how_it_works_subtitle TEXT DEFAULT 'Birkaç basit adımda Arapça öğrenme yolculuğunuza başlayın.',
ADD COLUMN IF NOT EXISTS how_it_works_section JSONB DEFAULT '[]'::jsonb;
