-- Trigger to sync profile changes to auth.users metadata
-- This ensures that when you update 'role' or 'is_active' in profiles, 
-- it automatically updates the user's session metadata.

CREATE OR REPLACE FUNCTION public.handle_profile_updated() 
RETURNS TRIGGER AS $$
BEGIN
  UPDATE auth.users
  SET raw_user_meta_data = 
    COALESCE(raw_user_meta_data, '{}'::jsonb) || 
    jsonb_build_object(
      'role', NEW.role,
      'is_active', NEW.is_active,
      'full_name', NEW.full_name
    )
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_updated ON public.profiles;

CREATE TRIGGER on_profile_updated
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_profile_updated();
