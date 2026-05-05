# TaskFlow - Complete System Documentation

This comprehensive documentation covers all aspects of the TaskFlow task management system.

## Quick Links
- [System Overview](./01-SYSTEM-OVERVIEW.md)
- [Software Requirements Specification](./02-SRS.md)
- [System Architecture](./03-ARCHITECTURE.md)
- Database Design (see below)
- API Documentation (see below)

---

# DATABASE SCHEMA

Complete SQL schema for TaskFlow system.

\\\sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- GROUPS TABLE
-- ============================================
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(name) <= 100),
  description TEXT CHECK (char_length(description) <= 500),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  archived BOOLEAN DEFAULT FALSE,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_groups_created_by ON groups(created_by);
CREATE INDEX idx_groups_archived ON groups(archived) WHERE archived = FALSE;

-- ============================================
-- GROUP MEMBERS TABLE
-- ============================================
CREATE TABLE group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

CREATE INDEX idx_group_members_group_id ON group_members(group_id);
CREATE INDEX idx_group_members_user_id ON group_members(user_id);
CREATE INDEX idx_group_members_role ON group_members(role);

-- ============================================
-- GROUP INVITATIONS TABLE
-- ============================================
CREATE TABLE group_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'member', 'viewer')),
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invitations_token ON group_invitations(token);
CREATE INDEX idx_invitations_email ON group_invitations(email);
CREATE INDEX idx_invitations_expires ON group_invitations(expires_at);

-- ============================================
-- LABELS TABLE
-- ============================================
CREATE TABLE labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) <= 50),
  color TEXT NOT NULL CHECK (color ~ '^#[0-9A-Fa-f]{6}\$'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, name)
);

CREATE INDEX idx_labels_group_id ON labels(group_id);

-- ============================================
-- TASKS TABLE
-- ============================================
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) <= 200),
  description TEXT,
  status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done', 'blocked')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  position INTEGER DEFAULT 0,
  parent_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  is_template BOOLEAN DEFAULT FALSE,
  template_name TEXT,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_pattern TEXT CHECK (recurrence_pattern IN ('daily', 'weekly', 'monthly', 'custom')),
  recurrence_interval INTEGER CHECK (recurrence_interval > 0),
  recurrence_end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tasks_group_id ON tasks(group_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_due_date ON tasks(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX idx_tasks_created_by ON tasks(created_by);
CREATE INDEX idx_tasks_parent ON tasks(parent_task_id) WHERE parent_task_id IS NOT NULL;
CREATE INDEX idx_tasks_group_status ON tasks(group_id, status);
CREATE INDEX idx_active_tasks ON tasks(group_id) WHERE status != 'done';

-- ============================================
-- TASK ASSIGNMENTS TABLE
-- ============================================
CREATE TABLE task_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(task_id, user_id)
);

CREATE INDEX idx_task_assignments_task_id ON task_assignments(task_id);
CREATE INDEX idx_task_assignments_user_id ON task_assignments(user_id);

-- ============================================
-- TASK LABELS TABLE (Many-to-Many)
-- ============================================
CREATE TABLE task_labels (
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  label_id UUID NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, label_id)
);

CREATE INDEX idx_task_labels_task_id ON task_labels(task_id);
CREATE INDEX idx_task_labels_label_id ON task_labels(label_id);

-- ============================================
-- TASK DEPENDENCIES TABLE
-- ============================================
CREATE TABLE task_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  depends_on_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(task_id, depends_on_task_id),
  CHECK (task_id != depends_on_task_id)
);

CREATE INDEX idx_task_deps_task_id ON task_dependencies(task_id);
CREATE INDEX idx_task_deps_depends_on ON task_dependencies(depends_on_task_id);

-- ============================================
-- TASK COMMENTS TABLE
-- ============================================
CREATE TABLE task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL CHECK (char_length(content) > 0),
  mentions UUID[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_comments_task_id ON task_comments(task_id);
CREATE INDEX idx_comments_user_id ON task_comments(user_id);
CREATE INDEX idx_comments_created_at ON task_comments(created_at DESC);

-- ============================================
-- TASK TIME ENTRIES TABLE
-- ============================================
CREATE TABLE task_time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (ended_at IS NULL OR ended_at > started_at)
);

CREATE INDEX idx_time_entries_task_id ON task_time_entries(task_id);
CREATE INDEX idx_time_entries_user_id ON task_time_entries(user_id);

-- ============================================
-- ACTIVITY LOG TABLE
-- ============================================
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  changes JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activity_group_id ON activity_log(group_id);
CREATE INDEX idx_activity_task_id ON activity_log(task_id);
CREATE INDEX idx_activity_user_id ON activity_log(user_id);
CREATE INDEX idx_activity_created_at ON activity_log(created_at DESC);
CREATE INDEX idx_activity_group_time ON activity_log(group_id, created_at DESC);

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  link TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_unread_notifications ON notifications(user_id) WHERE read = FALSE;

