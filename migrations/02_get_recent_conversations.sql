-- Optimize fetching recent conversations for the Messages Page
-- This replaces the N+1 queries from the frontend into a single fast DB operation

CREATE OR REPLACE FUNCTION get_recent_conversations(p_user_id UUID, p_limit INT DEFAULT 20)
RETURNS TABLE (
    user_id UUID,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT,
    email TEXT,
    last_message_id UUID,
    last_message_content TEXT,
    last_message_created_at TIMESTAMP WITH TIME ZONE,
    last_message_sender_id UUID,
    unread_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH UserConversations AS (
        SELECT 
            CASE 
                WHEN sender_id = p_user_id THEN receiver_id 
                ELSE sender_id 
            END AS contact_id,
            MAX(created_at) AS last_msg_time
        FROM public.messages
        WHERE sender_id = p_user_id OR receiver_id = p_user_id
        GROUP BY 
            CASE 
                WHEN sender_id = p_user_id THEN receiver_id 
                ELSE sender_id 
            END
    ),
    LatestMessages AS (
        SELECT 
            m.id,
            m.content,
            m.created_at,
            m.sender_id,
            uc.contact_id
        FROM UserConversations uc
        JOIN public.messages m ON (
            (m.sender_id = p_user_id AND m.receiver_id = uc.contact_id) OR
            (m.sender_id = uc.contact_id AND m.receiver_id = p_user_id)
        ) AND m.created_at = uc.last_msg_time
    ),
    UnreadCounts AS (
        SELECT 
            sender_id AS contact_id,
            COUNT(*) AS unread_qty
        FROM public.messages
        WHERE receiver_id = p_user_id AND is_read = false
        GROUP BY sender_id
    )
    SELECT 
        p.id AS user_id,
        p.full_name,
        p.avatar_url,
        p.role,
        p.email,
        lm.id AS last_message_id,
        lm.content AS last_message_content,
        lm.created_at AS last_message_created_at,
        lm.sender_id AS last_message_sender_id,
        COALESCE(ucnt.unread_qty, 0) AS unread_count
    FROM UserConversations uc
    JOIN public.profiles p ON p.id = uc.contact_id
    JOIN LatestMessages lm ON lm.contact_id = uc.contact_id
    LEFT JOIN UnreadCounts ucnt ON ucnt.contact_id = uc.contact_id
    ORDER BY lm.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
