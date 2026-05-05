# API Usage Examples

Complete examples for using the TaskFlow API with Supabase client.

---

## Setup

### Install Supabase Client

```bash
npm install @supabase/supabase-js
```

### Initialize Client

```javascript
// src/services/supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

---

## Authentication

### Sign Up

```javascript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'securePassword123',
  options: {
    data: {
      full_name: 'John Doe'
    }
  }
})

if (error) {
  console.error('Sign up error:', error.message)
} else {
  console.log('User created:', data.user)
  // User will receive verification email
}
```

### Sign In

```javascript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'securePassword123'
})

if (error) {
  console.error('Login error:', error.message)
} else {
  console.log('Logged in:', data.user)
  console.log('Session:', data.session)
}
```

### Get Current User

```javascript
const { data: { user } } = await supabase.auth.getUser()

if (user) {
  console.log('Current user:', user)
} else {
  console.log('No user logged in')
}
```

### Sign Out

```javascript
const { error } = await supabase.auth.signOut()

if (error) {
  console.error('Logout error:', error.message)
} else {
  console.log('Logged out successfully')
}
```

### Password Reset

```javascript
// Request reset email
const { error } = await supabase.auth.resetPasswordForEmail(
  'user@example.com',
  {
    redirectTo: 'https://yourapp.com/reset-password'
  }
)

// Update password (after clicking reset link)
const { error } = await supabase.auth.updateUser({
  password: 'newSecurePassword123'
})
```

---

## Groups

### Create Group

```javascript
const { data, error } = await supabase
  .from('groups')
  .insert({
    name: 'My Team',
    description: 'Our awesome team workspace'
  })
  .select()
  .single()

if (error) {
  console.error('Error creating group:', error.message)
} else {
  console.log('Group created:', data)
  
  // Add creator as owner
  const { error: memberError } = await supabase
    .from('group_members')
    .insert({
      group_id: data.id,
      user_id: (await supabase.auth.getUser()).data.user.id,
      role: 'owner'
    })
}
```

### List User's Groups

```javascript
const { data, error } = await supabase
  .from('groups')
  .select(`
    *,
    members:group_members(count)
  `)
  .order('created_at', { ascending: false })

if (error) {
  console.error('Error fetching groups:', error.message)
} else {
  console.log('User groups:', data)
}
```

### Get Group Details

```javascript
const { data, error } = await supabase
  .from('groups')
  .select(`
    *,
    members:group_members(
      id,
      role,
      joined_at,
      user:auth.users(id, email)
    ),
    tasks:tasks(count)
  `)
  .eq('id', groupId)
  .single()

if (error) {
  console.error('Error fetching group:', error.message)
} else {
  console.log('Group details:', data)
}
```

### Update Group

```javascript
const { data, error } = await supabase
  .from('groups')
  .update({
    name: 'Updated Team Name',
    description: 'New description'
  })
  .eq('id', groupId)
  .select()
  .single()

if (error) {
  console.error('Error updating group:', error.message)
} else {
  console.log('Group updated:', data)
}
```

### Delete Group (Archive)

```javascript
const { data, error } = await supabase
  .from('groups')
  .update({
    archived: true,
    archived_at: new Date().toISOString()
  })
  .eq('id', groupId)

if (error) {
  console.error('Error archiving group:', error.message)
} else {
  console.log('Group archived')
}
```

---

## Group Members

### Invite Member

```javascript
import { nanoid } from 'nanoid'

const token = nanoid(32)
const expiresAt = new Date()
expiresAt.setDate(expiresAt.getDate() + 7) // 7 days

const { data, error } = await supabase
  .from('group_invitations')
  .insert({
    group_id: groupId,
    email: 'newmember@example.com',
    role: 'member',
    invited_by: (await supabase.auth.getUser()).data.user.id,
    token: token,
    expires_at: expiresAt.toISOString()
  })
  .select()
  .single()

