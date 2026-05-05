-- Migration: Add Roles System
-- Description: Add system admin role and update group member roles to support project_manager

-- Add system_role column to auth.users metadata (using profiles table)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255),
    avatar_url TEXT,
    system_role VARCHAR(20) CHECK (system_role IN ('admin', 'user')) DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view all profiles"
    ON user_profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can update their own profile"
    ON user_profiles FOR UPDATE
    USING (id = auth.uid());

CREATE POLICY "System admin can update any profile"
    ON user_profiles FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND system_role = 'admin'
        )
    );

CREATE POLICY "System admin can insert profiles"
    ON user_profiles FOR INSERT
    WITH CHECK (
        id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND system_role = 'admin'
        )
    );

-- Update group_members role to include project_manager
ALTER TABLE group_members DROP CONSTRAINT IF EXISTS group_members_role_check;
ALTER TABLE group_members ADD CONSTRAINT group_members_role_check 
    CHECK (role IN ('owner', 'admin', 'project_manager', 'member', 'viewer'));

-- Update group_invitations role to include project_manager
ALTER TABLE group_invitations DROP CONSTRAINT IF EXISTS group_invitations_role_check;
ALTER TABLE group_invitations ADD CONSTRAINT group_invitations_role_check 
    CHECK (role IN ('admin', 'project_manager', 'member', 'viewer'));

-- Create index for system_role
CREATE INDEX idx_user_profiles_system_role ON user_profiles(system_role);

-- Function to check if user is system admin
CREATE OR REPLACE FUNCTION is_system_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = user_id AND system_role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check user role in group
CREATE OR REPLACE FUNCTION get_user_group_role(user_id UUID, group_id UUID)
RETURNS VARCHAR AS $$
DECLARE
    user_role VARCHAR;
BEGIN
    SELECT role INTO user_role
    FROM group_members
    WHERE group_members.user_id = user_id 
    AND group_members.group_id = group_id;
    
    RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS Policies for tasks to support new roles

-- Drop old policies
DROP POLICY IF EXISTS "Members can create tasks" ON tasks;
DROP POLICY IF EXISTS "Members can update tasks" ON tasks;
DROP POLICY IF EXISTS "Admins can delete tasks" ON tasks;

-- Create new policies with project_manager support
CREATE POLICY "Members and project managers can create tasks"
    ON tasks FOR INSERT
    WITH CHECK (
        is_system_admin(auth.uid()) OR
        group_id IN (
            SELECT group_id FROM group_members 
            WHERE user_id = auth.uid() 
            AND role IN ('owner', 'admin', 'project_manager', 'member')
        )
    );

CREATE POLICY "Project managers and above can update tasks"
    ON tasks FOR UPDATE
    USING (
        is_system_admin(auth.uid()) OR
        group_id IN (
            SELECT group_id FROM group_members 
            WHERE user_id = auth.uid() 
            AND role IN ('owner', 'admin', 'project_manager')
        )
    );

CREATE POLICY "Project managers and above can delete tasks"
    ON tasks FOR DELETE
    USING (
        is_system_admin(auth.uid()) OR
        group_id IN (
            SELECT group_id FROM group_members 
            WHERE user_id = auth.uid() 
            AND role IN ('owner', 'admin', 'project_manager')
        )
    );

-- Update groups policies to support system admin
DROP POLICY IF EXISTS "Owners and admins can update groups" ON groups;

CREATE POLICY "Owners, admins, and system admin can update groups"
    ON groups FOR UPDATE
    USING (
        is_system_admin(auth.uid()) OR
        id IN (
            SELECT group_id FROM group_members 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

CREATE POLICY "System admin can delete groups"
    ON groups FOR DELETE
    USING (is_system_admin(auth.uid()));

-- Update group_members policies to support system admin
DROP POLICY IF EXISTS "Owners and admins can manage members" ON group_members;

CREATE POLICY "Owners, admins, and system admin can manage members"
    ON group_members FOR ALL
    USING (
        is_system_admin(auth.uid()) OR
        group_id IN (
            SELECT group_id FROM group_members 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- System admin can view all groups
CREATE POLICY "System admin can view all groups"
    ON groups FOR SELECT
    USING (is_system_admin(auth.uid()));

-- System admin can view all members
CREATE POLICY "System admin can view all members"
    ON group_members FOR SELECT
    USING (is_system_admin(auth.uid()));

-- System admin can view all tasks
CREATE POLICY "System admin can view all tasks"
    ON tasks FOR SELECT
    USING (is_system_admin(auth.uid()));

-- System admin can manage all tasks
CREATE POLICY "System admin can insert any task"
    ON tasks FOR INSERT
    WITH CHECK (is_system_admin(auth.uid()));

-- Update task_comments policies
CREATE POLICY "System admin can view all comments"
    ON task_comments FOR SELECT
    USING (is_system_admin(auth.uid()));

CREATE POLICY "System admin can manage comments"
    ON task_comments FOR ALL
    USING (is_system_admin(auth.uid()));

-- Update labels policies
CREATE POLICY "System admin can view all labels"
    ON labels FOR SELECT
    USING (is_system_admin(auth.uid()));

CREATE POLICY "System admin can manage labels"
    ON labels FOR ALL
    USING (is_system_admin(auth.uid()));

-- Update activity_log policies
CREATE POLICY "System admin can view all activity"
    ON activity_log FOR SELECT
    USING (is_system_admin(auth.uid()));

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_profiles (id, full_name, system_role)
    VALUES (
        NEW.id, 
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        'user'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_user_profile();

-- Update updated_at trigger for user_profiles
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create admin statistics view
CREATE OR REPLACE VIEW admin_statistics AS
SELECT
    (SELECT COUNT(*) FROM auth.users) as total_users,
    (SELECT COUNT(*) FROM groups WHERE NOT archived) as active_groups,
    (SELECT COUNT(*) FROM tasks) as total_tasks,
    (SELECT COUNT(*) FROM tasks WHERE status = 'done') as completed_tasks,
    (SELECT COUNT(*) FROM task_comments) as total_comments,
    (SELECT COUNT(DISTINCT user_id) FROM group_members) as active_members;

-- Grant access to admin statistics view
GRANT SELECT ON admin_statistics TO authenticated;

-- Create view for admin to see all users with their groups
CREATE OR REPLACE VIEW admin_users_overview AS
SELECT 
    u.id,
    u.email,
    u.created_at as user_created_at,
    u.last_sign_in_at,
    up.full_name,
    up.system_role,
    up.avatar_url,
    COALESCE(
        json_agg(
            json_build_object(
                'group_id', gm.group_id,
                'group_name', g.name,
                'role', gm.role,
                'joined_at', gm.joined_at
            )
        ) FILTER (WHERE gm.id IS NOT NULL),
        '[]'
    ) as groups
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.id
LEFT JOIN group_members gm ON u.id = gm.user_id
LEFT JOIN groups g ON gm.group_id = g.id
GROUP BY u.id, u.email, u.created_at, u.last_sign_in_at, up.full_name, up.system_role, up.avatar_url;

-- Grant access to admin users overview
GRANT SELECT ON admin_users_overview TO authenticated;

-- RLS policy for admin_users_overview
CREATE POLICY "Only system admin can view users overview"
    ON admin_users_overview FOR SELECT
    USING (is_system_admin(auth.uid()));

COMMENT ON TABLE user_profiles IS 'User profiles with system-level roles';
COMMENT ON COLUMN user_profiles.system_role IS 'System-wide role: admin (full access) or user (normal user)';
COMMENT ON COLUMN group_members.role IS 'Group-level role: owner, admin, project_manager, member, or viewer';
