-- Migration: Dependency Blocking
-- Description: Prevent marking tasks as done when dependencies are incomplete

-- Function to check if task can be marked as done
CREATE OR REPLACE FUNCTION check_task_dependencies()
RETURNS TRIGGER AS $$
DECLARE
    incomplete_deps INTEGER;
BEGIN
    -- Only check if status is being changed to 'done'
    IF NEW.status = 'done' AND (OLD.status IS NULL OR OLD.status != 'done') THEN
        -- Count incomplete dependencies
        SELECT COUNT(*)
        INTO incomplete_deps
        FROM task_dependencies td
        JOIN tasks t ON t.id = td.depends_on_task_id
        WHERE td.task_id = NEW.id
        AND t.status != 'done';

        -- If there are incomplete dependencies, prevent the update
        IF incomplete_deps > 0 THEN
            RAISE EXCEPTION 'Cannot mark task as done: % incomplete dependencies', incomplete_deps
                USING HINT = 'Complete all dependent tasks first';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to check dependencies before updating task status
DROP TRIGGER IF EXISTS trigger_check_task_dependencies ON tasks;
CREATE TRIGGER trigger_check_task_dependencies
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION check_task_dependencies();

-- Function to prevent circular dependencies
CREATE OR REPLACE FUNCTION prevent_circular_dependency()
RETURNS TRIGGER AS $$
DECLARE
    circular_found BOOLEAN;
BEGIN
    -- Check if adding this dependency would create a circular dependency
    -- by checking if depends_on_task_id has a path back to task_id
    WITH RECURSIVE dependency_chain AS (
        -- Start with the new dependency
        SELECT NEW.depends_on_task_id AS task_id, 1 AS depth
        
        UNION ALL
        
        -- Follow the chain of dependencies
        SELECT td.depends_on_task_id, dc.depth + 1
        FROM task_dependencies td
        JOIN dependency_chain dc ON dc.task_id = td.task_id
        WHERE dc.depth < 10  -- Prevent infinite recursion
    )
    SELECT EXISTS (
        SELECT 1 FROM dependency_chain WHERE task_id = NEW.task_id
    ) INTO circular_found;

    IF circular_found THEN
        RAISE EXCEPTION 'Cannot add dependency: would create a circular dependency'
            USING HINT = 'Task dependencies must form a directed acyclic graph (DAG)';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to prevent circular dependencies
DROP TRIGGER IF EXISTS trigger_prevent_circular_dependency ON task_dependencies;
CREATE TRIGGER trigger_prevent_circular_dependency
    BEFORE INSERT ON task_dependencies
    FOR EACH ROW
    EXECUTE FUNCTION prevent_circular_dependency();

-- Add index for faster dependency queries
CREATE INDEX IF NOT EXISTS idx_task_dependencies_task_id ON task_dependencies(task_id);
CREATE INDEX IF NOT EXISTS idx_task_dependencies_depends_on_task_id ON task_dependencies(depends_on_task_id);

-- Add RLS policies for task_dependencies
ALTER TABLE task_dependencies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view dependencies in their groups" ON task_dependencies;
CREATE POLICY "Users can view dependencies in their groups"
    ON task_dependencies FOR SELECT
    USING (
        task_id IN (
            SELECT id FROM tasks WHERE group_id IN (
                SELECT group_id FROM group_members WHERE user_id = auth.uid()
            )
        )
    );

DROP POLICY IF EXISTS "Members can create dependencies" ON task_dependencies;
CREATE POLICY "Members can create dependencies"
    ON task_dependencies FOR INSERT
    WITH CHECK (
        task_id IN (
            SELECT id FROM tasks WHERE group_id IN (
                SELECT group_id FROM group_members 
                WHERE user_id = auth.uid() 
                AND role IN ('owner', 'admin', 'member')
            )
        )
    );

DROP POLICY IF EXISTS "Members can delete dependencies" ON task_dependencies;
CREATE POLICY "Members can delete dependencies"
    ON task_dependencies FOR DELETE
    USING (
        task_id IN (
            SELECT id FROM tasks WHERE group_id IN (
                SELECT group_id FROM group_members 
                WHERE user_id = auth.uid() 
                AND role IN ('owner', 'admin', 'member')
            )
        )
    );