-- ============================================
-- AUDIT LOGS TABLE
-- ============================================
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  ip_address INET,
  user_agent TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_created_at ON audit_logs(created_at DESC);
\\\

---

# ROW LEVEL SECURITY (RLS) POLICIES

\\\sql
-- Enable RLS on all tables
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- GROUPS POLICIES
-- ============================================

-- Users can view groups they're members of
CREATE POLICY "Users can view their groups"
ON groups FOR SELECT
USING (
  id IN (
    SELECT group_id FROM group_members 
    WHERE user_id = auth.uid()
  )
);

-- Any authenticated user can create a group
CREATE POLICY "Authenticated users can create groups"
ON groups FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Owners and admins can update groups
CREATE POLICY "Owners and admins can update groups"
ON groups FOR UPDATE
USING (
  id IN (
    SELECT group_id FROM group_members 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin')
  )
);

-- Only owners can delete groups
CREATE POLICY "Only owners can delete groups"
ON groups FOR DELETE
USING (
  id IN (
    SELECT group_id FROM group_members 
    WHERE user_id = auth.uid() 
    AND role = 'owner'
  )
);

-- ============================================
-- GROUP MEMBERS POLICIES
-- ============================================

-- Users can view members of their groups
CREATE POLICY "Users can view group members"
ON group_members FOR SELECT
USING (
  group_id IN (
    SELECT group_id FROM group_members 
    WHERE user_id = auth.uid()
  )
);

-- Owners and admins can add members
CREATE POLICY "Owners and admins can add members"
ON group_members FOR INSERT
WITH CHECK (
  group_id IN (
    SELECT group_id FROM group_members 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin')
  )
);

-- Owners and admins can update member roles
CREATE POLICY "Owners and admins can update members"
ON group_members FOR UPDATE
USING (
  group_id IN (
    SELECT group_id FROM group_members 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin')
  )
);

-- Owners and admins can remove members (except owner)
CREATE POLICY "Owners and admins can remove members"
ON group_members FOR DELETE
USING (
  group_id IN (
    SELECT group_id FROM group_members 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin')
  )
  AND role != 'owner'
);

-- ============================================
-- TASKS POLICIES
-- ============================================

-- Users can view tasks in their groups
CREATE POLICY "Users can view group tasks"
ON tasks FOR SELECT
USING (
  group_id IN (
    SELECT group_id FROM group_members 
    WHERE user_id = auth.uid()
  )
);

-- Members can create tasks
CREATE POLICY "Members can create tasks"
ON tasks FOR INSERT
WITH CHECK (
  group_id IN (
    SELECT group_id FROM group_members 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin', 'member')
  )
);

-- Members can update tasks
CREATE POLICY "Members can update tasks"
ON tasks FOR UPDATE
USING (
  group_id IN (
    SELECT group_id FROM group_members 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin', 'member')
  )
);

-- Admins and owners can delete tasks
CREATE POLICY "Admins can delete tasks"
ON tasks FOR DELETE
USING (
  group_id IN (
    SELECT group_id FROM group_members 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin')
  )
);

-- ============================================
-- TASK COMMENTS POLICIES
-- ============================================

-- Users can view comments on tasks they can see
CREATE POLICY "Users can view task comments"
ON task_comments FOR SELECT
USING (
  task_id IN (
    SELECT t.id FROM tasks t
    INNER JOIN group_members gm ON t.group_id = gm.group_id
    WHERE gm.user_id = auth.uid()
  )
);

-- Members can add comments
CREATE POLICY "Members can add comments"
ON task_comments FOR INSERT
WITH CHECK (
  task_id IN (
    SELECT t.id FROM tasks t
    INNER JOIN group_members gm ON t.group_id = gm.group_id
    WHERE gm.user_id = auth.uid() 
    AND gm.role IN ('owner', 'admin', 'member')
  )
);

-- Users can update their own comments
CREATE POLICY "Users can update own comments"
ON task_comments FOR UPDATE
USING (user_id = auth.uid());

-- Users can delete their own comments, admins can delete any
CREATE POLICY "Users can delete own comments"
ON task_comments FOR DELETE
USING (
  user_id = auth.uid()
  OR
  task_id IN (
    SELECT t.id FROM tasks t
    INNER JOIN group_members gm ON t.group_id = gm.group_id
    WHERE gm.user_id = auth.uid() 
    AND gm.role IN ('owner', 'admin')
  )
);

-- ============================================
-- NOTIFICATIONS POLICIES
-- ============================================

-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications"
ON notifications FOR SELECT
USING (user_id = auth.uid());

