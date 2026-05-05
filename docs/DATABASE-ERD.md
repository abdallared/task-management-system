# Database Entity Relationship Diagram (ERD)

## Visual Database Schema

This document provides a visual representation of the TaskFlow database schema.

---

## Complete ERD

```
┌─────────────────────────────────────────────────────────────────────┐
│                         auth.users (Supabase)                        │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ id (UUID, PK)                                                   │ │
│  │ email (TEXT, UNIQUE)                                            │ │
│  │ encrypted_password (TEXT)                                       │ │
│  │ email_confirmed_at (TIMESTAMPTZ)                                │ │
│  │ created_at (TIMESTAMPTZ)                                        │ │
│  └────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ Referenced by multiple tables
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
        ↓                         ↓                         ↓
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│     groups       │    │ group_invitations│    │  notifications   │
├──────────────────┤    ├──────────────────┤    ├──────────────────┤
│ id (UUID, PK)    │    │ id (UUID, PK)    │    │ id (UUID, PK)    │
│ name (TEXT)      │    │ group_id (FK)    │    │ user_id (FK)     │
│ description      │    │ email (TEXT)     │    │ type (TEXT)      │
│ created_by (FK)  │    │ role (TEXT)      │    │ title (TEXT)     │
│ archived (BOOL)  │    │ invited_by (FK)  │    │ message (TEXT)   │
│ created_at       │    │ token (TEXT)     │    │ link (TEXT)      │
│ updated_at       │    │ expires_at       │    │ read (BOOL)      │
└────────┬─────────┘    │ accepted (BOOL)  │    │ created_at       │
         │              │ created_at       │    └──────────────────┘
         │              └──────────────────┘
         │
         │ 1:N
         ↓
┌──────────────────┐
│  group_members   │
├──────────────────┤
│ id (UUID, PK)    │
│ group_id (FK)    │───┐
│ user_id (FK)     │   │
│ role (TEXT)      │   │
│ joined_at        │   │
└──────────────────┘   │
         │             │
         │             │
         │ UNIQUE(group_id, user_id)
         │             │
         │             │
         ↓             ↓
┌──────────────────────────────────────┐
│              labels                   │
├──────────────────────────────────────┤
│ id (UUID, PK)                        │
│ group_id (FK) ───────────────────────┤
│ name (TEXT)                          │
│ color (TEXT)                         │
│ created_at                           │
└──────────────────────────────────────┘
         │
         │
         │ Referenced by task_labels
         │
         ↓
┌──────────────────────────────────────────────────────────────┐
│                          tasks                                │
├──────────────────────────────────────────────────────────────┤
│ id (UUID, PK)                                                │
│ group_id (FK) ───────────────────────────────────────────────┤
│ title (TEXT)                                                 │
│ description (TEXT)                                           │
│ status (TEXT) - todo, in_progress, done, blocked            │
│ priority (TEXT) - low, medium, high, urgent                 │
│ created_by (FK)                                              │
│ due_date (TIMESTAMPTZ)                                       │
│ completed_at (TIMESTAMPTZ)                                   │
│ position (INTEGER)                                           │
│ parent_task_id (FK) - Self-referencing for subtasks         │
│ is_template (BOOL)                                           │
│ template_name (TEXT)                                         │
│ is_recurring (BOOL)                                          │
│ recurrence_pattern (TEXT)                                    │
│ recurrence_interval (INTEGER)                                │
│ recurrence_end_date (TIMESTAMPTZ)                            │
│ created_at (TIMESTAMPTZ)                                     │
│ updated_at (TIMESTAMPTZ)                                     │
└────────┬─────────────────────────────────────────────────────┘
         │
         │ 1:N relationships
         │
         ├──────────────────┬──────────────────┬──────────────────┐
         │                  │                  │                  │
         ↓                  ↓                  ↓                  ↓
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│task_assignments  │ │  task_comments   │ │  task_labels     │ │task_dependencies │
├──────────────────┤ ├──────────────────┤ ├──────────────────┤ ├──────────────────┤
│ id (UUID, PK)    │ │ id (UUID, PK)    │ │ task_id (FK, PK) │ │ id (UUID, PK)    │
│ task_id (FK)     │ │ task_id (FK)     │ │ label_id (FK,PK) │ │ task_id (FK)     │
│ user_id (FK)     │ │ user_id (FK)     │ └──────────────────┘ │ depends_on (FK)  │
│ assigned_by (FK) │ │ content (TEXT)   │                      │ created_at       │
│ assigned_at      │ │ mentions (UUID[])│                      └──────────────────┘
└──────────────────┘ │ created_at       │
                     │ updated_at       │
                     └──────────────────┘
         │
         ↓
┌──────────────────┐
│task_time_entries │
├──────────────────┤
│ id (UUID, PK)    │
│ task_id (FK)     │
│ user_id (FK)     │
│ started_at       │
│ ended_at         │
│ duration_minutes │
│ note (TEXT)      │
│ created_at       │
└──────────────────┘

┌──────────────────┐         ┌──────────────────┐
│  activity_log    │         │   audit_logs     │
├──────────────────┤         ├──────────────────┤
│ id (UUID, PK)    │         │ id (UUID, PK)    │
│ group_id (FK)    │         │ user_id (FK)     │
│ task_id (FK)     │         │ action (TEXT)    │
│ user_id (FK)     │         │ entity_type      │
│ action (TEXT)    │         │ entity_id (UUID) │
│ entity_type      │         │ ip_address (INET)│
│ changes (JSONB)  │         │ user_agent       │
│ created_at       │         │ details (JSONB)  │
└──────────────────┘         │ created_at       │
                             └──────────────────┘
```

