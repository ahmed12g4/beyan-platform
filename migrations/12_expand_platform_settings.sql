-- Expand platform_settings table to support dynamic content

ALTER TABLE public.platform_settings
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS favicon_url TEXT,
ADD COLUMN IF NOT EXISTS hero_title TEXT,
ADD COLUMN IF NOT EXISTS hero_description TEXT,
ADD COLUMN IF NOT EXISTS hero_image_url TEXT,
ADD COLUMN IF NOT EXISTS footer_description TEXT,
ADD COLUMN IF NOT EXISTS contact_phone TEXT,
ADD COLUMN IF NOT EXISTS contact_address TEXT,
ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS features_section JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS testimonials_section JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS founder_section JSONB DEFAULT '{}'::jsonb;

-- Comment on columns for clarity
COMMENT ON COLUMN public.platform_settings.social_links IS 'Array of { platform: string, url: string, icon: string }';
COMMENT ON COLUMN public.platform_settings.features_section IS 'Array of { title: string, description: string, icon: string }';
COMMENT ON COLUMN public.platform_settings.testimonials_section IS 'Array of { name: string, role: string, comment: string, avatar_url: string, rating: number }';
COMMENT ON COLUMN public.platform_settings.founder_section IS 'Object with { name: string, title: string, bio: string, image_url: string }';