-- System can create notifications (via triggers/functions)
CREATE POLICY "System can create notifications"
ON notifications FOR INSERT
WITH CHECK (true);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
ON notifications FOR UPDATE
USING (user_id = auth.uid());

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
ON notifications FOR DELETE
USING (user_id = auth.uid());

-- ============================================
-- ACTIVITY LOG POLICIES
-- ============================================

-- Users can view activity in their groups
CREATE POLICY "Users can view group activity"
ON activity_log FOR SELECT
USING (
  group_id IN (
    SELECT group_id FROM group_members 
    WHERE user_id = auth.uid()
  )
);

-- System can create activity logs (via triggers)
CREATE POLICY "System can create activity logs"
ON activity_log FOR INSERT
WITH CHECK (true);
\\\

---

# API DOCUMENTATION

## Authentication

All API requests require authentication via JWT token.

### Headers
\\\
Authorization: Bearer <JWT_TOKEN>
apikey: <SUPABASE_ANON_KEY>
Content-Type: application/json
\\\

## Base URL
\\\
https://<project-ref>.supabase.co/rest/v1
\\\

---

## Groups API

### List Groups
\\\http
GET /groups
\\\

**Response:**
\\\json
[
  {
    "id": "uuid",
    "name": "My Team",
    "description": "Team workspace",
    "created_by": "uuid",
    "archived": false,
    "created_at": "2026-05-05T00:00:00Z",
    "updated_at": "2026-05-05T00:00:00Z"
  }
]
\\\

### Create Group
\\\http
POST /groups
\\\

**Request Body:**
\\\json
{
  "name": "New Team",
  "description": "Optional description"
}
\\\

### Update Group
\\\http
PATCH /groups?id=eq.<group_id>
\\\

**Request Body:**
\\\json
{
  "name": "Updated Name",
  "description": "Updated description"
}
\\\

### Delete Group
\\\http
DELETE /groups?id=eq.<group_id>
\\\

---

## Tasks API

### List Tasks
\\\http
GET /tasks?group_id=eq.<group_id>&select=*,assignments:task_assignments(user:auth.users(*)),labels:task_labels(label:labels(*))
\\\

**Query Parameters:**
- \group_id\: Filter by group
- \status\: Filter by status (todo, in_progress, done, blocked)
- \priority\: Filter by priority
- \ssigned_to\: Filter by assignee

**Response:**
\\\json
[
  {
    "id": "uuid",
    "group_id": "uuid",
    "title": "Task title",
    "description": "Task description",
    "status": "todo",
    "priority": "high",
    "due_date": "2026-05-10T00:00:00Z",
    "created_by": "uuid",
    "created_at": "2026-05-05T00:00:00Z",
    "assignments": [
      {
        "user": {
          "id": "uuid",
          "email": "user@example.com"
        }
      }
    ],
    "labels": [
      {
        "label": {
          "id": "uuid",
          "name": "bug",
          "color": "#ff0000"
        }
      }
    ]
  }
]
\\\

### Create Task
\\\http
POST /tasks
\\\

**Request Body:**
\\\json
{
  "group_id": "uuid",
  "title": "New task",
  "description": "Task description",
  "status": "todo",
  "priority": "medium",
  "due_date": "2026-05-10T00:00:00Z"
}
\\\

### Update Task
\\\http
PATCH /tasks?id=eq.<task_id>
\\\

**Request Body:**
\\\json
{
  "status": "in_progress",
  "priority": "high"
}
\\\

### Delete Task
\\\http
DELETE /tasks?id=eq.<task_id>
\\\

---

## Comments API

### List Comments
\\\http
GET /task_comments?task_id=eq.<task_id>&select=*,user:auth.users(*)
\\\

### Create Comment
\\\http
POST /task_comments
\\\

**Request Body:**
\\\json
{
  "task_id": "uuid",
  "content": "Comment text",
  "mentions": ["user_id_1", "user_id_2"]
}
\\\

---

## Notifications API

### List Notifications
\\\http
GET /notifications?user_id=eq.<user_id>&order=created_at.desc
\\\

### Mark as Read
\\\http
PATCH /notifications?id=eq.<notification_id>
\\\

**Request Body:**
\\\json
{
  "read": true
}
\\\

---

## Real-time Subscriptions

### Subscribe to Task Changes
\\\javascript
const channel = supabase
  .channel('tasks:group_id')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'tasks',
    filter: 'group_id=eq.<group_id>'
  }, (payload) => {
    console.log('Task changed:', payload)
  })
  .subscribe()
\\\

### Subscribe to Notifications
\\\javascript
const channel = supabase
  .channel('notifications:user_id')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'notifications',
    filter: 'user_id=eq.<user_id>'
  }, (payload) => {
    console.log('New notification:', payload)
  })
  .subscribe()
\\\

---

**Document Version**: 1.0.0  
**Last Updated**: May 5, 2026
