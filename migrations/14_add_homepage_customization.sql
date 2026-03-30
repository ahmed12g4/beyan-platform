-- Add customization fields for Homepage Hero, Announcement Bar, and Footer QR
ALTER TABLE platform_settings
ADD COLUMN IF NOT EXISTS hero_cta_text TEXT DEFAULT 'Hemen Başla',
ADD COLUMN IF NOT EXISTS hero_cta_link TEXT DEFAULT '/kayit',
ADD COLUMN IF NOT EXISTS hero_cta_visible BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS announcement_marquee BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS announcement_text_color TEXT DEFAULT '#ffffff',
ADD COLUMN IF NOT EXISTS qr_code_url TEXT;
