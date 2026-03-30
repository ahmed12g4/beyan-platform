-- Ensure platform_settings table exists
CREATE TABLE IF NOT EXISTS platform_settings (
    id SERIAL PRIMARY KEY,
    site_name TEXT NOT NULL DEFAULT 'Beyan Dil Akademi',
    site_description TEXT,
    contact_email TEXT,
    support_email TEXT,
    max_enrollments_per_user INTEGER DEFAULT 5,
    allow_new_registrations BOOLEAN DEFAULT TRUE,
    maintenance_mode BOOLEAN DEFAULT FALSE,
    announcement_bar_enabled BOOLEAN DEFAULT FALSE,
    announcement_text TEXT,
    announcement_color TEXT DEFAULT '#204544',
    whatsapp_enabled BOOLEAN DEFAULT TRUE,
    whatsapp_number TEXT,
    whatsapp_message TEXT,
    logo_url TEXT,
    favicon_url TEXT,
    hero_title TEXT,
    hero_description TEXT,
    hero_image_url TEXT,
    footer_description TEXT,
    footer_copyright TEXT,
    contact_phone TEXT,
    contact_address TEXT,
    social_links JSONB DEFAULT '{}'::jsonb,
    social_facebook TEXT,
    social_instagram TEXT,
    social_linkedin TEXT,
    social_whatsapp TEXT,
    features_section JSONB DEFAULT '[]'::jsonb,
    testimonials_section JSONB DEFAULT '[]'::jsonb,
    founder_section JSONB DEFAULT '{}'::jsonb,
    stats_courses_count INTEGER DEFAULT 0,
    stats_students_count INTEGER DEFAULT 0,
    stats_satisfaction_rate INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure at least one row exists
INSERT INTO platform_settings (id, site_name)
VALUES (1, 'Beyan Dil Akademi')
ON CONFLICT (id) DO NOTHING;

-- Add new customization columns if they don't exist
ALTER TABLE platform_settings
ADD COLUMN IF NOT EXISTS hero_cta_text TEXT DEFAULT 'Hemen Başla',
ADD COLUMN IF NOT EXISTS hero_cta_link TEXT DEFAULT '/kayit',
ADD COLUMN IF NOT EXISTS hero_cta_visible BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS announcement_marquee BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS announcement_text_color TEXT DEFAULT '#ffffff',
ADD COLUMN IF NOT EXISTS qr_code_url TEXT;