if (error) {
  console.error('Error creating invitation:', error.message)
} else {
  console.log('Invitation created:', data)
  // Send email with invitation link
  const inviteLink = `https://yourapp.com/invite/${token}`
}
```

### Accept Invitation

```javascript
// Verify token
const { data: invitation, error } = await supabase
  .from('group_invitations')
  .select('*, group:groups(*)')
  .eq('token', token)
  .eq('accepted', false)
  .gt('expires_at', new Date().toISOString())
  .single()

if (error || !invitation) {
  console.error('Invalid or expired invitation')
} else {
  // Add user to group
  const { error: memberError } = await supabase
    .from('group_members')
    .insert({
      group_id: invitation.group_id,
      user_id: (await supabase.auth.getUser()).data.user.id,
      role: invitation.role
    })
  
  // Mark invitation as accepted
  await supabase
    .from('group_invitations')
    .update({ accepted: true })
    .eq('id', invitation.id)
  
  console.log('Joined group:', invitation.group)
}
```

### List Group Members

```javascript
const { data, error } = await supabase
  .from('group_members')
  .select(`
    id,
    role,
    joined_at,
    user:auth.users(id, email)
  `)
  .eq('group_id', groupId)
  .order('joined_at', { ascending: true })

if (error) {
  console.error('Error fetching members:', error.message)
} else {
  console.log('Group members:', data)
}
```

### Update Member Role

```javascript
const { data, error } = await supabase
  .from('group_members')
  .update({ role: 'admin' })
  .eq('id', memberId)

if (error) {
  console.error('Error updating role:', error.message)
} else {
  console.log('Role updated')
}
```

### Remove Member

```javascript
const { error } = await supabase
  .from('group_members')
  .delete()
  .eq('id', memberId)

if (error) {
  console.error('Error removing member:', error.message)
} else {
  console.log('Member removed')
}
```

---

## Tasks

### Create Task

```javascript
const { data, error } = await supabase
  .from('tasks')
  .insert({
    group_id: groupId,
    title: 'Implement user authentication',
    description: 'Add login and signup functionality',
    status: 'todo',
    priority: 'high',
    due_date: '2026-05-15T00:00:00Z',
    created_by: (await supabase.auth.getUser()).data.user.id
  })
  .select()
  .single()

if (error) {
  console.error('Error creating task:', error.message)
} else {
  console.log('Task created:', data)
}
```

### List Tasks

```javascript
const { data, error } = await supabase
  .from('tasks')
  .select(`
    *,
    created_by_user:auth.users!created_by(id, email),
    assignments:task_assignments(
      user:auth.users(id, email)
    ),
    labels:task_labels(
      label:labels(id, name, color)
    ),
    comments:task_comments(count),
    subtasks:tasks!parent_task_id(count)
  `)
  .eq('group_id', groupId)
  .is('parent_task_id', null) // Only top-level tasks
  .order('position', { ascending: true })

if (error) {
  console.error('Error fetching tasks:', error.message)
} else {
  console.log('Tasks:', data)
}
```

### Filter Tasks

```javascript
// By status
const { data } = await supabase
  .from('tasks')
  .select('*')
  .eq('group_id', groupId)
  .eq('status', 'in_progress')

// By assignee
const { data } = await supabase
  .from('tasks')
  .select(`
    *,
    assignments:task_assignments!inner(user_id)
  `)
  .eq('group_id', groupId)
  .eq('assignments.user_id', userId)

// By due date range
const { data } = await supabase
  .from('tasks')
  .select('*')
  .eq('group_id', groupId)
  .gte('due_date', '2026-05-01')
  .lte('due_date', '2026-05-31')

// Search by title
const { data } = await supabase
  .from('tasks')
  .select('*')
  .eq('group_id', groupId)
  .ilike('title', '%authentication%')
```

### Update Task

```javascript
const { data, error } = await supabase
  .from('tasks')
  .update({
    status: 'in_progress',
    priority: 'urgent'
  })
  .eq('id', taskId)
  .select()
  .single()

if (error) {
  console.error('Error updating task:', error.message)
} else {
  console.log('Task updated:', data)
}
```

### Complete Task

```javascript
const { data, error } = await supabase
  .from('tasks')
  .update({
    status: 'done',
    completed_at: new Date().toISOString()
  })
  .eq('id', taskId)

