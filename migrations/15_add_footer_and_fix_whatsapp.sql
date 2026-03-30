-- Add footer_copyright to platform_settings
ALTER TABLE platform_settings 
ADD COLUMN IF NOT EXISTS footer_copyright TEXT DEFAULT '© 2024 Beyan Dil Akademi. Tüm hakları saklıdır.';

-- Ensure show_whatsapp exists in profiles (Fixing the save error)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS show_whatsapp BOOLEAN DEFAULT TRUE;

-- Update the handle_new_user function to include show_whatsapp default if needed (optional since default is on column)
