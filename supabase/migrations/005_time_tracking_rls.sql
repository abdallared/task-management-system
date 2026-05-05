-- RLS Policies for task_time_entries

-- Users can view time entries for tasks in their groups
CREATE POLICY "Users can view time entries in their groups"
    ON task_time_entries FOR SELECT
    USING (
        task_id IN (
            SELECT id FROM tasks WHERE group_id IN (
                SELECT group_id FROM group_members WHERE user_id = auth.uid()
            )
        )
    );

-- Users can create their own time entries
CREATE POLICY "Users can create their own time entries"
    ON task_time_entries FOR INSERT
    WITH CHECK (
        user_id = auth.uid() AND
        task_id IN (
            SELECT id FROM tasks WHERE group_id IN (
                SELECT group_id FROM group_members WHERE user_id = auth.uid()
            )
        )
    );

-- Users can update their own time entries
CREATE POLICY "Users can update their own time entries"
    ON task_time_entries FOR UPDATE
    USING (user_id = auth.uid());

-- Users can delete their own time entries
CREATE POLICY "Users can delete their own time entries"
    ON task_time_entries FOR DELETE
    USING (user_id = auth.uid());

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_time_entries_task_user ON task_time_entries(task_id, user_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_active ON task_time_entries(task_id, user_id) WHERE end_time IS NULL;

-- Function to prevent multiple active timers per user per task
CREATE OR REPLACE FUNCTION check_active_timer()
RETURNS TRIGGER AS $$
BEGIN
    -- Only check on INSERT when end_time is NULL (starting a timer)
    IF TG_OP = 'INSERT' AND NEW.end_time IS NULL THEN
        -- Check if user already has an active timer for this task
        IF EXISTS (
            SELECT 1 FROM task_time_entries
            WHERE task_id = NEW.task_id
            AND user_id = NEW.user_id
            AND end_time IS NULL
            AND id != NEW.id
        ) THEN
            RAISE EXCEPTION 'User already has an active timer for this task';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce one active timer per user per task
DROP TRIGGER IF EXISTS enforce_single_active_timer ON task_time_entries;
CREATE TRIGGER enforce_single_active_timer
    BEFORE INSERT ON task_time_entries
    FOR EACH ROW
    EXECUTE FUNCTION check_active_timer();

-- Function to validate time entry duration
CREATE OR REPLACE FUNCTION validate_time_entry()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure end_time is after start_time
    IF NEW.end_time IS NOT NULL AND NEW.end_time <= NEW.start_time THEN
        RAISE EXCEPTION 'End time must be after start time';
    END IF;
    
    -- Ensure duration matches the time difference (if both times are set)
    IF NEW.end_time IS NOT NULL AND NEW.start_time IS NOT NULL THEN
        NEW.duration = EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time))::INTEGER;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate time entries
DROP TRIGGER IF EXISTS validate_time_entry_trigger ON task_time_entries;
CREATE TRIGGER validate_time_entry_trigger
    BEFORE INSERT OR UPDATE ON task_time_entries
    FOR EACH ROW
    EXECUTE FUNCTION validate_time_entry();
