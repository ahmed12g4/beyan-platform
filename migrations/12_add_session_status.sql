-- Add status column to live_sessions for smart tracking
-- Values: 'SCHEDULED', 'LIVE', 'ENDED'

ALTER TABLE public.live_sessions 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'LIVE', 'ENDED'));

-- Index for faster filtering of LIVE sessions
CREATE INDEX IF NOT EXISTS idx_live_sessions_status ON public.live_sessions(status);

-- Update RLS if necessary (currently public/enrolled check is fine)
