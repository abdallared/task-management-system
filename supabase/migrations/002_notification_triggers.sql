-- Migration: Notification Triggers
-- Description: Automatically create notifications for various events

-- Function to create notification for task assignment
CREATE OR REPLACE FUNCTION notify_task_assignment()
RETURNS TRIGGER AS $$
DECLARE
    task_title TEXT;
    assigner_email TEXT;
    group_id_val UUID;
BEGIN
    -- Get task details
    SELECT title, group_id INTO task_title, group_id_val
    FROM tasks WHERE id = NEW.task_id;
    
    -- Get assigner email
    SELECT email INTO assigner_email
    FROM auth.users WHERE id = NEW.assigned_by;
    
    -- Don't notify if user assigned themselves
    IF NEW.user_id = NEW.assigned_by THEN
        RETURN NEW;
    END IF;
    
    -- Create notification
    INSERT INTO notifications (user_id, type, title, message, link)
    VALUES (
        NEW.user_id,
        'task_assigned',
        'New task assigned',
        assigner_email || ' assigned you to: ' || task_title,
        '/groups/' || group_id_val || '/tasks/' || NEW.task_id
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for task assignments
DROP TRIGGER IF EXISTS trigger_notify_task_assignment ON task_assignments;
CREATE TRIGGER trigger_notify_task_assignment
    AFTER INSERT ON task_assignments
    FOR EACH ROW
    EXECUTE FUNCTION notify_task_assignment();

-- Function to create notification for task comments
CREATE OR REPLACE FUNCTION notify_task_comment()
RETURNS TRIGGER AS $$
DECLARE
    task_title TEXT;
    commenter_email TEXT;
    group_id_val UUID;
    assignee_id UUID;
BEGIN
    -- Get task details
    SELECT title, group_id INTO task_title, group_id_val
    FROM tasks WHERE id = NEW.task_id;
    
    -- Get commenter email
    SELECT email INTO commenter_email
    FROM auth.users WHERE id = NEW.user_id;
    
    -- Notify all assigned users (except the commenter)
    FOR assignee_id IN 
        SELECT user_id FROM task_assignments 
        WHERE task_id = NEW.task_id AND user_id != NEW.user_id
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

-- Trigger for task comments
DROP TRIGGER IF EXISTS trigger_notify_task_comment ON task_comments;
CREATE TRIGGER trigger_notify_task_comment
    AFTER INSERT ON task_comments
    FOR EACH ROW
    EXECUTE FUNCTION notify_task_comment();

-- Function to create notification for task status changes
CREATE OR REPLACE FUNCTION notify_task_status_change()
RETURNS TRIGGER AS $$
DECLARE
    task_title TEXT;
    group_id_val UUID;
    assignee_id UUID;
    updater_email TEXT;
BEGIN
    -- Only notify if status actually changed
    IF OLD.status = NEW.status THEN
        RETURN NEW;
    END IF;
    
    -- Get task details
    SELECT title, group_id INTO task_title, group_id_val
    FROM tasks WHERE id = NEW.id;
    
    -- Get updater email (from current user)
    SELECT email INTO updater_email
    FROM auth.users WHERE id = auth.uid();
    
    -- Notify all assigned users (except the one who made the change)
    FOR assignee_id IN 
        SELECT user_id FROM task_assignments 
        WHERE task_id = NEW.id AND user_id != auth.uid()
    LOOP
        INSERT INTO notifications (user_id, type, title, message, link)
        VALUES (
            assignee_id,
            'task_status_changed',
            'Task status updated',
            updater_email || ' changed "' || task_title || '" to ' || NEW.status,
            '/groups/' || group_id_val || '/tasks/' || NEW.id
        );
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for task status changes
DROP TRIGGER IF EXISTS trigger_notify_task_status_change ON tasks;
CREATE TRIGGER trigger_notify_task_status_change
    AFTER UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION notify_task_status_change();

-- Function to create notification for group invitations
CREATE OR REPLACE FUNCTION notify_group_invitation()
RETURNS TRIGGER AS $$
DECLARE
    group_name TEXT;
    inviter_email TEXT;
BEGIN
    -- Get group name
    SELECT name INTO group_name
    FROM groups WHERE id = NEW.group_id;
    
    -- Get inviter email
    SELECT email INTO inviter_email
    FROM auth.users WHERE id = NEW.invited_by;
    
    -- Create notification
    INSERT INTO notifications (user_id, type, title, message, link)
    VALUES (
        NEW.user_id,
        'group_invitation',
        'Group invitation',
        inviter_email || ' invited you to join: ' || group_name,
        '/groups/' || NEW.group_id
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for group invitations
DROP TRIGGER IF EXISTS trigger_notify_group_invitation ON group_members;
CREATE TRIGGER trigger_notify_group_invitation
    AFTER INSERT ON group_members
    FOR EACH ROW
    WHEN (NEW.role = 'member')
    EXECUTE FUNCTION notify_group_invitation();

-- Add index for faster notification queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Add RLS policies for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
CREATE POLICY "Users can view their own notifications"
    ON notifications FOR SELECT
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Users can update their own notifications"
    ON notifications FOR UPDATE
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;
CREATE POLICY "Users can delete their own notifications"
    ON notifications FOR DELETE
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "System can create notifications" ON notifications;
CREATE POLICY "System can create notifications"
    ON notifications FOR INSERT
    WITH CHECK (true);
