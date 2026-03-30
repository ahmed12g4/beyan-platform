-- ==========================================
-- BEYAN PLATFORM: CRITICAL DATABASE FIXES
-- 1. Fix Phone Synchronization (Auth -> Profile)
-- 2. Fix Session Recordings (Add Column + RLS)
-- ==========================================

-- ---------------------------------------------------------
-- 1. PHONE SYNCHRONIZATION FIX
-- ---------------------------------------------------------

-- Function to handle profile creation/update on signup or sync
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role, phone, is_active)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    NEW.raw_user_meta_data->>'phone',
    CASE 
      WHEN (NEW.raw_user_meta_data->>'role') = 'teacher' THEN false 
      ELSE true 
    END
  )
  ON CONFLICT (id) DO UPDATE SET
    phone = EXCLUDED.phone,
    full_name = CASE WHEN profiles.full_name = '' THEN EXCLUDED.full_name ELSE profiles.full_name END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-create the trigger for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update the profile update handler to sync 'phone' back to auth
CREATE OR REPLACE FUNCTION public.handle_profile_updated() 
RETURNS TRIGGER AS $$
BEGIN
  UPDATE auth.users
  SET raw_user_meta_data = 
    COALESCE(raw_user_meta_data, '{}'::jsonb) || 
    jsonb_build_object(
      'role', NEW.role,
      'is_active', NEW.is_active,
      'full_name', NEW.full_name,
      'phone', NEW.phone
    )
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---------------------------------------------------------
-- 2. LIVE SESSION RECORDING FIX
-- ---------------------------------------------------------

-- Add recording_url and status columns if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM medical_columns WHERE table_name = 'live_sessions' AND column_name = 'recording_url') THEN
        ALTER TABLE public.live_sessions ADD COLUMN recording_url TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM medical_columns WHERE table_name = 'live_sessions' AND column_name = 'status') THEN
        ALTER TABLE public.live_sessions ADD COLUMN status TEXT DEFAULT 'SCHEDULED';
    END IF;
END $$;

-- Enable RLS (Should be already enabled, but let's be sure)
ALTER TABLE public.live_sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing restricted policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Teachers can update recording_url" ON public.live_sessions;

-- Create policy to allow teachers to update their own sessions
CREATE POLICY "Teachers can update recording_url"
ON public.live_sessions
FOR UPDATE
USING (
  teacher_id = auth.uid()
)
WITH CHECK (
  teacher_id = auth.uid()
);

-- Ensure everyone can view session metadata (for recording links)
DROP POLICY IF EXISTS "Sessions are viewable by everyone" ON public.live_sessions;
CREATE POLICY "Sessions are viewable by everyone"
ON public.live_sessions
FOR SELECT
TO authenticated, anon
USING (true);