if (error) {
  console.error('Error completing task:', error.message)
} else {
  console.log('Task completed')
}
```

### Delete Task

```javascript
const { error } = await supabase
  .from('tasks')
  .delete()
  .eq('id', taskId)

if (error) {
  console.error('Error deleting task:', error.message)
} else {
  console.log('Task deleted')
}
```

### Assign Task

```javascript
const { data, error } = await supabase
  .from('task_assignments')
  .insert({
    task_id: taskId,
    user_id: assigneeUserId,
    assigned_by: (await supabase.auth.getUser()).data.user.id
  })

if (error) {
  console.error('Error assigning task:', error.message)
} else {
  console.log('Task assigned')
}
```

### Create Subtask

```javascript
const { data, error } = await supabase
  .from('tasks')
  .insert({
    group_id: groupId,
    parent_task_id: parentTaskId,
    title: 'Subtask title',
    status: 'todo',
    priority: 'medium'
  })
  .select()
  .single()

if (error) {
  console.error('Error creating subtask:', error.message)
} else {
  console.log('Subtask created:', data)
}
```

---

## Labels

### Create Label

```javascript
const { data, error } = await supabase
  .from('labels')
  .insert({
    group_id: groupId,
    name: 'Bug',
    color: '#ff0000'
  })
  .select()
  .single()

if (error) {
  console.error('Error creating label:', error.message)
} else {
  console.log('Label created:', data)
}
```

### Add Label to Task

```javascript
const { error } = await supabase
  .from('task_labels')
  .insert({
    task_id: taskId,
    label_id: labelId
  })

if (error) {
  console.error('Error adding label:', error.message)
} else {
  console.log('Label added to task')
}
```

---

## Comments

### Add Comment

```javascript
const { data, error } = await supabase
  .from('task_comments')
  .insert({
    task_id: taskId,
    user_id: (await supabase.auth.getUser()).data.user.id,
    content: 'This is a comment with @mention',
    mentions: [mentionedUserId]
  })
  .select()
  .single()

if (error) {
  console.error('Error adding comment:', error.message)
} else {
  console.log('Comment added:', data)
}
```

### List Comments

```javascript
const { data, error } = await supabase
  .from('task_comments')
  .select(`
    *,
    user:auth.users(id, email)
  `)
  .eq('task_id', taskId)
  .order('created_at', { ascending: true })

if (error) {
  console.error('Error fetching comments:', error.message)
} else {
  console.log('Comments:', data)
}
```

### Edit Comment

```javascript
const { data, error } = await supabase
  .from('task_comments')
  .update({
    content: 'Updated comment text',
    updated_at: new Date().toISOString()
  })
  .eq('id', commentId)
  .select()
  .single()

if (error) {
  console.error('Error updating comment:', error.message)
} else {
  console.log('Comment updated:', data)
}
```

---

## Time Tracking

### Start Timer

```javascript
const { data, error } = await supabase
  .from('task_time_entries')
  .insert({
    task_id: taskId,
    user_id: (await supabase.auth.getUser()).data.user.id,
    started_at: new Date().toISOString()
  })
  .select()
  .single()

if (error) {
  console.error('Error starting timer:', error.message)
} else {
  console.log('Timer started:', data)
  // Store entry ID in state
  localStorage.setItem('activeTimer', data.id)
}
```

### Stop Timer

```javascript
const entryId = localStorage.getItem('activeTimer')
const endTime = new Date()

// Get start time
const { data: entry } = await supabase
  .from('task_time_entries')
  .select('started_at')
  .eq('id', entryId)
  .single()

const startTime = new Date(entry.started_at)
const durationMinutes = Math.round((endTime - startTime) / 1000 / 60)

const { data, error } = await supabase
  .from('task_time_entries')
  .update({
    ended_at: endTime.toISOString(),
    duration_minutes: durationMinutes
  })
  .eq('id', entryId)
  .select()
  .single()

if (error) {
  console.error('Error stopping timer:', error.message)
} else {
  console.log('Timer stopped:', data)
  localStorage.removeItem('activeTimer')
}
```

### Get Task Time Summary

```javascript
const { data, error } = await supabase
  .from('task_time_entries')
  .select('duration_minutes, user:auth.users(email)')
  .eq('task_id', taskId)
  .not('duration_minutes', 'is', null)