---

## Relationship Types

### One-to-Many (1:N)

| Parent Table | Child Table | Relationship |
|--------------|-------------|--------------|
| auth.users | groups | User can create many groups |
| groups | group_members | Group has many members |
| groups | tasks | Group has many tasks |
| groups | labels | Group has many labels |
| groups | activity_log | Group has many activities |
| tasks | task_assignments | Task can have many assignments |
| tasks | task_comments | Task can have many comments |
| tasks | task_time_entries | Task can have many time entries |
| tasks | tasks (self) | Task can have many subtasks |
| auth.users | notifications | User has many notifications |

### Many-to-Many (N:M)

| Table 1 | Junction Table | Table 2 | Relationship |
|---------|----------------|---------|--------------|
| tasks | task_labels | labels | Tasks can have many labels, labels can be on many tasks |
| tasks | task_assignments | auth.users | Tasks can be assigned to many users, users can have many tasks |

### Self-Referencing

| Table | Foreign Key | Purpose |
|-------|-------------|---------|
| tasks | parent_task_id | Enables subtask hierarchy |
| task_dependencies | depends_on_task_id | Enables task dependencies |

---

## Key Constraints

### Primary Keys (PK)
All tables use UUID as primary key:
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
```

### Foreign Keys (FK)
All foreign keys use CASCADE or SET NULL:
```sql
-- CASCADE: Delete child when parent is deleted
group_id UUID REFERENCES groups(id) ON DELETE CASCADE

-- SET NULL: Keep child but clear reference
created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
```

### Unique Constraints
```sql
-- User can only be in a group once
UNIQUE(group_id, user_id) ON group_members

-- Label names unique per group
UNIQUE(group_id, name) ON labels

-- Task can only have a label once
PRIMARY KEY (task_id, label_id) ON task_labels

-- Task can only depend on another task once
UNIQUE(task_id, depends_on_task_id) ON task_dependencies
```

### Check Constraints
```sql
-- Status must be valid
CHECK (status IN ('todo', 'in_progress', 'done', 'blocked'))

-- Priority must be valid
CHECK (priority IN ('low', 'medium', 'high', 'urgent'))

-- Role must be valid
CHECK (role IN ('owner', 'admin', 'member', 'viewer'))

-- Task cannot depend on itself
CHECK (task_id != depends_on_task_id)

-- End time must be after start time
CHECK (ended_at IS NULL OR ended_at > started_at)
```

---

## Indexes

### Single Column Indexes
```sql
-- Foreign key indexes (for JOIN performance)
CREATE INDEX idx_tasks_group_id ON tasks(group_id);
CREATE INDEX idx_group_members_user_id ON group_members(user_id);
CREATE INDEX idx_task_assignments_user_id ON task_assignments(user_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);

-- Filter indexes (for WHERE clauses)
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_notifications_read ON notifications(read);

