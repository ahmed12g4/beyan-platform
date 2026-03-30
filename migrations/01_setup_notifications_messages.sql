-- ==========================================
-- 1. NOTIFICATIONS TABLE SETUP
-- ==========================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'SYSTEM' CHECK (type IN ('ENROLLMENT', 'COURSE_UPDATE', 'LIVE_SESSION', 'ACHIEVEMENT', 'COMMENT', 'SUBSCRIPTION', 'SYSTEM')),
    link TEXT,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Safely add newer columns in case the table was created by older schemas
DO $$ 
BEGIN 
    BEGIN
        ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
    EXCEPTION WHEN duplicate_column THEN END;
    
    BEGIN
        ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS batch_id UUID;
    EXCEPTION WHEN duplicate_column THEN END;
    
    BEGIN
        ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS metadata JSONB;
    EXCEPTION WHEN duplicate_column THEN END;
END $$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_batch_id ON public.notifications(batch_id);

-- RLS Policies
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
    DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
    DROP POLICY IF EXISTS "Admins can view all notifications" ON public.notifications;
    DROP POLICY IF EXISTS "Admins can insert notifications" ON public.notifications;
    DROP POLICY IF EXISTS "Admins can delete notifications" ON public.notifications;
    DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
    DROP POLICY IF EXISTS "notifications_insert_admin" ON public.notifications;
    DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
    DROP POLICY IF EXISTS "notifications_delete_own" ON public.notifications;
    DROP POLICY IF EXISTS "notifications_delete_admin" ON public.notifications;
EXCEPTION WHEN OTHERS THEN END $$;

CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all notifications" ON public.notifications FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);
CREATE POLICY "Admins can insert notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);
CREATE POLICY "Admins can delete notifications" ON public.notifications FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- ==========================================
-- 2. MESSAGES TABLE SETUP
-- ==========================================
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_read ON public.messages(receiver_id, is_read);

-- RLS Policies
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can view their own messages" ON public.messages;
    DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
    DROP POLICY IF EXISTS "Receivers can mark messages as read" ON public.messages;
    DROP POLICY IF EXISTS "Admins can see all messages" ON public.messages;
    -- Also drop from other files:
    DROP POLICY IF EXISTS "messages_insert_own" ON public.messages;
    DROP POLICY IF EXISTS "messages_select_own" ON public.messages;
    DROP POLICY IF EXISTS "messages_update_received" ON public.messages;
    DROP POLICY IF EXISTS "messages_select_admin" ON public.messages;
EXCEPTION WHEN OTHERS THEN END $$;

CREATE POLICY "Users can view their own messages" ON public.messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can send messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Receivers can mark messages as read" ON public.messages FOR UPDATE USING (auth.uid() = receiver_id);
CREATE POLICY "Admins can see all messages" ON public.messages FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ==========================================
-- 3. OPTIMIZED RPC FUNCTIONS
-- ==========================================
-- Create RPC for sending broadcasts directly within DB.
CREATE OR REPLACE FUNCTION send_broadcast(
    p_title TEXT,
    p_message TEXT,
    p_target_role TEXT,
    p_sender_id UUID,
    p_link TEXT,
    p_type TEXT,
    p_batch_id UUID
) RETURNS void AS $$
BEGIN
    IF p_target_role = 'all' THEN
        INSERT INTO public.notifications(user_id, sender_id, title, message, link, type, batch_id)
        SELECT id, p_sender_id, p_title, p_message, p_link, p_type, p_batch_id
        FROM public.profiles;
    ELSIF p_target_role IN ('student', 'teacher') THEN
        INSERT INTO public.notifications(user_id, sender_id, title, message, link, type, batch_id)
        SELECT id, p_sender_id, p_title, p_message, p_link, p_type, p_batch_id
        FROM public.profiles
        WHERE role = p_target_role;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create RPC for grouping and returning admin broadcasts.
CREATE OR REPLACE FUNCTION get_admin_broadcasts(p_admin_id UUID)
RETURNS TABLE (
    batch_id UUID,
    title TEXT,
    message TEXT,
    type TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    recipient_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        n.batch_id,
        MAX(n.title)::TEXT as title,
        MAX(n.message)::TEXT as message,
        MAX(n.type)::TEXT as type,
        MIN(n.created_at) as created_at,
        COUNT(n.id) as recipient_count
    FROM public.notifications n
    WHERE n.sender_id = p_admin_id AND n.batch_id IS NOT NULL
    GROUP BY n.batch_id
    ORDER BY MIN(n.created_at) DESC;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 4. ENABLE REALTIME
-- ==========================================
-- This block automatically enables Supabase Realtime for the required tables
DO $$
BEGIN
    -- Enable realtime for the messages table
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    END IF;

    -- Enable realtime for the notifications table
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'notifications'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    END IF;
END $$;

