-- Add show_whatsapp preference to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS show_whatsapp BOOLEAN DEFAULT TRUE;

-- Update existing profiles to have it enabled by default
UPDATE profiles SET show_whatsapp = TRUE WHERE show_whatsapp IS NULL;