-- Sort indexes (for ORDER BY)
CREATE INDEX idx_activity_created_at ON activity_log(created_at DESC);
CREATE INDEX idx_comments_created_at ON task_comments(created_at DESC);
```

### Composite Indexes
```sql
-- Common query patterns
CREATE INDEX idx_tasks_group_status ON tasks(group_id, status);
CREATE INDEX idx_activity_group_time ON activity_log(group_id, created_at DESC);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, read);
```

### Partial Indexes
```sql
-- Only index active tasks
CREATE INDEX idx_active_tasks ON tasks(group_id) WHERE status != 'done';

-- Only index unread notifications
CREATE INDEX idx_unread_notifications ON notifications(user_id) WHERE read = FALSE;

-- Only index tasks with due dates
CREATE INDEX idx_tasks_due_date ON tasks(due_date) WHERE due_date IS NOT NULL;
```

---

## Data Types

### Common Types Used

| Type | Usage | Example |
|------|-------|---------|
| UUID | Primary keys, foreign keys | `550e8400-e29b-41d4-a716-446655440000` |
| TEXT | Strings (variable length) | `"Task title"` |
| TIMESTAMPTZ | Timestamps with timezone | `2026-05-05T12:00:00+00:00` |
| BOOLEAN | True/false flags | `true`, `false` |
| INTEGER | Whole numbers | `42` |
| JSONB | Structured data | `{"old": "value", "new": "value"}` |
| UUID[] | Array of UUIDs | `{uuid1, uuid2, uuid3}` |
| INET | IP addresses | `192.168.1.1` |

---

## Cardinality Estimates

### Expected Record Counts (per 1000 users)

| Table | Estimated Records | Growth Rate |
|-------|------------------|-------------|
| auth.users | 1,000 | Linear |
| groups | 500 | Linear |
| group_members | 2,000 | Linear |
| tasks | 50,000 | High |
| task_comments | 100,000 | High |
| task_assignments | 75,000 | High |
| notifications | 500,000 | Very High |
| activity_log | 1,000,000 | Very High |
| audit_logs | 100,000 | Medium |

### Archiving Strategy
- **activity_log**: Archive after 90 days
- **audit_logs**: Archive after 1 year
- **notifications**: Delete after 30 days (if read)
- **tasks**: Soft delete (archived flag)

---

## Database Size Estimates

### Per 1000 Active Users

| Component | Size | Notes |
|-----------|------|-------|
| Tables | ~500 MB | Core data |
| Indexes | ~200 MB | Performance |
| JSONB data | ~100 MB | Activity logs |
| Total | ~800 MB | Approximate |

### Growth Projections

| Users | Database Size | Notes |
|-------|---------------|-------|
| 1,000 | 800 MB | Initial |
| 10,000 | 8 GB | Small business |
| 100,000 | 80 GB | Enterprise |
| 1,000,000 | 800 GB | Large scale |

---

## Query Patterns

### Most Common Queries

1. **Get user's groups**
```sql
SELECT g.* FROM groups g
INNER JOIN group_members gm ON g.id = gm.group_id
WHERE gm.user_id = $1;
```

2. **Get tasks in group**
```sql
SELECT t.* FROM tasks t
WHERE t.group_id = $1
AND t.status != 'done'
ORDER BY t.priority DESC, t.due_date ASC;
```

3. **Get task with details**
```sql
SELECT 
  t.*,
  json_agg(DISTINCT ta.user_id) as assignees,
  json_agg(DISTINCT tl.label_id) as labels,
  COUNT(DISTINCT tc.id) as comment_count
FROM tasks t
LEFT JOIN task_assignments ta ON t.id = ta.task_id
LEFT JOIN task_labels tl ON t.id = tl.task_id
LEFT JOIN task_comments tc ON t.id = tc.task_id
WHERE t.id = $1
GROUP BY t.id;
```

4. **Get unread notifications**
```sql
SELECT * FROM notifications
WHERE user_id = $1 AND read = FALSE
ORDER BY created_at DESC
LIMIT 20;
```

---

## Performance Considerations

### Optimization Strategies

1. **Indexes**: All foreign keys and common filters indexed
2. **Partitioning**: Consider for activity_log and notifications
3. **Archiving**: Move old data to archive tables
4. **Caching**: Use React Query for client-side caching
5. **Connection Pooling**: PgBouncer for connection management

### Query Optimization

- Use `EXPLAIN ANALYZE` to check query plans
- Avoid N+1 queries with proper JOINs
- Use partial indexes for filtered queries
- Limit result sets with pagination
- Use covering indexes where possible

---

**Document Version**: 1.0.0  
**Last Updated**: May 5, 2026
