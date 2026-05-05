-- Migration: Mention Notifications
-- Description: Create notifications when users are mentioned in comments

-- Function to extract mentions from comment text and create notifications
CREATE OR REPLACE FUNCTION notify_mentions()
RETURNS TRIGGER AS $$
DECLARE
    task_title TEXT;
    commenter_email TEXT;
    group_id_val UUID;
    mention_pattern TEXT := '@([^\s@]+(?:\s+[^\s@]+)*)';
    mention_match TEXT;
    mentioned_user_id UUID;
    mentioned_user_record RECORD;
BEGIN
    -- Get task details
    SELECT title, group_id INTO task_title, group_id_val
    FROM tasks WHERE id = NEW.task_id;
    
    -- Get commenter email
    SELECT email INTO commenter_email
    FROM auth.users WHERE id = NEW.user_id;
    
    -- Find all mentions in the comment using regex
    FOR mention_match IN 
        SELECT regexp_matches(NEW.content, mention_pattern, 'g') AS match
    LOOP
        -- Extract the mentioned name (without @)
        DECLARE
            mentioned_name TEXT := mention_match;
        BEGIN
            -- Try to find user by full name or email in group members
            FOR mentioned_user_record IN
                SELECT gm.user_id, u.email, u.raw_user_meta_data->>'full_name' as full_name
                FROM group_members gm
                JOIN auth.users u ON u.id = gm.user_id
                WHERE gm.group_id = group_id_val
                AND (
                    LOWER(u.email) = LOWER(mentioned_name) OR
                    LOWER(u.raw_user_meta_data->>'full_name') = LOWER(mentioned_name)
                )
                AND gm.user_id != NEW.user_id  -- Don't notify the commenter
            LOOP
                -- Create notification for mentioned user
                INSERT INTO notifications (user_id, type, title, message, link)
                VALUES (
                    mentioned_user_record.user_id,
                    'task_mention',
                    'You were mentioned',
                    commenter_email || ' mentioned you in: ' || task_title,
                    '/groups/' || group_id_val || '/tasks/' || NEW.task_id
                )
                ON CONFLICT DO NOTHING;  -- Prevent duplicate notifications
            END LOOP;
        END;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for mentions in comments
DROP TRIGGER IF EXISTS trigger_notify_mentions ON task_comments;
CREATE TRIGGER trigger_notify_mentions
    AFTER INSERT ON task_comments
    FOR EACH ROW
    EXECUTE FUNCTION notify_mentions();

-- Update the existing comment notification function to not notify mentioned users
-- (they'll get a mention notification instead)
CREATE OR REPLACE FUNCTION notify_task_comment()
RETURNS TRIGGER AS $$
DECLARE
    task_title TEXT;
    commenter_email TEXT;
    group_id_val UUID;
    assignee_id UUID;
    mention_pattern TEXT := '@([^\s@]+(?:\s+[^\s@]+)*)';
    mentioned_user_ids UUID[];
BEGIN
    -- Get task details
    SELECT title, group_id INTO task_title, group_id_val
    FROM tasks WHERE id = NEW.task_id;
    
    -- Get commenter email
    SELECT email INTO commenter_email
    FROM auth.users WHERE id = NEW.user_id;
    
    -- Get list of mentioned user IDs to exclude from general comment notification
    SELECT ARRAY_AGG(DISTINCT gm.user_id)
    INTO mentioned_user_ids
    FROM group_members gm
    JOIN auth.users u ON u.id = gm.user_id
    WHERE gm.group_id = group_id_val
    AND (
        NEW.content ~* ('@' || u.email) OR
        NEW.content ~* ('@' || u.raw_user_meta_data->>'full_name')
    );
    
    -- Notify all assigned users (except the commenter and mentioned users)
    FOR assignee_id IN 
        SELECT user_id FROM task_assignments 
        WHERE task_id = NEW.task_id 
        AND user_id != NEW.user_id
        AND (mentioned_user_ids IS NULL OR user_id != ALL(mentioned_user_ids))
    LOOP
        INSERT INTO notifications (user_id, type, title, message, link)
        VALUES (
            assignee_id,
            'task_comment',
            'New comment on task',
            commenter_email || ' commented on: ' || task_title,
            '/groups/' || group_id_val || '/tasks/' || NEW.task_id
        );
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