if (error) {
  console.error('Error fetching time entries:', error.message)
} else {
  const totalMinutes = data.reduce((sum, entry) => sum + entry.duration_minutes, 0)
  console.log(`Total time: ${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`)
}
```

---

## Notifications

### List Notifications

```javascript
const { data, error } = await supabase
  .from('notifications')
  .select('*')
  .eq('user_id', (await supabase.auth.getUser()).data.user.id)
  .order('created_at', { ascending: false })
  .limit(20)

if (error) {
  console.error('Error fetching notifications:', error.message)
} else {
  console.log('Notifications:', data)
}
```

### Mark as Read

```javascript
const { error } = await supabase
  .from('notifications')
  .update({ read: true })
  .eq('id', notificationId)

if (error) {
  console.error('Error marking notification as read:', error.message)
} else {
  console.log('Notification marked as read')
}
```

### Mark All as Read

```javascript
const { error } = await supabase
  .from('notifications')
  .update({ read: true })
  .eq('user_id', (await supabase.auth.getUser()).data.user.id)
  .eq('read', false)

if (error) {
  console.error('Error marking all as read:', error.message)
} else {
  console.log('All notifications marked as read')
}
```

---

## Real-time Subscriptions

### Subscribe to Task Changes

```javascript
const channel = supabase
  .channel(`tasks:${groupId}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'tasks',
    filter: `group_id=eq.${groupId}`
  }, (payload) => {
    console.log('Task change:', payload)
    
    if (payload.eventType === 'INSERT') {
      console.log('New task:', payload.new)
    } else if (payload.eventType === 'UPDATE') {
      console.log('Task updated:', payload.new)
    } else if (payload.eventType === 'DELETE') {
      console.log('Task deleted:', payload.old)
    }
  })
  .subscribe()

// Unsubscribe when done
channel.unsubscribe()
```

### Subscribe to Comments

```javascript
const channel = supabase
  .channel(`comments:${taskId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'task_comments',
    filter: `task_id=eq.${taskId}`
  }, (payload) => {
    console.log('New comment:', payload.new)
  })
  .subscribe()
```

### Subscribe to Notifications

```javascript
const userId = (await supabase.auth.getUser()).data.user.id

const channel = supabase
  .channel(`notifications:${userId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'notifications',
    filter: `user_id=eq.${userId}`
  }, (payload) => {
    console.log('New notification:', payload.new)
    // Show toast notification
  })
  .subscribe()
```

---

## Error Handling

### Best Practices

```javascript
async function createTask(taskData) {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .insert(taskData)
      .select()
      .single()
    
    if (error) {
      // Handle specific errors
      if (error.code === '23505') {
        throw new Error('Task already exists')
      } else if (error.code === '23503') {
        throw new Error('Invalid group or user reference')
      } else if (error.code === 'PGRST116') {
        throw new Error('RLS policy violation - check permissions')
      } else {
        throw new Error(error.message)
      }
    }
    
    return data
  } catch (err) {
    console.error('Error creating task:', err)
    throw err
  }
}
```

---

## Batch Operations

### Create Multiple Tasks

```javascript
const tasks = [
  { group_id: groupId, title: 'Task 1', status: 'todo' },
  { group_id: groupId, title: 'Task 2', status: 'todo' },
  { group_id: groupId, title: 'Task 3', status: 'todo' }
]

const { data, error } = await supabase
  .from('tasks')
  .insert(tasks)
  .select()

if (error) {
  console.error('Error creating tasks:', error.message)
} else {
  console.log(`Created ${data.length} tasks`)
}
```

### Update Multiple Tasks

```javascript
const { data, error } = await supabase
  .from('tasks')
  .update({ status: 'done' })
  .in('id', [taskId1, taskId2, taskId3])

if (error) {
  console.error('Error updating tasks:', error.message)
} else {
  console.log('Tasks updated')
}
```

---

**Document Version**: 1.0.0  
**Last Updated**: May 5, 2026
