-- Add recording_url to live_sessions
ALTER TABLE public.live_sessions 
ADD COLUMN IF NOT EXISTS recording_url TEXT;

-- Policy to allow teachers to update recording_url for their sessions
CREATE POLICY "Teachers can update recording_url"
ON public.live_sessions
FOR UPDATE
USING (
  teacher_id = auth.uid()
)
WITH CHECK (
  teacher_id = auth.uid()
);
